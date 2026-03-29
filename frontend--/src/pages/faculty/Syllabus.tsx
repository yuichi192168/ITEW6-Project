import React from 'react';
import { BookOpen, Plus } from 'lucide-react';

export const FacultySyllabus: React.FC = () => {
  const syllabi = [
    { id: '1', course: 'CS101', title: 'Course Syllabus', status: 'Published', updated: '2024-01-15' },
    { id: '2', course: 'CS102', title: 'Course Syllabus', status: 'Draft', updated: '2024-01-20' },
    { id: '3', course: 'CS201', title: 'Course Syllabus', status: 'Published', updated: '2024-01-10' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Syllabus & Lessons</h1>
          <p className="text-gray-600 mt-2">Manage course syllabi and lesson materials</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
          <Plus size={20} />
          <span className="hidden sm:inline">New Syllabus</span>
        </button>
      </div>

      <div className="space-y-4">
        {syllabi.map((syllabus) => (
          <div key={syllabus.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white p-3 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{syllabus.course}</h3>
                  <p className="text-gray-600 text-sm">{syllabus.title}</p>
                  <p className="text-gray-600 text-sm mt-2">Last updated: {syllabus.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  syllabus.status === 'Published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {syllabus.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
