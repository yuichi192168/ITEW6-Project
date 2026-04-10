import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  isRegistered: boolean;
}

export const FacultyEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        const data: Event[] = await response.json();
        const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(sorted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8080/faculty/${user.id}/events/${eventId}/join`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to join event');
      
      setEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, isRegistered: true } : event
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error joining event');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Events</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
      )}

      {events.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-600">No events available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="card border-l-4 border-primary">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>📍 {event.location}</span>
                    <span>🏷️ {event.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <CalendarDays size={20} />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  {event.isRegistered ? (
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle size={20} />
                      Registered
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinEvent(event.id)}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Join Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
