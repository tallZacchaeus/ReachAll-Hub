<?php

namespace App\Observers\Finance;

use App\Models\Finance\FinanceAuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FinanceModelObserver
{
    public function created(Model $model): void
    {
        $this->log($model, 'created', null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $this->log($model, 'updated', $model->getOriginal(), $model->getAttributes());
    }

    private function log(Model $model, string $action, ?array $before, ?array $after): void
    {
        // Avoid infinite recursion when logging FinanceAuditLog itself
        if ($model instanceof FinanceAuditLog) {
            return;
        }

        try {
            FinanceAuditLog::insert([
                // E7-01 + Q12-03: null user_id means the write was made by a system
                // process (queued job, CLI command) with no authenticated session.
                'user_id' => Auth::id(),
                'model_type' => get_class($model),
                'model_id' => $model->getKey(),
                'action' => $action,
                'before_json' => $before ? json_encode($before) : null,
                'after_json' => $after ? json_encode($after) : null,
                'logged_at' => now()->toDateTimeString(),
            ]);
        } catch (\Throwable $e) {
            // E7-01: NEVER let an audit log failure block the originating business write.
            // Report to Sentry and log locally, but do not rethrow.
            report($e);
            Log::error('FinanceAuditLog write failed — audit entry skipped', [
                'model' => get_class($model),
                'model_id' => $model->getKey(),
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
