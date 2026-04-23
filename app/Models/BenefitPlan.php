<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BenefitPlan extends Model
{
    protected $fillable = [
        'type',
        'name',
        'provider',
        'description',
        'employee_contribution_type',
        'employee_contribution_value',
        'employer_contribution_type',
        'employer_contribution_value',
        'is_waivable',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'employee_contribution_value' => 'integer',
        'employer_contribution_value' => 'integer',
        'is_waivable'                 => 'boolean',
        'is_active'                   => 'boolean',
        'sort_order'                  => 'integer',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(EmployeeBenefitEnrollment::class, 'benefit_plan_id');
    }

    public function elections(): HasMany
    {
        return $this->hasMany(BenefitEnrollmentElection::class, 'benefit_plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Compute the employee's monthly contribution in kobo given their salary.
     * Returns 0 when type is 'none'.
     */
    public function computeEmployeeContribution(EmployeeSalary $salary): int
    {
        return $this->computeContribution(
            $this->employee_contribution_type,
            $this->employee_contribution_value,
            $salary
        );
    }

    public function computeEmployerContribution(EmployeeSalary $salary): int
    {
        return $this->computeContribution(
            $this->employer_contribution_type,
            $this->employer_contribution_value,
            $salary
        );
    }

    private function computeContribution(string $type, int $value, EmployeeSalary $salary): int
    {
        return match ($type) {
            'fixed'                 => $value,
            'percentage_of_basic'   => (int) round($salary->basic_kobo * $value / 10000),
            'percentage_of_gross'   => (int) round($salary->grossKobo() * $value / 10000),
            default                 => 0,
        };
    }
}
