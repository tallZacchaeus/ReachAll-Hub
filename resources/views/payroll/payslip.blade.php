<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payslip — {{ $entry->employee->name }} — {{ $run->period_label }}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 30px; }
  .header { border-bottom: 2px solid #1F6E4A; padding-bottom: 12px; margin-bottom: 20px; }
  .company-name { font-size: 18px; font-weight: bold; color: #1F6E4A; }
  .payslip-title { font-size: 13px; color: #374151; margin-top: 2px; }
  .meta-grid { display: table; width: 100%; margin-top: 16px; }
  .meta-col { display: table-cell; width: 50%; vertical-align: top; }
  .meta-label { color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-value { font-size: 12px; font-weight: bold; margin-bottom: 8px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151;
       border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 20px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  .row { border-bottom: 1px solid #f3f4f6; }
  .row td { padding: 5px 0; }
  .row td:last-child { text-align: right; font-family: monospace; }
  .subtotal td { font-weight: bold; padding-top: 8px; }
  .net-box { background: #1F6E4A; color: #fff; padding: 12px 16px; margin-top: 20px; border-radius: 4px; }
  .net-label { font-size: 11px; opacity: 0.85; }
  .net-amount { font-size: 20px; font-weight: bold; font-family: monospace; margin-top: 2px; }
  .employer-section { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px 14px; margin-top: 16px; border-radius: 3px; }
  .employer-title { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .footer { margin-top: 32px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  .confidential { font-size: 9px; color: #d1d5db; text-align: center; margin-top: 6px; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="header">
  <div class="company-name">{{ config('app.name') }}</div>
  <div class="payslip-title">Employee Payslip &mdash; {{ \Carbon\Carbon::parse($run->period_start)->format('F Y') }}</div>
</div>

<div class="meta-grid">
  <div class="meta-col">
    <div class="meta-label">Employee Name</div>
    <div class="meta-value">{{ $entry->employee->name }}</div>
    <div class="meta-label">Employee ID</div>
    <div class="meta-value">{{ $entry->employee->employee_id ?? '—' }}</div>
    <div class="meta-label">Department</div>
    <div class="meta-value">{{ $entry->employee->department ?? '—' }}</div>
  </div>
  <div class="meta-col">
    <div class="meta-label">Pay Period</div>
    <div class="meta-value">{{ \Carbon\Carbon::parse($run->period_start)->format('d M Y') }} &ndash; {{ \Carbon\Carbon::parse($run->period_end)->format('d M Y') }}</div>
    <div class="meta-label">Run Reference</div>
    <div class="meta-value">{{ $run->period_label }}</div>
    <div class="meta-label">Generated</div>
    <div class="meta-value">{{ now()->format('d M Y') }}</div>
  </div>
</div>

{{-- Earnings --}}
<h2>Earnings</h2>
<table>
  <tr class="row"><td>Basic Salary</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->basic_kobo) }}</td></tr>
  <tr class="row"><td>Housing Allowance</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->housing_kobo) }}</td></tr>
  <tr class="row"><td>Transport Allowance</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->transport_kobo) }}</td></tr>
  @if($entry->other_allowances_kobo > 0)
  <tr class="row"><td>Other Allowances</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->other_allowances_kobo) }}</td></tr>
  @endif
  <tr class="subtotal"><td><strong>Gross Pay</strong></td><td><strong>{{ \App\Services\Finance\MoneyHelper::format($entry->gross_kobo) }}</strong></td></tr>
</table>

{{-- Deductions --}}
<h2>Deductions</h2>
<table>
  <tr class="row"><td>PAYE (Income Tax)</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->paye_kobo) }}</td></tr>
  <tr class="row"><td>Pension (Employee 8%)</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->pension_employee_kobo) }}</td></tr>
  @if($entry->nhf_kobo > 0)
  <tr class="row"><td>NHF (2.5% of Basic)</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->nhf_kobo) }}</td></tr>
  @endif
  @if($entry->other_deductions_kobo > 0)
  <tr class="row"><td>Loan / Advance Recovery</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->other_deductions_kobo) }}</td></tr>
  @endif
  <tr class="subtotal"><td><strong>Total Deductions</strong></td><td><strong>{{ \App\Services\Finance\MoneyHelper::format($entry->totalDeductionsKobo()) }}</strong></td></tr>
</table>

{{-- Net Pay --}}
<div class="net-box">
  <div class="net-label">NET PAY</div>
  <div class="net-amount">{{ \App\Services\Finance\MoneyHelper::format($entry->net_kobo) }}</div>
</div>

{{-- Employer contributions (informational) --}}
<div class="employer-section">
  <div class="employer-title">Employer Contributions (not deducted from your pay)</div>
  <table>
    <tr class="row"><td>Pension (Employer 10%)</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->pension_employer_kobo) }}</td></tr>
    <tr class="row"><td>NSITF (1% of Gross)</td><td>{{ \App\Services\Finance\MoneyHelper::format($entry->nsitf_kobo) }}</td></tr>
  </table>
</div>

<div class="footer">
  This payslip is generated by {{ config('app.name') }} and is valid without a signature.
  For queries, please contact HR.
</div>
<div class="confidential">CONFIDENTIAL &mdash; FOR ADDRESSEE ONLY</div>

</body>
</html>
