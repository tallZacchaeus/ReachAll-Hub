<?php

namespace App\Http\Controllers\Compensation;

use App\Http\Controllers\Controller;
use App\Models\BonusAward;
use App\Models\CompensationBand;
use App\Models\EmployeeBenefitEnrollment;
use App\Models\EmployeeSalary;
use App\Services\Finance\MoneyHelper;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TotalRewardsController extends Controller
{
    public function index(): Response
    {
        abort_unless(Auth::user()?->hasPermission('compensation.self'), 403);

        $user = Auth::user();

        // Current salary
        $salary = EmployeeSalary::where('user_id', $user->id)
            ->whereNull('end_date')
            ->orderByDesc('effective_date')
            ->first();

        // Active benefit enrollments
        $benefits = EmployeeBenefitEnrollment::with('plan:id,name,type,provider')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderBy('effective_date')
            ->get()
            ->map(fn ($e) => [
                'plan_name'             => $e->plan->name,
                'plan_type'             => $e->plan->type,
                'provider'              => $e->plan->provider,
                'employee_contribution' => MoneyHelper::format($e->employee_contribution_kobo),
                'employer_contribution' => MoneyHelper::format($e->employer_contribution_kobo),
            ]);

        // Approved and paid bonuses
        $bonuses = BonusAward::with('plan:id,name,bonus_type,period_label')
            ->where('user_id', $user->id)
            ->whereIn('status', ['approved', 'paid'])
            ->orderByDesc('approved_at')
            ->get()
            ->map(fn ($a) => [
                'plan_name'   => $a->plan->name,
                'bonus_type'  => $a->plan->bonus_type,
                'period'      => $a->plan->period_label,
                'amount'      => MoneyHelper::format($a->amount_kobo),
                'status'      => $a->status,
                'approved_at' => $a->approved_at?->toDateString(),
            ]);

        // Salary band match (active band for the user's grade — optional)
        $bandData = null;
        if ($salary) {
            $band = CompensationBand::active()
                ->orderByDesc('effective_date')
                ->first(); // Best effort; ideally user has a grade field

            if ($band) {
                $grossKobo = $salary->grossKobo();
                $bandData  = [
                    'grade'          => $band->grade,
                    'title'          => $band->title,
                    'min'            => MoneyHelper::format($band->min_kobo),
                    'midpoint'       => MoneyHelper::format($band->midpoint_kobo),
                    'max'            => MoneyHelper::format($band->max_kobo),
                    'comparatio'     => number_format($band->comparatio($grossKobo) * 100, 1) . '%',
                    'range_position' => number_format($band->rangePosition($grossKobo) * 100, 1) . '%',
                ];
            }
        }

        // Total employer cost
        $totalEmployerBenefitKobo = $benefits->sum(fn ($b) => 0); // Already formatted; recalculate raw
        $rawBenefitEnrollments = EmployeeBenefitEnrollment::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('employer_contribution_kobo');

        return Inertia::render('Compensation/TotalRewardsPage', [
            'salary'            => $salary ? [
                'basic'             => MoneyHelper::format($salary->basic_kobo),
                'housing'           => MoneyHelper::format($salary->housing_kobo),
                'transport'         => MoneyHelper::format($salary->transport_kobo),
                'other_allowances'  => MoneyHelper::format($salary->other_allowances_kobo),
                'gross'             => MoneyHelper::format($salary->grossKobo()),
                'effective_date'    => $salary->effective_date->toDateString(),
            ] : null,
            'benefits'                  => $benefits,
            'total_employer_benefits'   => MoneyHelper::format((int) $rawBenefitEnrollments),
            'bonuses'                   => $bonuses,
            'band'                      => $bandData,
        ]);
    }
}
