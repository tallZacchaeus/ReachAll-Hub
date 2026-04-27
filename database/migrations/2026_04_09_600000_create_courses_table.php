<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('type')->default('optional'); // mandatory | optional | certification
            // PROD-01: MySQL 8 disallows DEFAULT on JSON columns. Default
            // is set at the model layer (Course::$attributes).
            $table->json('stage_visibility')->nullable();
            $table->string('category');
            $table->longText('content'); // TipTap HTML
            $table->integer('duration_minutes')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
