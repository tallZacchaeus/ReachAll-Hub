<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Finance SLA: check every hour for overdue approval steps
\Illuminate\Support\Facades\Schedule::command('finance:process-sla')
    ->hourly()
    ->withoutOverlapping();

// Finance SLA Escalation: escalate overdue approval steps every 30 minutes
\Illuminate\Support\Facades\Schedule::command('finance:escalate-approvals')
    ->everyThirtyMinutes()
    ->withoutOverlapping();

// Finance Approval Reminders: remind approvers approaching their SLA deadline (hourly)
\Illuminate\Support\Facades\Schedule::command('finance:remind-pending-approvals')
    ->hourly()
    ->withoutOverlapping();

// Finance Petty Cash: check daily for low balance and reconciliation due alerts
\Illuminate\Support\Facades\Schedule::command('finance:check-petty-cash')
    ->dailyAt('08:00')
    ->withoutOverlapping();
