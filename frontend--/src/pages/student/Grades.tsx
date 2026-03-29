import React from 'react';
import { mockGrades } from '../../lib/constants';
import { TrendingUp } from 'lucide-react';

export const StudentGrades: React.FC = () => {
  const gradePoints: Record<string, number> = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0 };
  const avgGPA = (mockGrades.reduce((sum, g) => sum + (gradePoints[g.grade] || 0), 0) / mockGrades.length).toFixed(2);

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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Grade Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Course Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Semester</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockGrades.map((grade) => (
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
