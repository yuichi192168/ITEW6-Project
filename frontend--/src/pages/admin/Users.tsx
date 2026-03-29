import React from 'react';
import { Settings } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Users Management</h1>
      <p className="text-gray-600 mb-8">Manage system users and roles</p>
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">User management features coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};
