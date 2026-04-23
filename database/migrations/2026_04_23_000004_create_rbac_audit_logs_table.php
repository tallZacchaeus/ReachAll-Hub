<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rbac_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 50);           // 'role.created', 'permission.assigned', etc.
            $table->string('target_type', 50);      // 'role', 'permission', 'role_permission'
            $table->string('target_id', 100);       // role slug or permission name
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
            // No updated_at — these logs are immutable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rbac_audit_logs');
    }
};
