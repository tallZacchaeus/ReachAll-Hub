<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('role')->constrained('roles')->nullOnDelete();
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->json('feature_flags')->nullable()->after('is_system')
                ->comment('Array of module slugs visible/enabled for this role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('feature_flags');
        });
    }
};
