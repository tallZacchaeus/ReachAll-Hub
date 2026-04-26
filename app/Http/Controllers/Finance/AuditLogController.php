<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinanceAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CAT12-02: Read-only audit log viewer.
 *
 * Finance admins and superadmins can browse the append-only audit trail with
 * filterable search (user, action, model, date range) and before/after diff.
 * Paginated at 25 entries per page.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasPermission('finance.admin'),
            403
        );

        $query = FinanceAuditLog::with('user:id,name,role')
            ->orderByDesc('logged_at');

        if ($request->filled('action')) {
            $query->where('action', $request->get('action'));
        }

        if ($request->filled('model_type')) {
            // Accept short class name (e.g. "Requisition") or FQCN
            $modelType = $request->get('model_type');
            if (! str_contains($modelType, '\\')) {
                $modelType = 'App\\Models\\Finance\\'.$modelType;
            }
            $query->where('model_type', $modelType);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->get('user_id'));
        }

        if ($request->filled('from')) {
            $query->where('logged_at', '>=', $request->get('from'));
        }

        if ($request->filled('to')) {
            $query->where('logged_at', '<=', $request->get('to').' 23:59:59');
        }

        if ($request->filled('model_id')) {
            $query->where('model_id', (int) $request->get('model_id'));
        }

        $logs = $query->paginate(25)->through(fn (FinanceAuditLog $log) => [
            'id' => $log->id,
            'action' => $log->action,
            'model_type' => class_basename($log->model_type),
            'model_id' => $log->model_id,
            'before_json' => $log->before_json,
            'after_json' => $log->after_json,
            'logged_at' => $log->logged_at?->toISOString(),
            'user' => $log->user ? [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'role' => $log->user->role,
            ] : null,
        ]);

        // Distinct action list for the filter dropdown
        $actions = FinanceAuditLog::selectRaw('DISTINCT action')
            ->orderBy('action')
            ->pluck('action');

        return Inertia::render('Finance/AuditLogPage', [
            'logs' => $logs,
            'actions' => $actions,
            'filters' => $request->only(['action', 'model_type', 'user_id', 'from', 'to', 'model_id']),
        ]);
    }
}
