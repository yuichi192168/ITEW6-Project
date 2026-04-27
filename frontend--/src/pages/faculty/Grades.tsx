import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface StudentGrade {
  studentId: string;
  studentName: string;
  email: string;
  yearLevel: number;
  department: string;
  attendance: number;
  activity: number;
  exam: number;
  totalGrade: number;
}

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  semester: string;
  yearLevel?: string | number;
}

interface GradeData {
  classId: string;
  classSchedule: Class;
  studentGrades: StudentGrade[];
}

export const FacultyGrades: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFacultyEndpoint = async (path: string, init?: RequestInit) => {
    const directResponse = await fetch(`${API_BASE}${path}`, init);
    if (directResponse.status !== 404) {
      return directResponse;
    }

    return fetch(`${API_BASE}/api${path}`, init);
  };

  // Fetch available classes
  useEffect(() => {
    if (!user?.id) return;

    const fetchClasses = async () => {
      try {
        const response = await fetchFacultyEndpoint(`/faculty/${user.id}/classes`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data: Class[] = await response.json();
        setClasses(data);
        if (data.length > 0) {
          const firstClass = data[0];
          const defaultYear = String(firstClass.yearLevel ?? 'all');
          const defaultSection = String(firstClass.section ?? 'all');

          setSelectedYearLevel(defaultYear);
          setSelectedSection(defaultSection);
          setSelectedClassId(firstClass.id);
        }
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };

    fetchClasses();
  }, [user?.id]);

  const yearLevelOptions = Array.from(
    new Set(classes.map((cls) => String(cls.yearLevel ?? 'Unassigned')))
  );

  const sectionOptions = Array.from(
    new Set(
      classes
        .filter((cls) =>
          selectedYearLevel === 'all'
            ? true
            : String(cls.yearLevel ?? 'Unassigned') === selectedYearLevel
        )
        .map((cls) => String(cls.section ?? 'Unassigned'))
    )
  );

  const filteredClasses = classes.filter((cls) => {
    const matchesYear =
      selectedYearLevel === 'all' || String(cls.yearLevel ?? 'Unassigned') === selectedYearLevel;
    const matchesSection =
      selectedSection === 'all' || String(cls.section ?? 'Unassigned') === selectedSection;
    return matchesYear && matchesSection;
  });

  useEffect(() => {
    if (filteredClasses.length === 0) {
      setSelectedClassId('');
      return;
    }

    if (!filteredClasses.some((cls) => cls.id === selectedClassId)) {
      setSelectedClassId(filteredClasses[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  // Fetch grades when class is selected
  useEffect(() => {
    if (!user?.id || !selectedClassId) return;

    const fetchGrades = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/faculty/${user.id}/grades/${selectedClassId}`
        );
        const apiResponse = response.status === 404
          ? await fetch(`${API_BASE}/api/faculty/${user.id}/grades/${selectedClassId}`)
          : response;

        if (!apiResponse.ok) throw new Error('Failed to fetch grades');
        const data: GradeData = await apiResponse.json();
        setGrades(data.studentGrades);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading grades');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user?.id, selectedClassId]);

  // Handle grade input change
  const handleGradeChange = (studentId: string, field: 'attendance' | 'activity' | 'exam', value: string) => {
    const numValue = Math.min(100, Math.max(0, Number(value) || 0));
    setGrades(
      grades.map((grade) => {
        if (grade.studentId === studentId) {
          const updated = { ...grade, [field]: numValue };
          // Recalculate total: (attendance * 0.1) + (activity * 0.4) + (exam * 0.5)
          updated.totalGrade = 
            (updated.attendance * 0.1) + (updated.activity * 0.4) + (updated.exam * 0.5);
          return updated;
        }
        return grade;
      })
    );
  };

  // Save grades
  const handleSaveGrades = async () => {
    if (!user?.id || !selectedClassId) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetchFacultyEndpoint(
        `/faculty/${user.id}/grades/${selectedClassId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grades: grades.map((g) => ({
              studentId: g.studentId,
              attendance: g.attendance,
              activity: g.activity,
              exam: g.exam,
            })),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save grades');
      setSuccess('Grades saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving grades');
    } finally {
      setSaving(false);
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classAverage = grades.length > 0
    ? grades.reduce((sum, grade) => sum + grade.totalGrade, 0) / grades.length
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Grade Entry</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">{success}</div>
      )}

      <div className="card">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
            <select
              value={selectedYearLevel}
              onChange={(e) => {
                setSelectedYearLevel(e.target.value);
                setSelectedSection('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All year levels</option>
              {yearLevelOptions.map((yearLevel) => (
                <option key={yearLevel} value={yearLevel}>
                  {yearLevel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All sections</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.courseCode} - {cls.courseName} ({cls.section})
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentClass && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Class:</strong> {currentClass.courseName} ({currentClass.courseCode}) • 
              <strong className="ml-3">Section:</strong> {currentClass.section}
              <strong className="ml-3">Year:</strong> {String(currentClass.yearLevel ?? 'Unassigned')}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading grades...</div>
        ) : grades.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No students in this class</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Attendance (10%)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Activity (40%)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Exam (50%)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.studentId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{grade.studentName}</p>
                          <p className="text-xs text-gray-500">{grade.department}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{grade.studentId}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.attendance}
                          onChange={(e) =>
                            handleGradeChange(grade.studentId, 'attendance', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.activity}
                          onChange={(e) =>
                            handleGradeChange(grade.studentId, 'activity', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.exam}
                          onChange={(e) =>
                            handleGradeChange(grade.studentId, 'exam', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 bg-blue-50 px-3 py-1 rounded text-center">
                          {grade.totalGrade.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={5} className="py-3 px-4 text-right font-semibold text-gray-700">
                      Class Average Total Grade
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-800 bg-blue-100 px-3 py-1 rounded text-center">
                        {classAverage.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveGrades}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Grades'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
