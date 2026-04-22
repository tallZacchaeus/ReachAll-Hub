<?php

namespace Database\Seeders\Finance;

use App\Models\Finance\AccountCode;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccountCodeSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        $createdBy = $admin?->id;

        $codes = [
            // ── 5000s — Personnel Costs ──────────────────────────────────────────
            ['code' => '5001', 'category' => '5000', 'description' => 'Basic Salaries',               'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5002', 'category' => '5000', 'description' => 'Overtime Pay',                 'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5003', 'category' => '5000', 'description' => 'Housing Allowance',            'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5004', 'category' => '5000', 'description' => 'Transport Allowance',          'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5005', 'category' => '5000', 'description' => 'Medical & Health Benefits',    'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5006', 'category' => '5000', 'description' => 'Pension Contributions',        'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '5007', 'category' => '5000', 'description' => 'Staff Training & Development', 'vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '5008', 'category' => '5000', 'description' => 'Recruitment Costs',            'vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '5009', 'category' => '5000', 'description' => 'Staff Welfare & Gifts',        'vat' => true,  'wht' => false, 'wht_rate' => null],

            // ── 6000s — Operations ───────────────────────────────────────────────
            ['code' => '6001', 'category' => '6000', 'description' => 'Office Supplies & Stationery', 'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '6002', 'category' => '6000', 'description' => 'Electricity & Utilities',      'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '6003', 'category' => '6000', 'description' => 'Internet & Connectivity',      'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '6004', 'category' => '6000', 'description' => 'Office Rent & Lease',          'vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '6005', 'category' => '6000', 'description' => 'Cleaning & Maintenance',       'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '6006', 'category' => '6000', 'description' => 'Security Services',            'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '6007', 'category' => '6000', 'description' => 'Printing & Reproduction',      'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '6008', 'category' => '6000', 'description' => 'Postage & Courier',            'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '6009', 'category' => '6000', 'description' => 'Insurance Premiums',           'vat' => false, 'wht' => true,  'wht_rate' => 5],
            ['code' => '6010', 'category' => '6000', 'description' => 'Legal & Professional Fees',    'vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '6011', 'category' => '6000', 'description' => 'Bank Charges',                 'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '6012', 'category' => '6000', 'description' => 'Miscellaneous Expenses',       'vat' => true,  'wht' => false, 'wht_rate' => null],

            // ── 7000s — Travel & Transport ───────────────────────────────────────
            ['code' => '7001', 'category' => '7000', 'description' => 'Staff Transportation',         'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '7002', 'category' => '7000', 'description' => 'Vehicle Fuel & Oil',           'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '7003', 'category' => '7000', 'description' => 'Vehicle Maintenance & Repairs','vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '7004', 'category' => '7000', 'description' => 'Domestic Air Travel',          'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '7005', 'category' => '7000', 'description' => 'International Air Travel',     'vat' => false, 'wht' => false, 'wht_rate' => null],
            ['code' => '7006', 'category' => '7000', 'description' => 'Hotel & Accommodation',        'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '7007', 'category' => '7000', 'description' => 'Per Diem & Subsistence',       'vat' => false, 'wht' => false, 'wht_rate' => null],

            // ── 8000s — Programs & Production ───────────────────────────────────
            ['code' => '8001', 'category' => '8000', 'description' => 'Broadcasting & Air Time',      'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '8002', 'category' => '8000', 'description' => 'Studio Production Costs',      'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '8003', 'category' => '8000', 'description' => 'Video & Photography',          'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '8004', 'category' => '8000', 'description' => 'Outreach Program Costs',       'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '8005', 'category' => '8000', 'description' => 'Event Organisation Costs',     'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '8006', 'category' => '8000', 'description' => 'Printing & Publications',      'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '8007', 'category' => '8000', 'description' => 'Advertising & Marketing',      'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '8008', 'category' => '8000', 'description' => 'Donations & Grants Disbursed', 'vat' => false, 'wht' => false, 'wht_rate' => null],

            // ── 9000s — Technology & Software ────────────────────────────────────
            ['code' => '9001', 'category' => '9000', 'description' => 'Software Licences & SaaS',     'vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '9002', 'category' => '9000', 'description' => 'Cloud Hosting & Infrastructure','vat' => true,  'wht' => true,  'wht_rate' => 10],
            ['code' => '9003', 'category' => '9000', 'description' => 'IT Support & Maintenance',     'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '9004', 'category' => '9000', 'description' => 'Domain & Web Hosting',         'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '9005', 'category' => '9000', 'description' => 'Mobile & Telephone Costs',     'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '9006', 'category' => '9000', 'description' => 'Data & Network Services',      'vat' => true,  'wht' => true,  'wht_rate' => 5],

            // ── 9500s — Capital Expenditure ──────────────────────────────────────
            ['code' => '9501', 'category' => '9500', 'description' => 'Office Furniture & Fittings',  'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '9502', 'category' => '9500', 'description' => 'Computer & IT Equipment',      'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '9503', 'category' => '9500', 'description' => 'Broadcast Equipment',          'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '9504', 'category' => '9500', 'description' => 'Motor Vehicles',               'vat' => true,  'wht' => false, 'wht_rate' => null],
            ['code' => '9505', 'category' => '9500', 'description' => 'Building Improvements',        'vat' => true,  'wht' => true,  'wht_rate' => 5],
            ['code' => '9506', 'category' => '9500', 'description' => 'Generator & Power Equipment',  'vat' => true,  'wht' => false, 'wht_rate' => null],
        ];

        foreach ($codes as $c) {
            AccountCode::firstOrCreate(
                ['code' => $c['code']],
                [
                    'category'            => $c['category'],
                    'description'         => $c['description'],
                    'tax_vat_applicable'  => $c['vat'],
                    'tax_wht_applicable'  => $c['wht'],
                    'wht_rate'            => $c['wht_rate'],
                    'status'              => 'active',
                    'created_by'          => $createdBy,
                ]
            );
        }
    }
}
