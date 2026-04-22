<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->boolean('budget_override_required')->default(false)->after('total_kobo');
            $table->text('budget_override_reason')->nullable()->after('budget_override_required');
            $table->foreignId('budget_override_by')->nullable()->constrained('users')->nullOnDelete()->after('budget_override_reason');
            $table->timestamp('budget_override_at')->nullable()->after('budget_override_by');
        });
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropForeign(['budget_override_by']);
            $table->dropColumn([
                'budget_override_required',
                'budget_override_reason',
                'budget_override_by',
                'budget_override_at',
            ]);
        });
    }
};
