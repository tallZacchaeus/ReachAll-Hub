<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('email', 200)->unique();
            $table->string('phone', 50)->nullable();
            $table->string('source', 80)->nullable()
                  ->comment('linkedin|referral|job_board|direct|agency|other');
            $table->string('current_company', 200)->nullable();
            $table->string('current_title', 200)->nullable();
            $table->string('linkedin_url', 500)->nullable();
            $table->string('resume_path')->nullable();
            $table->string('resume_disk')->nullable()->default('hr');
            $table->string('status', 30)->default('active')
                  ->comment('active|inactive|hired|blacklisted');
            $table->text('notes')->nullable();
            $table->foreignId('added_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
