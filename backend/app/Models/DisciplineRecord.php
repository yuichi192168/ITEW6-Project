<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplineRecord extends Model
{
    protected $fillable = [
        'student_id',
        'student_email',
        'student_name',
        'incident_date',
        'severity',
        'status',
        'offense',
        'guidance_notes',
        'action_taken',
        'is_resolved',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'is_resolved' => 'boolean',
    ];
}
