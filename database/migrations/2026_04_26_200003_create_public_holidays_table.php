<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_holidays', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->date('date')->index();
            $table->char('country_code', 2)->default('NG');
            $table->boolean('is_recurring')->default(true)
                ->comment('Recurring means this day/month repeats yearly');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['date', 'country_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_holidays');
    }
};
