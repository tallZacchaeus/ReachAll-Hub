<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Requisition extends Model
{
    protected $fillable = [
        'request_id',
        'requester_id',
        'type',
        'amount_kobo',
        'currency',
        'exchange_rate',
        'cost_centre_id',
        'account_code_id',
        'vendor_id',
        'urgency',
        'description',
        'supporting_docs',
        'status',
        'tax_vat_kobo',
        'tax_wht_kobo',
        'total_kobo',
        'needs_board_approval',
        'financial_period_id',
        'budget_override_required',
        'budget_override_reason',
        'budget_override_by',
        'budget_override_at',
        'created_by',
        'updated_by',
        'submitted_at',
        'approved_at',
        'paid_at',
        'posted_at',
    ];

    protected $casts = [
        'amount_kobo'              => 'integer',
        'tax_vat_kobo'             => 'integer',
        'tax_wht_kobo'             => 'integer',
        'total_kobo'               => 'integer',
        'exchange_rate'            => 'decimal:6',
        'supporting_docs'          => 'array',
        'needs_board_approval'     => 'boolean',
        'budget_override_required' => 'boolean',
        'budget_override_at'       => 'datetime',
        'submitted_at'             => 'datetime',
        'approved_at'              => 'datetime',
        'paid_at'                  => 'datetime',
        'posted_at'                => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function costCentre(): BelongsTo
    {
        return $this->belongsTo(CostCentre::class, 'cost_centre_id');
    }

    public function accountCode(): BelongsTo
    {
        return $this->belongsTo(AccountCode::class, 'account_code_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function approvalSteps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class)->orderBy('level');
    }

    public function financialPeriod(): BelongsTo
    {
        return $this->belongsTo(FinancialPeriod::class, 'financial_period_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function budgetOverrideBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'budget_override_by');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->orderByDesc('created_at');
    }

    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class)->orderByDesc('created_at');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function whtLiabilities(): HasMany
    {
        return $this->hasMany(WhtLiability::class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function currentStep(): ?ApprovalStep
    {
        return $this->approvalSteps()->where('status', 'pending')->first();
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return in_array($this->status, ['submitted', 'approving'], true);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function canEdit(): bool
    {
        return \in_array($this->status, ['draft', 'rejected'], true);
    }

    public function isMatched(): bool
    {
        return $this->status === 'matched';
    }

    public function isPaid(): bool
    {
        return \in_array($this->status, ['paid', 'posted'], true);
    }

    public function requiresThreeWayMatch(): bool
    {
        // ≥ ₦500K must be matched before payment
        return $this->amount_kobo >= 50_000_000;
    }

    public function canPay(): bool
    {
        if ($this->requiresThreeWayMatch()) {
            return $this->status === 'matched';
        }
        return \in_array($this->status, ['approved', 'matched'], true);
    }

    public function needsBudgetOverride(): bool
    {
        return $this->budget_override_required && empty($this->budget_override_reason);
    }

    // ── Request ID generator ─────────────────────────────────────────────────

    public static function generateRequestId(): string
    {
        $prefix = 'REQ-' . now()->format('Ym') . '-';
        $last   = static::where('request_id', 'like', $prefix . '%')
            ->orderByDesc('request_id')
            ->lockForUpdate()
            ->first();
        $seq = $last ? (int) substr($last->request_id, -4) + 1 : 1;

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
