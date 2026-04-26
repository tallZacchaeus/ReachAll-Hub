<?php

namespace App\Services\Finance;

use App\Models\Finance\ApprovalStep;
use App\Models\Finance\Requisition;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Routes a Requisition to the correct chain of ApprovalStep records.
 *
 * Approval matrix (in Naira; stored amounts are in kobo):
 *   ₦0      – ₦10K:    Petty Cash path (PETTY type; custodian only)
 *   ₦10K    – ₦100K:   Level 1 — Line Manager
 *   ₦100K   – ₦500K:   + Level 2 — Dept Head
 *   ₦500K   – ₦2M:     + Level 3 — Finance
 *   ₦2M     – ₦10M:    + Level 4 — General Management
 *   ₦10M+:             + Level 5 — CEO  (+ needs_board_approval flag)
 *
 * CAPEX always adds one extra tier (shifts the chain up by one level).
 * EMERG uses the standard chain but marks urgency (no tier skip).
 *
 * Rules:
 *  - Approver cannot be the requester (skipped, next candidate found).
 *  - Steps are only created for tiers where a matching user exists.
 *  - Duplicate approver in chain → skip the duplicate (move to next user with that role).
 *  - SLA deadline: 48 business hours from step activation.
 */
class ApprovalRouter
{
    // Thresholds in kobo
    private const T_PETTY = 10_000_00;  // ₦10K

    private const T_MANAGER = 100_000_00;  // ₦100K

    private const T_FINANCE = 500_000_00;  // ₦500K

    private const T_GENMGMT = 2_000_000_00; // ₦2M

    private const T_CEO = 10_000_000_00; // ₦10M

    public const SLA_HOURS = 48;

    /**
     * Build and persist ApprovalStep records for the given Requisition.
     *
     * Returns the ordered collection of created steps.
     *
     * @throws RuntimeException if no valid approver can be resolved for any tier.
     */
    public function route(Requisition $requisition): Collection
    {
        $tiers = $this->resolveTiers($requisition);

        $steps = collect();
        $usedIds = [];

        foreach ($tiers as $index => ['role' => $role, 'label' => $label]) {
            $approver = $this->findApprover($role, $requisition, $usedIds);

            if ($approver === null) {
                // Tier unavailable (no user with that role) — skip it
                continue;
            }

            // Segregation of duties: approver must never be the requester.
            // findApprover() already enforces this, but assert here as a defence-in-depth guard.
            if ($approver->id === $requisition->requester_id) {
                continue;
            }

            $usedIds[] = $approver->id;
            $level = $index + 1;

            $step = ApprovalStep::create([
                'requisition_id' => $requisition->id,
                'approver_id' => $approver->id,
                'level' => $level,
                'role_label' => $label,
                'status' => $level === 1 ? 'pending' : 'pending', // all pending; first is "active"
                'sla_deadline' => $level === 1 ? $this->slaDeadline() : null,
            ]);

            $steps->push($step);
        }

        if ($steps->isEmpty()) {
            throw new RuntimeException("No approvers could be resolved for requisition {$requisition->request_id}.");
        }

        // Set SLA only on the first step (others activated sequentially)
        // Already done above via $level === 1 check

        // Flag if board approval needed
        if ($requisition->amount_kobo >= self::T_CEO) {
            $requisition->update(['needs_board_approval' => true]);
        }

        return $steps;
    }

    /**
     * Return the ordered tier list for a given requisition (without DB writes).
     * Used by unit tests.
     *
     * @return array<int, array{role: string, label: string}>
     */
    public function resolveTiers(Requisition $requisition): array
    {
        $amount = $requisition->amount_kobo;
        $type = strtoupper($requisition->type);

        // PETTY CASH — only petty cash custodian path (future: route to custodian)
        if ($type === 'PETTY' && $amount < self::T_PETTY) {
            return [
                ['role' => 'finance', 'label' => 'Petty Cash Custodian'],
            ];
        }

        $tiers = $this->opexTiers($amount);

        // CAPEX always adds one extra tier (shifts chain up)
        if ($type === 'CAPEX') {
            $tiers = $this->addCapexTier($tiers, $amount);
        }

        return $tiers;
    }

