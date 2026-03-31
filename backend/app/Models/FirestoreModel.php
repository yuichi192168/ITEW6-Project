<?php

namespace App\Models;

use App\Services\FirestoreService;
use Illuminate\Database\Eloquent\Model;

/**
 * Base model for Firestore sync
 * Automatically syncs data to Firebase Firestore when created or updated
 */
abstract class FirestoreModel extends Model
{
    protected static $firestore;
    
    /**
     * Get the Firestore collection name
     * Override this in child classes
     */
    abstract protected static function getFirestoreCollection(): string;

    /**
     * Get Firestore service instance
     */
    protected static function firestore(): FirestoreService
    {
        if (!self::$firestore) {
            self::$firestore = new FirestoreService();
        }
        return self::$firestore;
    }

    /**
     * Bootstrap the model and bind model events
     */
    protected static function boot()
    {
        parent::boot();

        // Sync to Firestore when created
        static::created(function ($model) {
            $model->syncToFirestore();
        });

        // Sync to Firestore when updated
        static::updated(function ($model) {
            $model->syncToFirestore();
        });

        // Delete from Firestore when deleted
        static::deleted(function ($model) {
            $model->deleteFromFirestore();
        });
    }

    /**
     * Sync model data to Firestore
     */
    public function syncToFirestore()
    {
        try {
            $collection = static::getFirestoreCollection();
            $data = $this->toArray();
            
            // Use the model's ID as the document ID
            self::firestore()->updateDocument($collection, (string)$this->id, $data);
        } catch (\Throwable $e) {
            \Log::error("Failed to sync to Firestore: " . $e->getMessage());
        }
    }

    /**
     * Delete model from Firestore
     */
    public function deleteFromFirestore()
    {
        try {
            $collection = static::getFirestoreCollection();
            self::firestore()->deleteDocument($collection, (string)$this->id);
        } catch (\Throwable $e) {
            \Log::error("Failed to delete from Firestore: " . $e->getMessage());
        }
    }

    /**
     * Sync all existing records to Firestore
     */
    public static function syncAllToFirestore()
    {
        $collection = static::getFirestoreCollection();
        $firestore = self::firestore();

        foreach (static::all() as $model) {
            try {
                $firestore->updateDocument($collection, (string)$model->id, $model->toArray());
            } catch (\Throwable $e) {
                \Log::error("Failed to sync {$model->id} to Firestore: " . $e->getMessage());
            }
        }
    }
}
