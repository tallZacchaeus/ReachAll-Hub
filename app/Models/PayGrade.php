<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayGrade extends Model
{
    protected $fillable = [
        'code',
        'name',
        'min_salary_kobo',
        'max_salary_kobo',
        'is_active',
    ];

    protected $casts = [
        'min_salary_kobo' => 'integer',
        'max_salary_kobo' => 'integer',
        'is_active'       => 'boolean',
    ];

    public function employeeSalaries(): HasMany
    {
        return $this->hasMany(EmployeeSalary::class, 'pay_grade_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
