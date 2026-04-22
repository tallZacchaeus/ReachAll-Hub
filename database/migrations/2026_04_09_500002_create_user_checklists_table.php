<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_checklists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unsignedBigInteger('checklist_template_id');
            $table->foreign('checklist_template_id')->references('id')->on('checklist_templates')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'checklist_template_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_checklists');
    }
};
