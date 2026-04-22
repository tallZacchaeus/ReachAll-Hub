<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('objectives', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('department')->nullable();
            $table->string('period', 20); // e.g. "Q1 2025"
            $table->enum('status', ['draft', 'active', 'completed'])->default('draft');
            $table->unsignedTinyInteger('progress')->default(0); // 0-100
            $table->foreignId('parent_id')->nullable()->constrained('objectives')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('objectives');
    }
};
