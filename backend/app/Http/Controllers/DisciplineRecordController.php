<?php

namespace App\Http\Controllers;

use App\Models\DisciplineRecord;
use Illuminate\Http\Request;

class DisciplineRecordController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'nullable|string|max:255',
            'student_email' => 'nullable|email|max:255',
            'student_name' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'severity' => 'required|string|max:50',
            'status' => 'required|string|max:100',
            'offense' => 'required|string',
            'guidance_notes' => 'nullable|string',
            'action_taken' => 'nullable|string',
            'is_resolved' => 'nullable|boolean',
        ]);

        $record = DisciplineRecord::create($validated);

        return response()->json($record, 201);
    }

    public function index(Request $request)
    {
        $studentId = $request->query('studentId');
        $studentEmail = $request->query('email');

        $query = DisciplineRecord::query();

        if ($studentId || $studentEmail) {
            $query->where(function ($q) use ($studentId, $studentEmail) {
                if ($studentId) {
                    $q->orWhere('student_id', $studentId);
                }
                if ($studentEmail) {
                    $q->orWhere('student_email', $studentEmail);
                }
            });
        }

        return response()->json(
            $query->orderByDesc('incident_date')->orderByDesc('created_at')->get()
        );
    }
}
