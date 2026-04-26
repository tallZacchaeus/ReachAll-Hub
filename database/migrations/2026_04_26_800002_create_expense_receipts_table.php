<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_claim_id')
                  ->constrained('expense_claims')
                  ->cascadeOnDelete();

            $table->string('file_path', 500);
            $table->string('disk', 50)->default('hr');
            $table->string('original_filename', 255);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('file_size_bytes')->nullable();
            $table->string('description', 300)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_receipts');
    }
};
