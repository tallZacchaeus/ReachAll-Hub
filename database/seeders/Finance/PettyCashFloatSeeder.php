<?php

namespace Database\Seeders\Finance;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PettyCashFloatSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        if (! $admin) {
            return;
        }

        // Use two existing staff as custodians
        $jane = User::where('email', 'jane.doe@example.com')->first();
        $aisha = User::where('email', 'aisha.bello@example.com')->first();

        $custodians = array_filter([$jane, $aisha]);

        foreach ($custodians as $custodian) {
            // Use DB::table to avoid any model observer complications during seeding
            $exists = DB::table('petty_cash_floats')
                ->where('custodian_id', $custodian->id)
                ->exists();

            if (! $exists) {
                DB::table('petty_cash_floats')->insert([
                    'custodian_id' => $custodian->id,
                    'float_limit_kobo' => 20_000_000, // ₦200,000
                    'current_balance_kobo' => 20_000_000, // starts full
                    'low_alert_threshold' => 30,
                    'last_reconciled_at' => now()->subDays(8)->toDateTimeString(),
                    'status' => 'active',
                    'created_by' => $admin->id,
                    'created_at' => now()->toDateTimeString(),
                    'updated_at' => now()->toDateTimeString(),
                ]);
            }
        }
    }
}
