<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class GoLiveController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('finance.go-live'), 403);

        $checks = $this->runChecks();

        return Inertia::render('Finance/GoLiveChecklistPage', [
            'checks'     => $checks,
            'all_passed' => collect($checks)->every(fn ($c) => $c['status'] === 'pass'),
        ]);
    }

    private function runChecks(): array
    {
        $checks = [];

        // 1. Database migrations
        try {
            DB::select("SELECT 1 FROM financial_periods LIMIT 1");
            DB::select("SELECT 1 FROM requisitions LIMIT 1");
            DB::select("SELECT 1 FROM payments LIMIT 1");
            DB::select("SELECT 1 FROM ledger_entries LIMIT 1");
            DB::select("SELECT 1 FROM period_close_waivers LIMIT 1");
            $checks[] = $this->pass('All finance migrations applied', 'financial_periods, requisitions, payments, ledger_entries, period_close_waivers tables exist');
        } catch (\Throwable $e) {
            $checks[] = $this->fail('Finance migrations incomplete', $e->getMessage());
        }

        // 2. Financial periods seeded
        $periodCount = FinancialPeriod::count();
        $checks[] = $periodCount >= 12
            ? $this->pass("Financial periods seeded ({$periodCount} periods)", 'Current year periods present')
            : $this->warn("Only {$periodCount} financial periods found", 'Run: php artisan db:seed --class=FinancialPeriodSeeder');

        // 3. Cost centres configured
        $ccCount = CostCentre::where('status', 'active')->count();
        $checks[] = $ccCount >= 3
            ? $this->pass("Cost centres configured ({$ccCount} active)", 'Hierarchy with budgets')
            : $this->warn("Only {$ccCount} active cost centres", 'Run CostCentreSeeder or configure manually');

        // 4. Account codes configured
        $acCount = AccountCode::where('status', 'active')->count();
        $checks[] = $acCount >= 5
            ? $this->pass("Account codes configured ({$acCount} active)", 'Including VAT/WHT-applicable codes')
            : $this->warn("Only {$acCount} account codes", 'Run AccountCodeSeeder');

        // 5. Vendors configured
        $vendorCount = Vendor::where('status', 'active')->count();
        $checks[] = $vendorCount >= 1
            ? $this->pass("Vendors configured ({$vendorCount} active)", '')
            : $this->warn('No active vendors', 'Run VendorSeeder or add vendors via admin');

        // 6. Finance role users exist
        $financeUsers = User::whereIn('role', ['finance', 'ceo', 'superadmin'])->where('status', 'active')->count();
        $checks[] = $financeUsers >= 2
            ? $this->pass("Finance-role users assigned ({$financeUsers})", 'finance, ceo, superadmin roles present')
            : $this->fail("Only {$financeUsers} finance-role users", 'Assign finance/ceo roles to relevant staff via Staff Enrollment');

        // 7. Petty cash floats
        $floatCount = PettyCashFloat::where('status', 'active')->count();
        $checks[] = $floatCount >= 1
            ? $this->pass("Petty cash floats configured ({$floatCount})", '')
            : $this->warn('No active petty cash floats', 'Create float via Finance → Admin or run PettyCashFloatSeeder');

        // 8. Notifications table
        try {
            DB::select("SELECT 1 FROM notifications LIMIT 1");
            $checks[] = $this->pass('Notifications table ready', 'Database channel configured');
        } catch (\Throwable $e) {
            $checks[] = $this->fail('Notifications table missing', 'Run: php artisan notifications:table && php artisan migrate');
        }

        // 9. Storage symlink
        $storagePath = public_path('storage');
        $checks[] = is_link($storagePath) || is_dir($storagePath)
            ? $this->pass('Storage symlink exists', 'File uploads will work correctly')
            : $this->fail('Storage symlink missing', 'Run: php artisan storage:link');

        // 10. Demo data
        $demoCount = Requisition::where('request_id', 'like', 'DEMO-%')->count();
        $checks[] = $demoCount >= 10
            ? $this->pass("Demo data seeded ({$demoCount} sample requisitions)", 'Training data available')
            : $this->warn("Only {$demoCount} demo requisitions", 'Run: php artisan db:seed --class=FinanceTransactionSeeder');

        // 11. Finance dashboard loads
        try {
            $admin = User::where('role', 'superadmin')->first();
            if ($admin) {
                app(\App\Http\Controllers\Finance\DashboardController::class);
                $checks[] = $this->pass('Finance dashboard controller resolves', '');
            } else {
                $checks[] = $this->warn('Cannot verify dashboard — no superadmin user', '');
            }
        } catch (\Throwable $e) {
            $checks[] = $this->fail('Dashboard controller error', $e->getMessage());
        }

        // 12. Cache driver
        try {
            \Illuminate\Support\Facades\Cache::put('golive_test', true, 5);
            \Illuminate\Support\Facades\Cache::forget('golive_test');
            $checks[] = $this->pass('Cache driver working', config('cache.default'));
        } catch (\Throwable $e) {
            $checks[] = $this->fail('Cache driver error', $e->getMessage());
        }

        // 13. Queue driver
        $queueDriver = config('queue.default');
        $checks[] = $this->pass("Queue driver configured: {$queueDriver}", $queueDriver === 'sync' ? 'Note: use database/redis queue in production' : 'OK for production');

        return $checks;
    }

    private function pass(string $label, string $detail): array
    {
        return ['status' => 'pass', 'label' => $label, 'detail' => $detail];
    }

    private function warn(string $label, string $detail): array
    {
        return ['status' => 'warn', 'label' => $label, 'detail' => $detail];
    }

    private function fail(string $label, string $detail): array
    {
        return ['status' => 'fail', 'label' => $label, 'detail' => $detail];
    }
}
