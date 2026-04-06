import React, { useEffect, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { eventsDB } from '../../lib/database';
import { EmptyState } from '../../components/ui/shared';
import { mockEvents } from '../../lib/constants';

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  type: string;
}

export const FacultyEvents: React.FC = () => {
  const { data: events, error, execute: fetchEvents } = useAsync<Event[]>(() =>
    eventsDB.getAllEvents().then((data: any) => data as Event[]).catch(() => (mockEvents as unknown as Event[]))
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const refreshEvents = () => fetchEvents();
    window.addEventListener('eventsUpdated', refreshEvents);
    return () => window.removeEventListener('eventsUpdated', refreshEvents);
  }, [fetchEvents]);

  const visibleEvents = useMemo(() => {
    if (events && events.length > 0) return events;
    if (error) return mockEvents as unknown as Event[];
    return [] as Event[];
  }, [events, error]);

  const sortedEvents = useMemo(
    () => [...visibleEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [visibleEvents]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Events</h1>

      {sortedEvents.length === 0 ? (
        <EmptyState
          icon="Calendar"
          title="No events yet"
          description="Admin-created events will appear here once they are published."
        />
      ) : (
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div key={event.id} className="card border-l-4 border-primary">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold whitespace-nowrap">
                  <CalendarDays size={20} />
                  <span>{event.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
