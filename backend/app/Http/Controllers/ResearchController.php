<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Research;

class ResearchController extends Controller
{
    private function mapResearchForFrontend(Research $research): array
    {
        $authors = $research->authors;
        if (is_array($authors) && count($authors) > 0) {
            $author = (string) $authors[0];
        } elseif (is_string($authors)) {
            $decoded = json_decode($authors, true);
            $author = is_array($decoded) && count($decoded) > 0 ? (string) $decoded[0] : $authors;
        } else {
            $author = '';
        }

        return [
            'id' => (string) $research->id,
            'title' => $research->title,
            'author' => $author,
            'year' => (int) date('Y', strtotime((string) $research->publication_date)),
            'status' => $research->status ?: 'In Progress',
            'created_at' => $research->created_at,
            'updated_at' => $research->updated_at,
        ];
    }

    private function mapFrontendPayload(array $validated): array
    {
        $year = (int) ($validated['year'] ?? date('Y'));

        return [
            'title' => $validated['title'] ?? '',
            'description' => $validated['description'] ?? ($validated['title'] ?? ''),
            'authors' => [$validated['author'] ?? ''],
            'publication_date' => ($validated['publication_date'] ?? null) ?: sprintf('%04d-01-01', max(1900, min(2100, $year))),
            'status' => $validated['status'] ?? 'In Progress',
        ];
    }

    // 1. Show all research
    public function index()
    {
        $research = Research::all()->map(function (Research $item) {
            return $this->mapResearchForFrontend($item);
        });
        return response()->json($research);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:2100',
            'status' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'publication_date' => 'nullable|date',
        ]);

        $research = Research::create($this->mapFrontendPayload($validated));
        return response()->json($this->mapResearchForFrontend($research), 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'author' => 'sometimes|required|string|max:255',
            'year' => 'sometimes|required|integer|min:1900|max:2100',
            'status' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string',
            'publication_date' => 'sometimes|nullable|date',
        ]);

        $research = Research::findOrFail($id);
        $payload = $this->mapFrontendPayload($validated);
        $payload = array_filter($payload, function ($value) {
            return $value !== null;
        });
        $research->update($payload);

        return response()->json($this->mapResearchForFrontend($research->fresh()));
    }

    public function destroy($id)
    {
        $research = Research::findOrFail($id);
        $research->delete();
        return response()->json(['message' => 'Research deleted successfully']);
    }

    // 2. Approve research
    public function approve($id)
    {
        $research = Research::findOrFail($id);
        $research->update(['status' => 'Published']);
        return response()->json(['message' => 'Research approved']);
    }

    // 3. Change status
    public function changeStatus(Request $request, $id)
    {
        $status = (string) $request->input('status');
        $research = Research::findOrFail($id);
        $research->update(['status' => $status]);
        return response()->json(['message' => 'Status updated']);
    }

    // 4. Assign to panels
    public function assignPanels(Request $request, $id)
    {
        Research::findOrFail($id);
        return response()->json(['message' => 'Panels assigned']);
    }

    // 5. Assign to faculty for advisers
    public function assignAdviser(Request $request, $id)
    {
        Research::findOrFail($id);
        return response()->json(['message' => 'Adviser assigned']);
    }
}
