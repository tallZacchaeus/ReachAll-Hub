<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Structured FK refs — existing string columns (department, position, location)
            // are kept for backward compatibility; new FK columns are the source of truth.
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete()->after('department');
            $table->foreignId('job_position_id')->nullable()->constrained('job_positions')->nullOnDelete()->after('position');
            $table->foreignId('office_location_id')->nullable()->constrained('office_locations')->nullOnDelete()->after('location');

            // Reporting line
            $table->foreignId('reports_to_id')->nullable()->constrained('users')->nullOnDelete()->after('office_location_id');

            // Employee biographical & employment data
            $table->date('hire_date')->nullable()->after('reports_to_id');
            $table->date('date_of_birth')->nullable()->after('hire_date');
            $table->string('gender', 30)->nullable()->after('date_of_birth');
            // full_time | part_time | contract | intern
            $table->string('employment_type', 30)->nullable()->after('gender');
            $table->date('probation_end_date')->nullable()->after('employment_type');
            // National Identification Number (Nigeria)
            $table->string('nin', 30)->nullable()->after('probation_end_date');

            $table->index('department_id');
            $table->index('job_position_id');
            $table->index('reports_to_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['job_position_id']);
            $table->dropForeign(['office_location_id']);
            $table->dropForeign(['reports_to_id']);
            $table->dropColumn([
                'department_id', 'job_position_id', 'office_location_id',
                'reports_to_id', 'hire_date', 'date_of_birth', 'gender',
                'employment_type', 'probation_end_date', 'nin',
            ]);
        });
    }
};
