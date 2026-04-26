<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table): void {
            $table->foreignId('leave_type_id')
                ->nullable()
                ->after('type')
                ->constrained('leave_types')
                ->nullOnDelete();

            $table->foreignId('cover_user_id')
                ->nullable()
                ->after('leave_type_id')
                ->constrained('users')
                ->nullOnDelete();

            // Calculated working days excluding weekends and public holidays
            $table->decimal('working_days', 5, 1)
                ->nullable()
                ->after('days');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('leave_type_id');
            $table->dropConstrainedForeignId('cover_user_id');
            $table->dropColumn('working_days');
        });
    }
};
