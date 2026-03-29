import React from 'react';
import { BookOpen, Download } from 'lucide-react';

export const StudentLessons: React.FC = () => {
  const lessons = [
    { id: '1', course: 'CS101', title: 'Introduction to Programming', materials: 5 },
    { id: '2', course: 'CS102', title: 'Data Structures', materials: 8 },
    { id: '3', course: 'CS201', title: 'Database Systems', materials: 6 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Lessons & Materials</h1>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white p-3 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{lesson.title}</h3>
                  <p className="text-gray-600 text-sm">{lesson.course}</p>
                  <p className="text-gray-600 text-sm mt-2">{lesson.materials} teaching materials available</p>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                <Download size={18} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
