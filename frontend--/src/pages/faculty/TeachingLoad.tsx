import React from 'react';
import { mockClasses } from '../../lib/constants';
import { Briefcase } from 'lucide-react';

export const FacultyTeachingLoad: React.FC = () => {
  const totalHours = mockClasses.length * 3;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Teaching Load</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{mockClasses.length}</p>
            </div>
            <Briefcase className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{mockClasses.reduce((sum, c) => sum + c.students, 0)}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Teaching Hours/Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{totalHours}</p>
            </div>
            <Clock className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Schedule</h2>
        <div className="space-y-3">
          {mockClasses.map((cls) => (
            <div key={cls.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">{cls.code} - {cls.name}</p>
                <p className="text-sm text-gray-600">{cls.schedule}</p>
              </div>
              <span className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">3 hrs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { Users, Clock } from 'lucide-react';
