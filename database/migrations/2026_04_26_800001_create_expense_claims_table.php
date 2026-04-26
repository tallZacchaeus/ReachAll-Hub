<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('title', 200);
            $table->text('description')->nullable();

            $table->enum('category', [
                'travel',
                'accommodation',
                'meals',
                'equipment',
                'training',
                'communication',
                'medical',
                'other',
            ])->default('other');

            $table->char('currency', 3)->default('NGN');
            $table->decimal('amount', 15, 2);
            $table->decimal('exchange_rate', 10, 6)->default(1.000000);

            // Derived: (int) round(amount * exchange_rate * 100) — stored server-side only
            $table->unsignedBigInteger('amount_ngn_kobo');

            $table->date('expense_date');

            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'paid'])
                  ->default('draft');

            $table->timestamp('submitted_at')->nullable();

            $table->foreignId('reviewed_by_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->foreignId('finance_paid_by_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('finance_paid_at')->nullable();

            $table->timestamps();

            // Indexes for common filter/sort patterns
            $table->index(['user_id', 'status']);
            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_claims');
    }
};
