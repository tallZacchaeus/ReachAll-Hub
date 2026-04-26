<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Throwable;

class AuditLogger
{
    /**
     * Record an audit event without interrupting the primary operation.
     *
     * @param  string       $module      Module slug (e.g. 'roles', 'payroll', 'documents')
     * @param  string       $action      Action slug (e.g. 'role.created', 'payslip.downloaded')
     * @param  string|null  $subjectType FQCN or short name of the affected entity
     * @param  int|null     $subjectId   Primary key of the affected entity
     * @param  array|null   $oldData     Snapshot of the entity before the change
     * @param  array|null   $newData     Snapshot of the entity after the change
     * @param  Request|null $request     Current HTTP request (for actor, IP, UA resolution)
     */
    public static function record(
        string $module,
        string $action,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?array $oldData = null,
        ?array $newData = null,
        ?Request $request = null,
    ): void {
        try {
            $user = $request?->user() ?? auth()->user();

            AuditLog::create([
                'actor_id'     => $user?->id,
                'module'       => $module,
                'action'       => $action,
                'subject_type' => $subjectType,
                'subject_id'   => $subjectId,
                'old_json'     => $oldData,
                'new_json'     => $newData,
                'ip_address'   => $request?->ip(),
                'user_agent'   => $request?->userAgent(),
            ]);
        } catch (Throwable) {
            // Never interrupt the primary operation due to an audit failure.
        }
    }
}
