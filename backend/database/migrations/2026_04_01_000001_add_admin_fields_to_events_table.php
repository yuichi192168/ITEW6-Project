<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'status')) {
                $table->string('status')->nullable()->after('organizer');
            }
            if (!Schema::hasColumn('events', 'start_time')) {
                $table->string('start_time')->nullable()->after('status');
            }
            if (!Schema::hasColumn('events', 'end_time')) {
                $table->string('end_time')->nullable()->after('start_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('events', 'end_time')) {
                $columns[] = 'end_time';
            }
            if (Schema::hasColumn('events', 'start_time')) {
                $columns[] = 'start_time';
            }
            if (Schema::hasColumn('events', 'status')) {
                $columns[] = 'status';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
