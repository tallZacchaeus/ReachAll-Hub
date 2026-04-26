<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasPermission('audit.view'),
            403,
            'You do not have permission to view audit logs.'
        );

        $query = AuditLog::with('actor:id,name,employee_id')
            ->orderByDesc('created_at');

        if ($module = $request->query('module')) {
            $query->where('module', $module);
        }

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        $logs = $query->paginate(50)->withQueryString();

        // Distinct filter options for the UI
        $modules = AuditLog::distinct()->orderBy('module')->pluck('module');
        $actions = AuditLog::distinct()->orderBy('action')->pluck('action');

        return Inertia::render('Admin/AuditLogsPage', [
            'logs'    => $logs,
            'modules' => $modules,
            'actions' => $actions,
            'filters' => [
                'module' => $request->query('module', ''),
                'action' => $request->query('action', ''),
            ],
        ]);
    }
}
