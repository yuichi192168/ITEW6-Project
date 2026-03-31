<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;

class StudentController extends Controller
{
    private function normalizeYearLevel($value): int
    {
        if (is_numeric($value)) {
            $num = (int) $value;
            return max(1, min(4, $num));
        }

        if (is_string($value) && preg_match('/^\d+/', $value, $matches)) {
            $num = (int) $matches[0];
            return max(1, min(4, $num));
        }

        return 1;
    }

    private function normalizeStatus(?string $value): string
    {
        $status = strtolower((string) $value);

        return match ($status) {
            'regular', 'active' => 'active',
            'irregular', 'inactive' => 'inactive',
            'graduated' => 'graduated',
            default => 'active',
        };
    }

    private function mapStudentForFrontend(Student $student): array
    {
        $yearSuffix = match ((int) $student->year_level) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };

        return [
            'id' => (string) $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'idNumber' => $student->profile['idNumber'] ?? '',
            'program' => $student->department,
            'year' => $student->year_level . $yearSuffix,
            'status' => $student->status === 'inactive' ? 'Irregular' : 'Regular',
            'phone' => $student->profile['phone'] ?? '',
            'address' => $student->profile['address'] ?? '',
            'dateOfBirth' => $student->profile['dateOfBirth'] ?? '',
            'skills' => $student->profile['skills'] ?? '',
            'organizations' => $student->profile['organizations'] ?? '',
            'created_at' => $student->created_at,
            'updated_at' => $student->updated_at,
        ];
    }

    // API CRUD methods
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->has('department')) {
            $query->where('department', $request->department);
        }

        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $students = $query->get()->map(function (Student $student) {
            return $this->mapStudentForFrontend($student);
        });

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'department' => 'nullable|string|max:255',
            'program' => 'nullable|string|max:255',
            'year_level' => 'nullable',
            'year' => 'nullable',
            'status' => 'nullable|string',
            'idNumber' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'dateOfBirth' => 'nullable|string|max:255',
            'skills' => 'nullable|string|max:1000',
            'organizations' => 'nullable|string|max:1000',
        ]);

        $student = Student::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'department' => $validated['department'] ?? $validated['program'] ?? 'BSCS',
            'year_level' => $this->normalizeYearLevel($validated['year_level'] ?? $validated['year'] ?? 1),
            'status' => $this->normalizeStatus($validated['status'] ?? 'active'),
            'profile' => [
                'idNumber' => $validated['idNumber'] ?? '',
                'phone' => $validated['phone'] ?? '',
                'address' => $validated['address'] ?? '',
                'dateOfBirth' => $validated['dateOfBirth'] ?? '',
                'skills' => $validated['skills'] ?? '',
                'organizations' => $validated['organizations'] ?? '',
            ],
        ]);

        return response()->json($this->mapStudentForFrontend($student), 201);
    }

    public function show($id)
    {
        $student = Student::findOrFail($id);
        return response()->json($student);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email',
            'department' => 'sometimes|string|max:255',
            'program' => 'sometimes|string|max:255',
            'year_level' => 'sometimes',
            'year' => 'sometimes',
            'status' => 'sometimes|string',
            'idNumber' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'dateOfBirth' => 'sometimes|nullable|string|max:255',
            'skills' => 'sometimes|nullable|string|max:1000',
            'organizations' => 'sometimes|nullable|string|max:1000',
        ]);

        $student = Student::findOrFail($id);
        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $payload['email'] = $validated['email'];
        }
        if (array_key_exists('department', $validated) || array_key_exists('program', $validated)) {
            $payload['department'] = $validated['department'] ?? $validated['program'];
        }
        if (array_key_exists('year_level', $validated) || array_key_exists('year', $validated)) {
            $payload['year_level'] = $this->normalizeYearLevel($validated['year_level'] ?? $validated['year']);
        }
        if (array_key_exists('status', $validated)) {
            $payload['status'] = $this->normalizeStatus($validated['status']);
        }

        $profile = is_array($student->profile) ? $student->profile : [];
        foreach (['idNumber', 'phone', 'address', 'dateOfBirth', 'skills', 'organizations'] as $field) {
            if (array_key_exists($field, $validated)) {
                $profile[$field] = $validated[$field] ?? '';
            }
        }
        $payload['profile'] = $profile;

        $student->update($payload);

        return response()->json($this->mapStudentForFrontend($student->fresh()));
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'Student deleted successfully']);
    }

    // 4. Email/message student (stub)
    public function messageStudent(Request $request, $id)
    {
        // Implement email/message logic here
        return response()->json(['message' => 'Message sent (stub)']);
    }
}
