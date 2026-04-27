<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CAT6-01/02/03: Add composite indexes to finance tables for query performance.
 *
 * Targets identified during N+1 audit:
 *  - approval_steps: approver queue (approver_id + status), SLA sweep (status + sla_deadline)
 *  - requisitions: requester history (requester_id + status), cost centre spend (cost_centre_id + status),
 *                  period reporting (financial_period_id + status)
 *  - petty_cash_transactions: float timeline (float_id + created_at)
 *  - payments: requisition lookup (requisition_id), period reporting (financial_period_id + paid_at)
 *  - finance_audit_logs: timeline viewer (model_type + model_id + logged_at)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_steps', function (Blueprint $table) {
            // Approver queue: WHERE approver_id = ? AND status = 'pending'
            $table->index(['approver_id', 'status'], 'idx_approval_steps_approver_status');
            // SLA sweep: WHERE status = 'pending' AND sla_deadline < now()
            $table->index(['status', 'sla_deadline'], 'idx_approval_steps_status_sla');
        });

        Schema::table('requisitions', function (Blueprint $table) {
            // Requester history list
            $table->index(['requester_id', 'status'], 'idx_requisitions_requester_status');
            // Cost centre budget checks and reports
            $table->index(['cost_centre_id', 'status'], 'idx_requisitions_cc_status');
            // Period-end reporting
            $table->index(['financial_period_id', 'status'], 'idx_requisitions_period_status');
        });

        Schema::table('petty_cash_transactions', function (Blueprint $table) {
            // Float activity timeline
            $table->index(['float_id', 'created_at'], 'idx_pct_float_created');
        });

        Schema::table('payments', function (Blueprint $table) {
            // Lookup by requisition (one-to-one guard)
            $table->index('requisition_id', 'idx_payments_requisition');
            // PROD-01: payments doesn't carry financial_period_id; period is
            // tracked on requisitions and joined via requisition_id. Index
            // paid_at alone for time-based payment reports.
            $table->index('paid_at', 'idx_payments_paid_at');
        });

        Schema::table('finance_audit_logs', function (Blueprint $table) {
            // Audit viewer: WHERE model_type = ? AND model_id = ? ORDER BY logged_at DESC
            $table->index(['model_type', 'model_id', 'logged_at'], 'idx_audit_model_logged');
        });
    }

    public function down(): void
    {
        Schema::table('approval_steps', function (Blueprint $table) {
            $table->dropIndex('idx_approval_steps_approver_status');
            $table->dropIndex('idx_approval_steps_status_sla');
        });

        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropIndex('idx_requisitions_requester_status');
            $table->dropIndex('idx_requisitions_cc_status');
            $table->dropIndex('idx_requisitions_period_status');
        });

        Schema::table('petty_cash_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_pct_float_created');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_requisition');
            $table->dropIndex('idx_payments_paid_at');
        });

        Schema::table('finance_audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_model_logged');
        });
    }
};
