<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;

class FacultyController extends Controller
{
    private function mapFacultyForFrontend(Faculty $faculty): array
    {
        $profile = [];
        if (is_string($faculty->profile) && $faculty->profile !== '') {
            $decoded = json_decode($faculty->profile, true);
            if (is_array($decoded)) {
                $profile = $decoded;
            }
        }

        return [
            'id' => (string) $faculty->id,
            'name' => $faculty->name,
            'email' => $faculty->email,
            'department' => $profile['department'] ?? 'Computer Science',
            'specialization' => $faculty->subject ?? '',
            'phone' => $profile['phone'] ?? '',
            'office' => $profile['office'] ?? '',
            'qualifications' => $profile['qualifications'] ?? '',
            'created_at' => $faculty->created_at,
            'updated_at' => $faculty->updated_at,
        ];
    }

    private function mapFrontendPayload(array $validated): array
    {
        $department = $validated['department'] ?? 'Computer Science';
        $phone = $validated['phone'] ?? '';
        $office = $validated['office'] ?? '';
        $qualifications = $validated['qualifications'] ?? '';
        $profile = [
            'department' => $department,
            'phone' => $phone,
            'office' => $office,
            'qualifications' => $qualifications,
        ];

        return [
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'subject' => $validated['specialization'] ?? ($validated['subject'] ?? ''),
            'profile' => json_encode($profile),
        ];
    }

    public function index()
    {
        $faculty = Faculty::all()->map(function (Faculty $item) {
            return $this->mapFacultyForFrontend($item);
        });

        return response()->json($faculty);
    }

    // 1. Add new faculty
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'office' => 'nullable|string|max:255',
            'qualifications' => 'nullable|string|max:1000',
            'subject' => 'nullable|string|max:255',
        ]);

        $faculty = Faculty::create($this->mapFrontendPayload($validated));

        return response()->json($this->mapFacultyForFrontend($faculty), 201);
    }

    // 2. Assign faculty to a subject
    public function assignSubject(Request $request, $id)
    {
        $subject = $request->input('subject');
        $faculty = Faculty::findOrFail($id);
        $faculty->update(['subject' => $subject]);
        return response()->json(['message' => 'Subject assigned successfully']);
    }

    // 3. Edit faculty profile
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email',
            'department' => 'sometimes|nullable|string|max:255',
            'specialization' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'office' => 'sometimes|nullable|string|max:255',
            'qualifications' => 'sometimes|nullable|string|max:1000',
            'subject' => 'sometimes|nullable|string|max:255',
        ]);

        $faculty = Faculty::findOrFail($id);
        $payload = $this->mapFrontendPayload($validated);
        $payload = array_filter($payload, function ($value) {
            return $value !== null;
        });
        $faculty->update($payload);

        return response()->json($this->mapFacultyForFrontend($faculty->fresh()));
    }

    public function destroy($id)
    {
        $faculty = Faculty::findOrFail($id);
        $faculty->delete();
        return response()->json(['message' => 'Faculty deleted successfully']);
    }

    // 4. Email/message a student (stub)
    public function messageStudent(Request $request)
    {
        // Implement email/message logic here
        return response()->json(['message' => 'Message sent (stub)']);
    }

    // 5. Assign faculty to an event
    public function assignEvent(Request $request, $id)
    {
        $eventId = $request->input('event_id');
        $faculty = Faculty::findOrFail($id);
        $eventIds = $faculty->event_ids ?? [];
        $eventIds[] = $eventId;
        $faculty->update(['event_ids' => array_values(array_unique($eventIds))]);

        return response()->json(['message' => 'Event assigned successfully']);
    }
}
