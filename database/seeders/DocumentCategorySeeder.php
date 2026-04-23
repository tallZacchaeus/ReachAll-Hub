<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentCategorySeeder extends Seeder
{
    private const CATEGORIES = [
        ['code' => 'CONTRACT',    'name' => 'Employment Contracts',       'requires_signature' => true,  'sort_order' => 10],
        ['code' => 'OFFER',       'name' => 'Offer Letters',              'requires_signature' => true,  'sort_order' => 20],
        ['code' => 'POLICY',      'name' => 'Company Policies',           'requires_signature' => true,  'sort_order' => 30],
        ['code' => 'NDA',         'name' => 'NDAs & Confidentiality',     'requires_signature' => true,  'sort_order' => 40],
        ['code' => 'APPRAISAL',   'name' => 'Performance Appraisals',     'requires_signature' => false, 'sort_order' => 50],
        ['code' => 'WARNING',     'name' => 'Warnings & Disciplinary',    'requires_signature' => true,  'sort_order' => 60],
        ['code' => 'CERTIFICATE', 'name' => 'Certificates & Awards',      'requires_signature' => false, 'sort_order' => 70],
        ['code' => 'COMPLIANCE',  'name' => 'Compliance Documents',       'requires_signature' => true,  'sort_order' => 80],
        ['code' => 'PAYSLIP',     'name' => 'Payslips',                   'requires_signature' => false, 'sort_order' => 90],
        ['code' => 'OTHER',       'name' => 'Other Documents',            'requires_signature' => false, 'sort_order' => 999],
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $cat) {
            DB::table('document_categories')->upsert(
                array_merge($cat, [
                    'description' => null,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]),
                ['code'],
                ['name', 'requires_signature', 'sort_order', 'updated_at']
            );
        }

        $this->command?->info('Document categories seeded (' . count(self::CATEGORIES) . ' categories).');
    }
}
