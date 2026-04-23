<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_case_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_case_id')->constrained('hr_cases')->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            // Internal notes are visible to HR only, not to the reporting employee
            $table->boolean('is_internal')->default(false);
            $table->timestamps();

            $table->index(['hr_case_id', 'is_internal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_case_notes');
    }
};
