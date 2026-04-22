<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('key_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objective_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->decimal('target_value', 10, 2);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->string('unit', 50); // e.g. "%", "count", "$"
            $table->enum('status', ['on_track', 'at_risk', 'behind'])->default('on_track');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('key_results');
    }
};
