<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 4)->unique();
            $table->string('category', 10); // 5000, 6000, 7000, 8000, 9000, 9500
            $table->string('description');
            $table->boolean('tax_vat_applicable')->default(false);
            $table->boolean('tax_wht_applicable')->default(false);
            $table->tinyInteger('wht_rate')->nullable(); // null | 5 | 10
            $table->string('status', 20)->default('active'); // active | archived
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('category');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_codes');
    }
};
