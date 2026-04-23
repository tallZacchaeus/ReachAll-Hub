<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();       // slug: 'hr', 'finance', 'superadmin'
            $table->string('label', 200);                // display: 'Human Resources'
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false); // protected: cannot be deleted
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
