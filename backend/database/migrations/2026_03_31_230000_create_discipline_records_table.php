<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discipline_records', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->nullable()->index();
            $table->string('student_email')->nullable()->index();
            $table->string('student_name');
            $table->date('incident_date');
            $table->string('severity')->default('low');
            $table->string('status')->default('for counseling');
            $table->text('offense');
            $table->text('guidance_notes')->nullable();
            $table->text('action_taken')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discipline_records');
    }
};
