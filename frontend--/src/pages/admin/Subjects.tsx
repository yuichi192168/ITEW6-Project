import React from 'react';
import { BookOpen } from 'lucide-react';

export const AdminSubjects: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Subjects & Curriculum</h1>
      <p className="text-gray-600 mb-8">Manage subjects and curriculum offerings</p>
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Subject management features coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};
