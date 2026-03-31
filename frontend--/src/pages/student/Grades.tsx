import React, { useEffect, useMemo, useState } from 'react';
import { mockGrades } from '../../lib/constants';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>('All Terms');
  const gradePoints: Record<string, number> = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0 };

  const parseYearLevel = (value: unknown): number => {
    if (typeof value === 'number') return Math.min(4, Math.max(1, value));
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (normalized.includes('first') || normalized.includes('1st')) return 1;
      if (normalized.includes('second') || normalized.includes('2nd')) return 2;
      if (normalized.includes('third') || normalized.includes('3rd')) return 3;
      if (normalized.includes('fourth') || normalized.includes('4th')) return 4;
      const extracted = normalized.match(/\d+/);
      if (extracted) {
        const year = parseInt(extracted[0], 10);
        return Math.min(4, Math.max(1, year));
      }
    }
    return 4;
  };

  const allYearTerms = [
    'First Year First Sem',
    'First Year Second Sem',
    'Second Year First Sem',
    'Second Year Second Sem',
    'Third Year First Sem',
    'Third Year Second Sem',
    'Fourth Year First Sem',
    'Fourth Year Second Sem',
  ];

  const termOptions = useMemo(() => {
    const currentYear = parseYearLevel(user?.yearLevel ?? user?.year);
    const allowedTerms = allYearTerms.slice(0, currentYear * 2);
    const existingTerms = Array.from(new Set(mockGrades.map((g) => g.semester)));
    const terms = allowedTerms.filter((term) => existingTerms.includes(term));
    return ['All Terms', ...terms];
  }, [user?.yearLevel, user?.year]);

  useEffect(() => {
    if (!termOptions.includes(selectedTerm)) {
      setSelectedTerm('All Terms');
    }
  }, [termOptions, selectedTerm]);

  const filteredGrades = useMemo(() => {
    if (selectedTerm === 'All Terms') return mockGrades;
    return mockGrades.filter((grade) => grade.semester === selectedTerm);
  }, [selectedTerm]);

  const avgGPA = useMemo(() => {
    if (filteredGrades.length === 0) return '0.00';
    const total = filteredGrades.reduce((sum, grade) => sum + (gradePoints[grade.grade] || 0), 0);
    return (total / filteredGrades.length).toFixed(2);
  }, [filteredGrades]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Grades</h1>

      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Overall GPA</p>
            <p className="text-4xl font-bold text-gray-800 mt-2">{avgGPA}</p>
          </div>
          <TrendingUp className="text-green-500" size={48} />
        </div>
      </div>

      <div className="card">
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Term</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{grade.courseCode}</td>
                  <td className="py-3 px-4">
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded">{grade.grade}</span>
                  </td>
                  <td className="py-3 px-4">{grade.semester}</td>
                  <td className="py-3 px-4">
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Completed</span>
                  </td>
                </tr>
              ))}
              {filteredGrades.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-gray-500 text-center" colSpan={4}>
                    No grades found for the selected term.
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
