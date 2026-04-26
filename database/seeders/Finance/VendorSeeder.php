<?php

namespace Database\Seeders\Finance;

use App\Models\Finance\Vendor;
use App\Models\User;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        $createdBy = $admin?->id;

        $vendors = [
            [
                'name' => 'Apex Systems Nigeria Ltd',
                'tax_id' => 'TIN-20345678-0001',
                'bank_name' => 'First Bank of Nigeria',
                'bank_account' => '3012345678',
                'contact_email' => 'accounts@apexsystems.ng',
                'contact_phone' => '08012345678',
                'status' => 'active',
            ],
            [
                'name' => 'Skyline Media Solutions',
                'tax_id' => 'TIN-30456789-0002',
                'bank_name' => 'Zenith Bank',
                'bank_account' => '2098765432',
                'contact_email' => 'billing@skylinemedia.com.ng',
                'contact_phone' => '07023456789',
                'status' => 'active',
            ],
            [
                'name' => 'TechPro Supplies Ltd',
                'tax_id' => 'TIN-40567890-0003',
                'bank_name' => 'GTBank',
                'bank_account' => '0123456789',
                'contact_email' => 'finance@techprosupplies.ng',
                'contact_phone' => '09034567890',
                'status' => 'active',
            ],
            [
                'name' => 'Greenfield Office Solutions',
                'tax_id' => 'TIN-50678901-0004',
                'bank_name' => 'Access Bank',
                'bank_account' => '0087654321',
                'contact_email' => 'invoice@greenfield.ng',
                'contact_phone' => '08145678901',
                'status' => 'active',
            ],
            [
                'name' => 'Horizon Broadcast Equipment',
                'tax_id' => 'TIN-60789012-0005',
                'bank_name' => 'UBA',
                'bank_account' => '1023456789',
                'contact_email' => 'accounts@horizonbroadcast.ng',
                'contact_phone' => '07056789012',
                'status' => 'active',
            ],
            [
                'name' => 'Swift Logistics & Courier',
                'tax_id' => 'TIN-70890123-0006',
                'bank_name' => 'Sterling Bank',
                'bank_account' => '0056789012',
                'contact_email' => 'billing@swiftlogistics.ng',
                'contact_phone' => '08067890123',
                'status' => 'active',
            ],
            [
                'name' => 'Digital Creatives Agency',
                'tax_id' => 'TIN-80901234-0007',
                'bank_name' => 'Stanbic IBTC',
                'bank_account' => '0078901234',
                'contact_email' => 'finance@digitalcreatives.ng',
                'contact_phone' => '09078901234',
                'status' => 'active',
            ],
            [
                'name' => 'CloudBase Technologies Ltd',
                'tax_id' => 'TIN-90012345-0008',
                'bank_name' => 'First Bank of Nigeria',
                'bank_account' => '3023456789',
                'contact_email' => 'payments@cloudbase.ng',
                'contact_phone' => '08089012345',
                'status' => 'active',
            ],
            [
                'name' => 'Prestige Event Management',
                'tax_id' => 'TIN-10123456-0009',
                'bank_name' => 'GTBank',
                'bank_account' => '0189012345',
                'contact_email' => 'accounts@prestigeevents.ng',
                'contact_phone' => '07090123456',
                'status' => 'active',
            ],
            [
                'name' => 'FuelMaster Nigeria Ltd',
                'tax_id' => 'TIN-11234567-0010',
                'bank_name' => 'Zenith Bank',
                'bank_account' => '2001234567',
                'contact_email' => 'billing@fuelmaster.ng',
                'contact_phone' => '08001234567',
                'status' => 'active',
            ],
        ];

        foreach ($vendors as $v) {
            Vendor::firstOrCreate(
                ['name' => $v['name']],
                array_merge($v, ['created_by' => $createdBy])
            );
        }
    }
}
