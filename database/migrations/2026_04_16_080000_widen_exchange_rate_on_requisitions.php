<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CAT2-11: Widen exchange_rate from decimal(10,4) to decimal(14,6).
 *
 * Some exotic currencies (e.g. NGN/JPY micro rates) require more than 4
 * decimal places to avoid rounding artefacts in the kobo conversion.
 * 6 decimal places covers any realistic FX rate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->decimal('exchange_rate', 14, 6)->default(1.0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0)->change();
        });
    }
};
