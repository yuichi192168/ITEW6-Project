import React, { useEffect, useState } from 'react';
import { Users, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  students: number;
  schedule: string;
import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { schedulesDB, subjectsDB } from '../../lib/database';
import { onSyncEvent } from '../../lib/syncEvents';
import { Users, Clock, BookOpen } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorMessage } from '../../components/ui/shared';

interface Schedule {
  id: string;
  subject_id?: string;
  subjectId?: string;
  course_id?: string;
  courseId?: string;
  subject_code?: string;
  subject_name?: string;
  courseCode?: string;
  subjectName?: string;
  faculty_id?: string;
  facultyId?: string;
  day?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  room?: string;
  section?: string;
  students?: number;
  name?: string;
  code?: string;
}

interface Subject {
  id: string;
  name?: string;
  code?: string;
}

export const FacultyClasses: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/classes`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data: Class[] = await response.json();
        setClasses(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading classes');
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user?.id]);

  if (loading) {
    return <div className="text-center py-10">Loading classes...</div>;

  const {
    data: schedules,
    loading: schedulesLoading,
    error: schedulesError,
    execute: fetchSchedules,
  } = useAsync<Schedule[]>(() => schedulesDB.getAllSchedules().then((data: any) => data as Schedule[]));

  const {
    data: subjects,
    execute: fetchSubjects,
  } = useAsync<Subject[]>(() => subjectsDB.getAllSubjects().then((data: any) => data as Subject[]));

  const filteredSchedules = useMemo(() => {
    if (!schedules || !user) return [];
    return schedules.filter(
      (schedule) => String(schedule.faculty_id || schedule.facultyId || '') === user.id
    );
  }, [schedules, user]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects?.forEach((subject) => {
      if (subject.id) map.set(String(subject.id), subject);
      if (subject.code) map.set(String(subject.code).toUpperCase(), subject);
    });
    return map;
  }, [subjects]);

  React.useEffect(() => {
    fetchSchedules();
    fetchSubjects();
  }, [fetchSchedules, fetchSubjects]);

  React.useEffect(() => {
    const unsubscribe = onSyncEvent(({ detail }) => {
      if (
        detail.type === 'scheduleCreated' ||
        detail.type === 'scheduleUpdated' ||
        detail.type === 'scheduleDeleted' ||
        detail.type === 'subjectCreated' ||
        detail.type === 'subjectUpdated' ||
        detail.type === 'subjectDeleted'
      ) {
        fetchSchedules();
        fetchSubjects();
      }
    });
    return unsubscribe;
  }, [fetchSchedules, fetchSubjects]);

  const getScheduleTime = (schedule: Schedule) => {
    const start = schedule.start_time || schedule.startTime;
    const end = schedule.end_time || schedule.endTime;
    return start && end ? `${start} - ${end}` : 'Time not set';
  };

  if (schedulesLoading) return <LoadingSpinner />;
  if (schedulesError) return <ErrorMessage message={schedulesError} />;

  if (!user) {
    return <EmptyState title="Not signed in" description="Please sign in to view your classes." />;
  }

  if (filteredSchedules.length === 0) {
    return (
      <EmptyState
        title="No assigned classes"
        description="You currently have no class assignments. Check back after the schedule is updated."
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Classes</h1>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      {classes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No classes assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-lg transition">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{cls.courseCode}</h3>
                    <p className="text-sm text-gray-600">{cls.courseName}</p>
                  </div>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">Section {cls.section}</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule) => {
          const rawSubjectKey = String(
            schedule.subject_id ||
            schedule.subjectId ||
            schedule.course_id ||
            schedule.courseId ||
            schedule.subject_code ||
            schedule.code ||
            schedule.courseCode ||
            ''
          ).trim();
          const subject =
            subjectMap.get(rawSubjectKey) ||
            subjectMap.get(rawSubjectKey.toUpperCase()) ||
            subjectMap.get(String(schedule.subject_code || '').toUpperCase()) ||
            subjectMap.get(String(schedule.courseCode || '').toUpperCase());

          const subjectCode =
            subject?.code ||
            schedule.code ||
            schedule.subject_code ||
            schedule.courseCode ||
            rawSubjectKey ||
            'Assigned Class';
          const subjectName =
            subject?.name ||
            schedule.name ||
            schedule.subject_name ||
            schedule.subjectName ||
            'No subject details available';

          return (
            <div key={schedule.id} className="card hover:shadow-lg transition">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{subjectCode}</h3>
                    <p className="text-sm text-gray-600">{subjectName}</p>
                  </div>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                    {schedule.section ? `Section ${schedule.section}` : 'No Section'}
                  </span>
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
                  <span className="text-sm">{schedule.students ?? 0} Students</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={18} />
                  <span className="text-sm">{schedule.day || 'Day TBD'} · {getScheduleTime(schedule)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <BookOpen size={18} />
                  <span className="text-sm">Room {schedule.room || 'TBD'}</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition">
                Manage Class
              </button>
            </div>
          ))}
        </div>
      )}
          );
        })}
      </div>
    </div>
  );
};
