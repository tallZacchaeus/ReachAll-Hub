<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompensationBand extends Model
{
    protected $fillable = [
        'grade',
        'title',
        'category',
        'min_kobo',
        'midpoint_kobo',
        'max_kobo',
        'effective_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'min_kobo'       => 'integer',
        'midpoint_kobo'  => 'integer',
        'max_kobo'       => 'integer',
        'effective_date' => 'date',
        'is_active'      => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Return the compa-ratio for a given salary (current pay / midpoint). */
    public function comparatio(int $salaryKobo): float
    {
        if ($this->midpoint_kobo === 0) return 0;
        return round($salaryKobo / $this->midpoint_kobo, 4);
    }

    /** Return position-in-range (0 = min, 1 = max). */
    public function rangePosition(int $salaryKobo): float
    {
        $spread = $this->max_kobo - $this->min_kobo;
        if ($spread === 0) return 0;
        return round(($salaryKobo - $this->min_kobo) / $spread, 4);
    }
}
