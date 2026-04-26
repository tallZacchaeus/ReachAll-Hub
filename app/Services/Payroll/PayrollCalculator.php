<?php

namespace App\Services\Payroll;

use App\Models\EmployeeSalary;

/**
 * Nigerian gross-to-net payroll calculator.
 *
 * Rules implemented (all values in kobo):
 *
 *  PENSION (PENCOM PRA 2014):
 *    Employee: 8% of pensionable pay (basic + housing + transport)
 *    Employer: 10% of pensionable pay
 *
 *  NHF (National Housing Fund Act):
 *    Employee: 2.5% of basic salary — only if nhf_enrolled
 *
 *  NSITF (Social Insurance Trust Fund):
 *    Employer: 1% of total emolument — cost to org, NOT deducted from employee
 *
 *  PAYE (Personal Income Tax Act 2011 as amended):
 *    Annual taxable income = annual gross − pension_employee − nhf
 *    Consolidated Relief Allowance (CRA) = 200,000 + 20% of gross (min ₦200,000)
 *    Net taxable = annual taxable − CRA
 *    Progressive tax bands applied to net taxable (see PAYE_BANDS)
 *    Monthly PAYE = annual tax ÷ 12
 *
 *  NET = gross − paye − pension_employee − nhf − other_deductions
 */
class PayrollCalculator
{
    // Annual progressive PAYE bands: [upper_limit_naira, rate]
    // Figures per PITA 2011, updated FA 2020
    private const PAYE_BANDS = [
        [300_000,     0.07],
        [600_000,     0.11],
        [1_100_000,   0.15],
        [1_600_000,   0.19],
        [3_200_000,   0.21],
        [PHP_INT_MAX, 0.24],
    ];

    private const PENSION_EMPLOYEE_RATE = 0.08;

    private const PENSION_EMPLOYER_RATE = 0.10;

    private const NHF_RATE = 0.025;

    private const NSITF_RATE = 0.01;

    // Consolidated Relief Allowance flat component (kobo/year)
    private const CRA_FLAT_KOBO = 20_000_000; // ₦200,000

    /**
     * Compute a single employee's monthly payslip figures.
     *
     * @param  EmployeeSalary  $salary  Current salary record
     * @param  int  $otherDeductionsKobo  Loan/advance instalments for this cycle
     * @return array{
     *   basic_kobo: int,
     *   housing_kobo: int,
     *   transport_kobo: int,
     *   other_allowances_kobo: int,
     *   gross_kobo: int,
     *   pension_employee_kobo: int,
     *   pension_employer_kobo: int,
     *   nhf_kobo: int,
     *   nsitf_kobo: int,
     *   paye_kobo: int,
     *   other_deductions_kobo: int,
     *   net_kobo: int
     * }
     */
    public static function compute(EmployeeSalary $salary, int $otherDeductionsKobo = 0): array
    {
        $basic = $salary->basic_kobo;
        $housing = $salary->housing_kobo;
        $transport = $salary->transport_kobo;
        $other = $salary->other_allowances_kobo;
        $gross = $basic + $housing + $transport + $other;

        // Pensionable pay (monthly)
        $pensionable = $basic + $housing + $transport;

        $pensionEmployee = (int) round($pensionable * self::PENSION_EMPLOYEE_RATE);
        $pensionEmployer = (int) round($pensionable * self::PENSION_EMPLOYER_RATE);

        // NHF: 2.5% of basic, only if enrolled
        $nhf = $salary->nhf_enrolled
            ? (int) round($basic * self::NHF_RATE)
            : 0;

        // NSITF: 1% employer cost on gross (not deducted from employee)
        $nsitf = (int) round($gross * self::NSITF_RATE);

        // PAYE: annual basis
        $annualGross = $gross * 12;
        $annualPension = $pensionEmployee * 12;
        $annualNhf = $nhf * 12;

        $annualTaxable = $annualGross - $annualPension - $annualNhf;

        // CRA = max(₦200,000, 200,000 + 20% of gross)
        $cra20pct = (int) round($annualGross * 0.20);
        $cra = self::CRA_FLAT_KOBO + max(0, $cra20pct);
        $cra = max(self::CRA_FLAT_KOBO, $cra);

        $netTaxable = max(0, $annualTaxable - $cra);

        $annualPaye = self::applyPayeBands($netTaxable);
        $monthlyPaye = (int) round($annualPaye / 12);

        // Net = gross − employee deductions
        $net = $gross - $monthlyPaye - $pensionEmployee - $nhf - $otherDeductionsKobo;
        $net = max(0, $net);

        return [
            'basic_kobo' => $basic,
            'housing_kobo' => $housing,
            'transport_kobo' => $transport,
            'other_allowances_kobo' => $other,
            'gross_kobo' => $gross,
            'pension_employee_kobo' => $pensionEmployee,
            'pension_employer_kobo' => $pensionEmployer,
            'nhf_kobo' => $nhf,
            'nsitf_kobo' => $nsitf,
            'paye_kobo' => $monthlyPaye,
            'other_deductions_kobo' => $otherDeductionsKobo,
            'net_kobo' => $net,
        ];
    }

    /**
     * Apply progressive PAYE tax bands to net taxable income (annual kobo).
     * Returns annual PAYE in kobo.
     */
    private static function applyPayeBands(int $netTaxableKobo): int
    {
        // Convert to naira for band comparisons
        $netTaxableNaira = $netTaxableKobo / 100;

        $tax = 0.0;
        $prev = 0.0;

        foreach (self::PAYE_BANDS as [$upper, $rate]) {
            if ($netTaxableNaira <= 0) {
                break;
            }

            $bandSize = min($netTaxableNaira - $prev, $upper - $prev);

            if ($bandSize <= 0) {
                continue;
            }

            $tax += $bandSize * $rate;
            $prev = $upper;

            if ($netTaxableNaira <= $upper) {
                break;
            }
        }

        // Convert back to kobo
        return (int) round($tax * 100);
    }
}
