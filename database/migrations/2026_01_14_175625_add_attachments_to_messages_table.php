<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('content');
            $table->string('attachment_name')->nullable()->after('attachment_path');
            $table->string('attachment_type')->nullable()->after('attachment_name'); // image, document, etc.
            $table->integer('attachment_size')->nullable()->after('attachment_type'); // in bytes
            $table->boolean('is_edited')->default(false)->after('attachment_size');
            $table->timestamp('edited_at')->nullable()->after('is_edited');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_path',
                'attachment_name',
                'attachment_type',
                'attachment_size',
                'is_edited',
                'edited_at',
            ]);
            $table->dropSoftDeletes();
        });
    }
};
