import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  isRegistered: boolean;
  invitedStudents?: string[];
  invited_students?: string[];
}

interface FacultyClass {
  id: string;
  courseCode?: string;
  courseName?: string;
  section?: string;
}

interface StudentOption {
  id: string;
  name?: string;
  email?: string;
}

export const FacultyEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitingEventId, setInvitingEventId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  const fetchFacultyEndpoint = async (path: string, init?: RequestInit) => {
    const directResponse = await fetch(`${API_BASE}${path}`, init);
    if (directResponse.status !== 404) {
      return directResponse;
    }

    return fetch(`${API_BASE}/api${path}`, init);
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetchFacultyEndpoint(`/faculty/${user.id}/events`);
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

  useEffect(() => {
    if (!user?.id) return;

    const fetchClasses = async () => {
      try {
        const response = await fetchFacultyEndpoint(`/faculty/${user.id}/classes`);
        if (!response.ok) {
          setClasses([]);
          return;
        }

        const data = (await response.json()) as FacultyClass[];
        setClasses(data);
      } catch {
        setClasses([]);
      }
    };

    fetchClasses();
  }, [user?.id]);

  const loadStudentsForClass = async (classId: string) => {
    if (!user?.id || !classId) {
      setStudents([]);
      return;
    }

    const response = await fetchFacultyEndpoint(`/faculty/${user.id}/classes/${classId}/students`);
    if (!response.ok) {
      setStudents([]);
      return;
    }

    const data = (await response.json()) as StudentOption[];
    setStudents(data);
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetchFacultyEndpoint(`/faculty/${user.id}/events/${eventId}/join`, {
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

  const openInviteModal = async (eventId: string) => {
    setInvitingEventId(eventId);
    setSelectedStudentIds([]);

    const firstClassId = classes[0]?.id ?? '';
    setSelectedClassId(firstClassId);

    if (firstClassId) {
      await loadStudentsForClass(firstClassId);
    } else {
      setStudents([]);
    }
  };

  const handleInviteStudents = async () => {
    if (!user?.id || !invitingEventId || selectedStudentIds.length === 0) {
      setError('Select at least one student to invite.');
      return;
    }

    try {
      setInviting(true);
      const response = await fetchFacultyEndpoint(
        `/faculty/${user.id}/events/${invitingEventId}/invite-students`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds: selectedStudentIds }),
        }
      );

      if (!response.ok) throw new Error('Failed to invite students');

      const updated = (await response.json()) as Event;
      setEvents((previous) => previous.map((event) => (event.id === updated.id ? { ...event, ...updated } : event)));
      setInvitingEventId(null);
      setSelectedStudentIds([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inviting students');
    } finally {
      setInviting(false);
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
                  <span className="text-xs text-gray-500">
                    Invited Students: {(event.invited_students ?? event.invitedStudents ?? []).length}
                  </span>
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
                  <button
                    onClick={() => openInviteModal(event.id)}
                    className="border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Invite Students
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {invitingEventId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Invite Students</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
              <select
                value={selectedClassId}
                onChange={async (e) => {
                  const classId = e.target.value;
                  setSelectedClassId(classId);
                  setSelectedStudentIds([]);
                  await loadStudentsForClass(classId);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {(cls.courseCode || 'N/A')} - {(cls.courseName || 'Untitled')} ({cls.section || 'Section N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto p-2">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No students found for this class.</p>
              ) : (
                students.map((student) => (
                  <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={(e) => {
                        setSelectedStudentIds((previous) =>
                          e.target.checked
                            ? [...previous, student.id]
                            : previous.filter((id) => id !== student.id)
                        );
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{student.name || student.id}</p>
                      <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">Selected: {selectedStudentIds.length}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setInvitingEventId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteStudents}
                  disabled={inviting}
                  className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
