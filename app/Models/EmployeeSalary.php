<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalary extends Model
{
    protected $fillable = [
        'user_id',
        'pay_grade_id',
        'basic_kobo',
        'housing_kobo',
        'transport_kobo',
        'other_allowances_kobo',
        'nhf_enrolled',
        'effective_date',
        'end_date',
        'notes',
    ];

    protected $casts = [
        'basic_kobo'           => 'integer',
        'housing_kobo'         => 'integer',
        'transport_kobo'       => 'integer',
        'other_allowances_kobo'=> 'integer',
        'nhf_enrolled'         => 'boolean',
        'effective_date'       => 'date',
        'end_date'             => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function payGrade(): BelongsTo
    {
        return $this->belongsTo(PayGrade::class, 'pay_grade_id');
    }

    /** Gross monthly salary in kobo. */
    public function grossKobo(): int
    {
        return $this->basic_kobo
            + $this->housing_kobo
            + $this->transport_kobo
            + $this->other_allowances_kobo;
    }

    /** Pensionable pay = basic + housing + transport (PENCOM rules). */
    public function pensionableKobo(): int
    {
        return $this->basic_kobo + $this->housing_kobo + $this->transport_kobo;
    }
}
