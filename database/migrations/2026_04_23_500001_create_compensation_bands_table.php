<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compensation_bands', function (Blueprint $table) {
            $table->id();
            $table->string('grade', 50)->comment('E.g. L1, L2, IC3, M1');
            $table->string('title', 150)->comment('Human-readable label');
            $table->string('category', 50)->default('individual_contributor')
                ->comment('individual_contributor|manager|executive');
            $table->unsignedBigInteger('min_kobo');
            $table->unsignedBigInteger('midpoint_kobo');
            $table->unsignedBigInteger('max_kobo');
            $table->date('effective_date');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['grade', 'effective_date']);
            $table->index(['is_active', 'grade']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_bands');
    }
};
