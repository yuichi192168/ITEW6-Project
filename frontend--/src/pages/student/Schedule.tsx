import React from 'react';
import { mockSchedule } from '../../lib/constants';

export const StudentSchedule: React.FC = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Schedule</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {days.map((day) => {
          const daySchedule = mockSchedule.filter(s => s.day === day);
          return (
            <div key={day} className="card">
              <h3 className="font-bold text-gray-800 mb-4 text-center">{day}</h3>
              {daySchedule.length > 0 ? (
                <div className="space-y-3">
                  {daySchedule.map((s) => (
                    <div key={s.id} className="bg-gradient-to-r from-primary to-primary-dark text-white p-3 rounded-lg">
                      <p className="font-semibold text-sm">{s.course}</p>
                      <p className="text-xs opacity-90">{s.time}</p>
                      <p className="text-xs opacity-90">{s.room}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm">No classes</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
