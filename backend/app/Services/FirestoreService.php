<?php

namespace App\Services;

use Google\Cloud\Firestore\FirestoreClient;

class FirestoreService
{
    protected $firestore;

    public function __construct()
    {
        $this->firestore = new FirestoreClient([
            'projectId' => env('FIREBASE_PROJECT_ID'),
            'keyFilePath' => config('firebase.credentials'),
        ]);
    }

    public function getCollection(string $collection)
    {
        return $this->firestore->collection($collection)->documents();
    }

    public function getDocument(string $collection, string $documentId)
    {
        return $this->firestore->collection($collection)->document($documentId)->snapshot();
    }

    public function addDocument(string $collection, array $data)
    {
        return $this->firestore->collection($collection)->add($data);
    }

    public function updateDocument(string $collection, string $documentId, array $data)
    {
        return $this->firestore->collection($collection)->document($documentId)->set($data, ['merge' => true]);
    }

    public function deleteDocument(string $collection, string $documentId)
    {
        return $this->firestore->collection($collection)->document($documentId)->delete();
    }
}