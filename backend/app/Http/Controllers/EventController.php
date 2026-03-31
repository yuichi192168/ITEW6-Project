<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;

class EventController extends Controller
{
    private function mapEventForFrontend(Event $event): array
    {
        return [
            'id' => (string) $event->id,
            'title' => $event->name,
            'description' => $event->description,
            'date' => $event->date,
            'location' => $event->location,
            'type' => $event->status ?: 'school',
            'startTime' => $event->start_time ?? '',
            'endTime' => $event->end_time ?? '',
            'organizer' => $event->organizer,
            'created_at' => $event->created_at,
            'updated_at' => $event->updated_at,
        ];
    }

    private function mapFrontendPayload(array $validated): array
    {
        return [
            'name' => $validated['title'] ?? $validated['name'] ?? '',
            'description' => $validated['description'] ?? '',
            'date' => $validated['date'] ?? now()->toDateString(),
            'location' => $validated['location'] ?? '',
            'organizer' => $validated['organizer'] ?? 'Admin',
            'status' => $validated['type'] ?? ($validated['status'] ?? 'school'),
            'start_time' => $validated['startTime'] ?? ($validated['start_time'] ?? null),
            'end_time' => $validated['endTime'] ?? ($validated['end_time'] ?? null),
        ];
    }

    public function index()
    {
        $events = Event::all()->map(function (Event $event) {
            return $this->mapEventForFrontend($event);
        });

        return response()->json($events);
    }

    // 1. Create event
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'required|string',
            'date' => 'required|date',
            'type' => 'sometimes|nullable|string|max:50',
            'startTime' => 'sometimes|nullable|string|max:20',
            'endTime' => 'sometimes|nullable|string|max:20',
            'start_time' => 'sometimes|nullable|string|max:20',
            'end_time' => 'sometimes|nullable|string|max:20',
            'location' => 'required|string|max:255',
            'organizer' => 'nullable|string|max:255',
            'faculty_ids' => 'nullable|array',
            'departments' => 'nullable|array',
            'status' => 'nullable|string|max:50',
        ]);

        $event = Event::create($this->mapFrontendPayload($validated));

        return response()->json($this->mapEventForFrontend($event), 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'date' => 'sometimes|required|date',
            'type' => 'sometimes|nullable|string|max:50',
            'startTime' => 'sometimes|nullable|string|max:20',
            'endTime' => 'sometimes|nullable|string|max:20',
            'start_time' => 'sometimes|nullable|string|max:20',
            'end_time' => 'sometimes|nullable|string|max:20',
            'location' => 'sometimes|required|string|max:255',
            'organizer' => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|nullable|string|max:50',
        ]);

        $event = Event::findOrFail($id);
        $payload = $this->mapFrontendPayload($validated);
        $payload = array_filter($payload, function ($value) {
            return $value !== null;
        });
        $event->update($payload);

        return response()->json($this->mapEventForFrontend($event->fresh()));
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);
        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }

    // 2. Invite department for schoolwide event (stub)
    public function inviteDepartment(Request $request, $id)
    {
        // Implement logic to invite department
        return response()->json(['message' => 'Department invited (stub)']);
    }

    // 3. Assign faculties to event
    public function assignFaculties(Request $request, $id)
    {
        $facultyIds = $request->input('faculty_ids', []);
        $event = Event::findOrFail($id);
        $event->update(['faculty_ids' => $facultyIds]);
        return response()->json(['message' => 'Faculties assigned']);
    }
}
