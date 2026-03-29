import React from 'react';
import { Calendar } from 'lucide-react';

export const AdminScheduling: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Scheduling Management</h1>
      <p className="text-gray-600 mb-8">Manage class schedules and academic calendar</p>

      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Schedule management features coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};
