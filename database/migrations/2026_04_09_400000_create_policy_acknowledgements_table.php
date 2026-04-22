<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('content_page_id');
            $table->foreign('content_page_id')->references('id')->on('content_pages');
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users');
            $table->timestamp('acknowledged_at');
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->unique(['content_page_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_acknowledgements');
    }
};
