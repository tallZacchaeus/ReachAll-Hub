<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained('job_applications')->cascadeOnDelete();
            $table->unsignedBigInteger('offered_salary_kobo');
            $table->date('start_date');
            $table->date('offer_date');
            $table->date('expiry_date')->nullable();
            $table->string('status', 30)->default('draft')
                ->comment('draft|sent|accepted|declined|expired|withdrawn');
            $table->string('document_path')->nullable();
            $table->string('document_disk')->nullable()->default('hr');
            $table->text('notes')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique('job_application_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_letters');
    }
};
