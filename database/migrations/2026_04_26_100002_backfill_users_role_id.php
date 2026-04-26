<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('UPDATE users SET role_id = (SELECT id FROM roles WHERE roles.name = users.role) WHERE role IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE users SET role_id = NULL');
    }
};
