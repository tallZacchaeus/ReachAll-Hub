<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('department');
            $table->text('description');
            $table->text('requirements');
            $table->unsignedBigInteger('posted_by_user_id');
            $table->foreign('posted_by_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('status')->default('open'); // open | closed
            $table->date('closes_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
