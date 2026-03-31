<?php

namespace App\Models;

class Faculty extends FirestoreModel
{
    protected $table = 'faculty';
    
    protected $fillable = [
        'name', 'email', 'subject', 'profile', 'event_ids'
    ];

    protected static function getFirestoreCollection(): string
    {
        return 'faculties';
    }
}
