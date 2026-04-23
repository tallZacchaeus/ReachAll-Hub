<?php

namespace App\Providers;

use App\Models\Finance\AccountCode;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\Finance\PettyCashTransaction;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\Finance\PeriodCloseWaiver;
use App\Models\Finance\WhtLiability;
use App\Observers\Finance\FinanceModelObserver;
use App\Policies\Finance\ApprovalPolicy;
use App\Policies\Finance\PaymentPolicy;
use App\Policies\Finance\PettyCashPolicy;
use App\Policies\Finance\RequisitionPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerFinanceObservers();
        $this->registerFinancePolicies();
    }

    protected function registerFinanceObservers(): void
    {
        CostCentre::observe(FinanceModelObserver::class);
        AccountCode::observe(FinanceModelObserver::class);
        Vendor::observe(FinanceModelObserver::class);
        FinancialPeriod::observe(FinanceModelObserver::class);
        PettyCashFloat::observe(FinanceModelObserver::class);
        PettyCashTransaction::observe(FinanceModelObserver::class);
        PettyCashReconciliation::observe(FinanceModelObserver::class);
        // Phase 4
        Requisition::observe(FinanceModelObserver::class);
        ApprovalStep::observe(FinanceModelObserver::class);
        Invoice::observe(FinanceModelObserver::class);
        GoodsReceipt::observe(FinanceModelObserver::class);
        Payment::observe(FinanceModelObserver::class);
        LedgerEntry::observe(FinanceModelObserver::class);
        WhtLiability::observe(FinanceModelObserver::class);
        // Phase 5
        PeriodCloseWaiver::observe(FinanceModelObserver::class);
    }

    protected function registerFinancePolicies(): void
    {
        Gate::policy(Requisition::class, RequisitionPolicy::class);
        Gate::policy(ApprovalStep::class, ApprovalPolicy::class);
        Gate::policy(PettyCashFloat::class, PettyCashPolicy::class);
        Gate::policy(PettyCashReconciliation::class, PettyCashPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // CAT1-11: Always enforce minimum password strength; production adds
        // symbols and uncompromised (HIBP) check on top.
        $base = Password::min(8)->mixedCase()->letters()->numbers();

        Password::defaults(fn (): Password => app()->isProduction()
            ? $base->symbols()->uncompromised()
            : $base
        );
    }
}