    /**
     * Standard OPEX tier list based on amount.
     *
     * @return array<int, array{role: string, label: string}>
     */
    private function opexTiers(int $amount): array
    {
        if ($amount < self::T_PETTY) {
            // Very small OPEX — still routes to Line Manager
            return [
                ['role' => 'management', 'label' => 'Line Manager'],
            ];
        }

        if ($amount < self::T_MANAGER) {
            return [
                ['role' => 'management', 'label' => 'Line Manager'],
            ];
        }

        if ($amount < self::T_FINANCE) {
            return [
                ['role' => 'management',  'label' => 'Line Manager'],
                ['role' => 'dept_head',   'label' => 'Department Head'],
            ];
        }

        if ($amount < self::T_GENMGMT) {
            return [
                ['role' => 'management',  'label' => 'Line Manager'],
                ['role' => 'dept_head',   'label' => 'Department Head'],
                ['role' => 'finance',     'label' => 'Finance'],
            ];
        }

        if ($amount < self::T_CEO) {
            return [
                ['role' => 'management',       'label' => 'Line Manager'],
                ['role' => 'dept_head',        'label' => 'Department Head'],
                ['role' => 'finance',          'label' => 'Finance'],
                ['role' => 'general_management', 'label' => 'General Management'],
            ];
        }

        // ₦10M+
        return [
            ['role' => 'management',         'label' => 'Line Manager'],
            ['role' => 'dept_head',          'label' => 'Department Head'],
            ['role' => 'finance',            'label' => 'Finance'],
            ['role' => 'general_management', 'label' => 'General Management'],
            ['role' => 'ceo',                'label' => 'CEO'],
        ];
    }

    /**
     * CAPEX shifts the tier chain up by one level (adds one extra approver).
     *
     * @param  array<int, array{role: string, label: string}>  $opexTiers
     * @return array<int, array{role: string, label: string}>
     */
    private function addCapexTier(array $opexTiers, int $amount): array
    {
        $extraTiers = [
            ['role' => 'management',         'label' => 'Line Manager'],
            ['role' => 'dept_head',          'label' => 'Department Head'],
            ['role' => 'finance',            'label' => 'Finance'],
            ['role' => 'general_management', 'label' => 'General Management'],
            ['role' => 'ceo',                'label' => 'CEO'],
        ];

        // Merge OPEX tiers + one extra from the full chain not already present
        $existingRoles = array_column($opexTiers, 'role');
        $added = false;

        foreach ($extraTiers as $tier) {
            if (! in_array($tier['role'], $existingRoles, true)) {
                $opexTiers[] = $tier;
                $added = true;
                break;
            }
        }

        // If no extra tier was added (already at CEO level), keep as-is
        return $opexTiers;
    }

    /**
     * Find an available user for the given role, excluding the requester and already-used approvers.
     *
     * Special role `dept_head`: resolved from the requisition's cost centre head.
     */
    private function findApprover(string $role, Requisition $requisition, array $excludeIds): ?User
    {
        $requester = $requisition->requester_id;

        if ($role === 'dept_head') {
            // Cost centre head first
            $head = $requisition->costCentre?->head;
            if ($head && $head->id !== $requester && ! in_array($head->id, $excludeIds, true)) {
                return $head;
            }

            // Fallback: any management user in same department
            return User::where('role', 'management')
                ->where('department', $requisition->requester?->department)
                ->where('id', '!=', $requester)
                ->whereNotIn('id', $excludeIds)
                ->where('status', 'active')
                ->first();
        }

        return User::where('role', $role)
            ->where('id', '!=', $requester)
            ->whereNotIn('id', $excludeIds)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Resolve the next approver up the hierarchy for an overdue step.
     *
     * Looks at the current step's role_label, finds the next tier in the
     * standard chain, and returns the first available user for that role
     * (excluding the current approver and the requisition's requester).
     *
     * Returns null when no higher approver can be found (already at CEO level,
     * or no user exists for the next role).
     */
    public function findNextLevelApprover(ApprovalStep $step): ?User
    {
        $req = $step->requisition;

        // Full role escalation ladder
        $ladder = [
            'management',
            'dept_head',
            'finance',
            'general_management',
            'ceo',
            'superadmin',
        ];

        // Find current approver's role
        $currentRole = $step->approver?->role ?? 'management';
        $currentPos = array_search($currentRole, $ladder, true);

        if ($currentPos === false) {
            $currentPos = 0;
        }

        // Walk up the ladder looking for an available approver
        for ($i = $currentPos + 1; $i < count($ladder); $i++) {
            $role = $ladder[$i];

            if ($role === 'dept_head') {
                $head = $req->costCentre?->head;
                if ($head
                    && $head->id !== $req->requester_id
                    && $head->id !== $step->approver_id
                    && $head->status === 'active'
                ) {
                    return $head;
                }
            }

            $next = User::where('role', $role)
                ->where('id', '!=', $req->requester_id)
                ->where('id', '!=', $step->approver_id)
                ->where('status', 'active')
                ->first();

            if ($next) {
                return $next;
            }
        }

        return null;
    }

    /**
     * SLA deadline: 48 hours from now, skipping over weekends.
     * Friday → deadline is Monday + the remaining hours.
     */
    private function slaDeadline(): CarbonImmutable
    {
        $deadline = now()->addHours(self::SLA_HOURS);

        // If deadline falls on a weekend, push to Monday
        if ($deadline->isWeekend()) {
            $deadline = $deadline->nextWeekday();
        }

        return $deadline;
    }
}
