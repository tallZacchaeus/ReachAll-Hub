<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    protected $fillable = [
        'period_label',
        'period_start',
        'period_end',
        'status',
        'is_off_cycle',
        'total_gross_kobo',
        'total_paye_kobo',
        'total_pension_employee_kobo',
        'total_pension_employer_kobo',
        'total_nhf_kobo',
        'total_nsitf_kobo',
        'total_net_kobo',
        'employee_count',
        'created_by_id',
        'approved_by_id',
        'approved_at',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'period_start'               => 'date',
        'period_end'                 => 'date',
        'is_off_cycle'               => 'boolean',
        'total_gross_kobo'           => 'integer',
        'total_paye_kobo'            => 'integer',
        'total_pension_employee_kobo'=> 'integer',
        'total_pension_employer_kobo'=> 'integer',
        'total_nhf_kobo'             => 'integer',
        'total_nsitf_kobo'           => 'integer',
        'total_net_kobo'             => 'integer',
        'employee_count'             => 'integer',
        'approved_at'                => 'datetime',
        'paid_at'                    => 'datetime',
    ];

    public function entries(): HasMany
    {
        return $this->hasMany(PayrollEntry::class, 'payroll_run_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
