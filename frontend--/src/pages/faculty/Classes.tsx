import React from 'react';
import { mockClasses } from '../../lib/constants';
import { Users, Clock, BookOpen } from 'lucide-react';

export const FacultyClasses: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Classes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClasses.map((cls) => (
          <div key={cls.id} className="card hover:shadow-lg transition">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{cls.code}</h3>
                  <p className="text-sm text-gray-600">{cls.name}</p>
                </div>
                <span className="bg-primary text-white text-xs px-2 py-1 rounded">Section {cls.section}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 text-gray-600">
                <Users size={18} />
                <span className="text-sm">{cls.students} Students</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock size={18} />
                <span className="text-sm">{cls.schedule}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <BookOpen size={18} />
                <span className="text-sm">View Materials</span>
              </div>
            </div>

            <button className="w-full mt-4 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition">
              Manage Class
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
