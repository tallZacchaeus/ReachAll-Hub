<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at'], 'messages_conversation_created_idx');
            $table->index(['user_id', 'created_at'], 'messages_user_created_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'read_at'], 'notifications_notifiable_read_idx');
        });

        Schema::table('compliance_documents', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'compliance_documents_user_status_idx');
            $table->index('expires_at', 'compliance_documents_expires_idx');
        });
    }

    public function down(): void
    {
        Schema::table('compliance_documents', function (Blueprint $table) {
            $table->dropIndex('compliance_documents_user_status_idx');
            $table->dropIndex('compliance_documents_expires_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_notifiable_read_idx');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_conversation_created_idx');
            $table->dropIndex('messages_user_created_idx');
        });
    }
};
