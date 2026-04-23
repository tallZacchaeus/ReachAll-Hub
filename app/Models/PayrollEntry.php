<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollEntry extends Model
{
    protected $fillable = [
        'payroll_run_id',
        'user_id',
        'employee_salary_id',
        'basic_kobo',
        'housing_kobo',
        'transport_kobo',
        'other_allowances_kobo',
        'gross_kobo',
        'paye_kobo',
        'pension_employee_kobo',
        'pension_employer_kobo',
        'nhf_kobo',
        'nsitf_kobo',
        'other_deductions_kobo',
        'net_kobo',
        'payslip_path',
        'payslip_disk',
        'payslip_generated',
    ];

    protected $casts = [
        'basic_kobo'            => 'integer',
        'housing_kobo'          => 'integer',
        'transport_kobo'        => 'integer',
        'other_allowances_kobo' => 'integer',
        'gross_kobo'            => 'integer',
        'paye_kobo'             => 'integer',
        'pension_employee_kobo' => 'integer',
        'pension_employer_kobo' => 'integer',
        'nhf_kobo'              => 'integer',
        'nsitf_kobo'            => 'integer',
        'other_deductions_kobo' => 'integer',
        'net_kobo'              => 'integer',
        'payslip_generated'     => 'boolean',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function employeeSalary(): BelongsTo
    {
        return $this->belongsTo(EmployeeSalary::class, 'employee_salary_id');
    }

    /** Total deductions from employee's pay. */
    public function totalDeductionsKobo(): int
    {
        return $this->paye_kobo
            + $this->pension_employee_kobo
            + $this->nhf_kobo
            + $this->other_deductions_kobo;
    }
}
