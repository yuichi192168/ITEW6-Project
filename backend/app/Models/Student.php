<?php

namespace App\Models;

class Student extends FirestoreModel
{
    protected $fillable = [
        'name', 'email', 'department', 'year_level', 'status', 'profile'
    ];

    protected $casts = [
        'profile' => 'array',
    ];

    protected static function getFirestoreCollection(): string
    {
        return 'students';
    }
}
