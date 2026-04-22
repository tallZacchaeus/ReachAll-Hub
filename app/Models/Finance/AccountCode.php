<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountCode extends Model
{
    protected $fillable = [
        'code',
        'category',
        'description',
        'tax_vat_applicable',
        'tax_wht_applicable',
        'wht_rate',
        'status',
        'created_by',
    ];

    protected $casts = [
        'tax_vat_applicable' => 'boolean',
        'tax_wht_applicable' => 'boolean',
        'wht_rate'           => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getCategoryLabelAttribute(): string
    {
        return match (true) {
            str_starts_with($this->category, '5') => 'Personnel Costs',
            str_starts_with($this->category, '6') => 'Operations',
            str_starts_with($this->category, '7') => 'Travel & Transport',
            str_starts_with($this->category, '8') => 'Programs & Production',
            $this->category >= '9500'             => 'Capital Expenditure',
            str_starts_with($this->category, '9') => 'Technology & Software',
            default                                => 'Other',
        };
    }
}
