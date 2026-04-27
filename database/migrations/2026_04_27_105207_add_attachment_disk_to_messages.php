<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SEC-02: Track which disk holds each message's attachment.
 *
 * Historical rows have attachments on the `public` disk (the leaky path).
 * New rows go to the `chat` private disk. The chat:migrate-attachments
 * Artisan command moves history forward and updates this column.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment_disk', 32)->nullable()->after('attachment_path');
        });

        // Backfill: any existing attachment is on the legacy public disk.
        \Illuminate\Support\Facades\DB::table('messages')
            ->whereNotNull('attachment_path')
            ->whereNull('attachment_disk')
            ->update(['attachment_disk' => 'public']);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('attachment_disk');
        });
    }
};
