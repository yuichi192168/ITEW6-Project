<?php

namespace App\Models;

class Event extends FirestoreModel
{
    protected $fillable = [
        'name', 'description', 'date', 'location', 'organizer', 'status', 'start_time', 'end_time'
    ];

    protected static function getFirestoreCollection(): string
    {
        return 'events';
    }
}
