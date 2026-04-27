<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_policies', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('slug', 100)->unique();
            $table->string('category', 50)->default('general'); // hr|it|finance|safety|ethics|general
            $table->text('description')->nullable();
            $table->string('current_version', 20)->nullable();
            $table->boolean('requires_acknowledgement')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('compliance_policy_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained('compliance_policies')->cascadeOnDelete();
            $table->string('version', 20);
            $table->longText('content');
            $table->foreignId('published_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->unique(['policy_id', 'version']);
            $table->timestamps();
        });

        Schema::create('compliance_policy_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained('compliance_policies')->cascadeOnDelete();
            $table->foreignId('policy_version_id')->constrained('compliance_policy_versions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('acknowledged_at');
            $table->string('ip_address', 45)->nullable();
            // PROD-01: explicit name — auto-generated id exceeds 64 chars.
            $table->unique(['policy_version_id', 'user_id'], 'cpa_version_user_unique');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_policy_acknowledgements');
        Schema::dropIfExists('compliance_policy_versions');
        Schema::dropIfExists('compliance_policies');
    }
};
