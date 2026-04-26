<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_case_parties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_case_id')->constrained('hr_cases')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 20)
                ->comment('complainant|respondent|witness|investigator');
            $table->timestamps();

            $table->unique(['hr_case_id', 'user_id', 'role']);
            $table->index(['hr_case_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_case_parties');
    }
};
