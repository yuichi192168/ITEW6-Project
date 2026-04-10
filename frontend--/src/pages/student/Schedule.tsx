import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ScheduleClass {
  classId: string;
  courseCode: string;
  courseName: string;
  schedule: string;
  room: string;
  section?: string;
  units?: number;
}

interface StudentScheduleData {
  studentId: string;
  enrolledClasses: ScheduleClass[];
  totalCourses: number;
}

export const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8080/student/${user.id}/schedule`);
        if (!response.ok) {
          throw new Error('Failed to load schedule');
        }

        const data: StudentScheduleData = await response.json();
        setSchedule(data.enrolledClasses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user?.id]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) return <div className="text-center py-8">Loading schedule...</div>;
  if (error) return <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Schedule</h1>

      {schedule.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No classes enrolled yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {days.map((day) => {
            const dayClasses = schedule.filter(s => {
              const dayLower = day.toLowerCase();
              const scheduleStr = (s.schedule || '').toLowerCase();
              return scheduleStr.includes(dayLower);
            });

            return (
              <div key={day} className="card">
                <h3 className="font-bold text-gray-800 mb-4 text-center">{day}</h3>
                {dayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {dayClasses.map((s) => (
                      <div key={s.classId} className="bg-gradient-to-r from-primary to-primary-dark text-white p-3 rounded-lg">
                        <p className="font-semibold text-sm">{s.courseCode} - {s.courseName}</p>
                        <p className="text-xs opacity-90">{s.schedule}</p>
                        <p className="text-xs opacity-90">Room: {s.room}</p>
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
      )}

      {schedule.length > 0 && (
        <div className="mt-8 card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Enrolled Courses</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Code</th>
                  <th className="text-left py-2 px-4">Course Name</th>
                  <th className="text-left py-2 px-4">Schedule</th>
                  <th className="text-left py-2 px-4">Room</th>
                  <th className="text-left py-2 px-4">Units</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s) => (
                  <tr key={s.classId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{s.courseCode}</td>
                    <td className="py-2 px-4">{s.courseName}</td>
                    <td className="py-2 px-4">{s.schedule}</td>
                    <td className="py-2 px-4">{s.room}</td>
                    <td className="py-2 px-4">{s.units || 3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
