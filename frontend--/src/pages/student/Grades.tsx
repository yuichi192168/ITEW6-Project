import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface StudentGrade {
  gradeId: string;
  classId: string;
  courseCode: string;
  courseName: string;
  term: string;
  attendance: number;
  activity: number;
  exam: number;
  totalGrade: number;
}

interface StudentGradesResponse {
  studentId: string;
  grades: StudentGrade[];
  gwa: number;
  totalCourses: number;
}

export const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>('All Terms');
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>(['All Terms']);
  const [gwa, setGwa] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchGrades = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParam = selectedTerm === 'All Terms' ? 'all' : selectedTerm;
        const response = await fetch(`http://localhost:8080/student/${user.id}/grades?term=${encodeURIComponent(queryParam)}`);
        if (!response.ok) {
          throw new Error('Failed to load grades');
        }

        const data: StudentGradesResponse = await response.json();
        setGrades(data.grades);
        setGwa(data.gwa);

        const terms = Array.from(new Set(data.grades.map((grade) => grade.term)));
        setTermOptions(['All Terms', ...terms]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user?.id, selectedTerm]);

  const avgGPA = useMemo(() => {
    return gwa.toFixed(2);
  }, [gwa]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Grades</h1>
          <p className="text-gray-600 mt-2">Your grade preview and calculated GWA</p>
        </div>
        <div className="text-right">
          <p className="text-gray-600 text-sm">GWA</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">{avgGPA}</p>
        </div>
      </div>

      {loading && <div className="text-center py-8">Loading grades...</div>}
      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Grade Report</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="termFilter" className="text-sm font-medium text-gray-700">Term</label>
            <select
              id="termFilter"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Course Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Course Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Term</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.gradeId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{grade.courseCode}</td>
                  <td className="py-3 px-4">{grade.courseName}</td>
                  <td className="py-3 px-4">{grade.term}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{grade.totalGrade}</td>
                </tr>
              ))}
              {grades.length === 0 && !loading && (
                <tr>
                  <td className="py-6 px-4 text-gray-500 text-center" colSpan={4}>
                    No grades found for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
