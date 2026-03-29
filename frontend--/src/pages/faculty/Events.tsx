import React from 'react';
import { mockEvents } from '../../lib/constants';
import { CalendarDays } from 'lucide-react';

export const FacultyEvents: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Events</h1>

      <div className="space-y-4">
        {mockEvents.map((event) => (
          <div key={event.id} className="card border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                <p className="text-gray-600 mt-1">{event.description}</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CalendarDays size={20} />
                <span>{event.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
