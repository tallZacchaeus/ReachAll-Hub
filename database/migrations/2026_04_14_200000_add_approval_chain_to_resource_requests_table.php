<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            $table->json('approval_chain')->nullable()->after('status');
            $table->unsignedTinyInteger('approval_level')->default(0)->after('approval_chain');
        });
    }

    public function down(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            $table->dropColumn(['approval_chain', 'approval_level']);
        });
    }
};
