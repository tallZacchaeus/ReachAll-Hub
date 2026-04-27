<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('body');
            $table->unsignedBigInteger('category_id');
            $table->foreign('category_id')->references('id')->on('content_categories');
            // PROD-01: MySQL 8 disallows DEFAULT on JSON columns (MariaDB and
            // SQLite tolerate it). The application sets this default in
            // ContentPage::booted() / wherever rows are created — see
            // ContentSeeder + admin/content controllers.
            $table->json('stage_visibility')->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedBigInteger('author_id');
            $table->foreign('author_id')->references('id')->on('users');
            $table->string('featured_image')->nullable();
            $table->json('attachments')->nullable();
            $table->boolean('requires_acknowledgement')->default(false);
            $table->date('acknowledgement_deadline')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_pages');
    }
};
