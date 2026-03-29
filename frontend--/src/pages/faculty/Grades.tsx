import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const FacultyGrades: React.FC = () => {
  const [grades, setGrades] = useState([
    { id: '1', studentId: '1', studentName: 'John Doe', courseId: '1', grade: 'A', },
    { id: '2', studentId: '2', studentName: 'Jane Smith', courseId: '1', grade: 'B+', },
    { id: '3', studentId: '3', studentName: 'Bob Johnson', courseId: '1', grade: 'A-', },
  ]);

  const handleGradeChange = (id: string, newGrade: string) => {
    setGrades(grades.map(g => g.id === id ? { ...g, grade: newGrade } : g));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Grade Entry</h1>

      <div className="card">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course</label>
          <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
            <option>CS101 - Introduction to Programming</option>
            <option>CS102 - Data Structures</option>
            <option>CS201 - Database Systems</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{grade.studentName}</td>
                  <td className="py-3 px-4">{grade.studentId}</td>
                  <td className="py-3 px-4">
                    <select
                      value={grade.grade}
                      onChange={(e) => handleGradeChange(grade.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                    >
                      <option>A</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B</option>
                      <option>B-</option>
                      <option>C+</option>
                      <option>C</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-6 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg">
          <Save size={20} />
          Save Grades
        </button>
      </div>
    </div>
  );
};
