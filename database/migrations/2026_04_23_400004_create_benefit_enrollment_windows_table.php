<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benefit_enrollment_windows', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->date('open_date');
            $table->date('close_date');
            // Elections effective from this date once approved
            $table->date('effective_date');
            // upcoming | open | processing | closed
            $table->string('status', 20)->default('upcoming');
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('open_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_enrollment_windows');
    }
};
