<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_checklist_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_checklist_id');
            $table->foreign('user_checklist_id')->references('id')->on('user_checklists')->cascadeOnDelete();
            $table->unsignedBigInteger('checklist_item_id');
            $table->foreign('checklist_item_id')->references('id')->on('checklist_items')->cascadeOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // PROD-01: explicit name — Laravel's auto-generated
            // user_checklist_progress_user_checklist_id_checklist_item_id_unique is
            // 70 chars and exceeds MySQL/MariaDB's 64-char identifier limit.
            $table->unique(
                ['user_checklist_id', 'checklist_item_id'],
                'user_checklist_progress_uc_ci_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_checklist_progress');
    }
};
