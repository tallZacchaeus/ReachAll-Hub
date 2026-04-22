<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('model_type');  // e.g. App\Models\Finance\CostCentre
            $table->unsignedBigInteger('model_id');
            $table->string('action', 20);  // created | updated
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->timestamp('logged_at')->useCurrent();

            // No updated_at — append-only
            $table->index(['model_type', 'model_id']);
            $table->index('user_id');
            $table->index('logged_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_audit_logs');
    }
};
