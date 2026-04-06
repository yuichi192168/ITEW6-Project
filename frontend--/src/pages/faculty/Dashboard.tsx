import React, { useEffect, useMemo } from 'react';
import { Users, BarChart3, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { announcementsDB, coursesDB, eventsDB, researchDB } from '../../lib/database';
import { ErrorMessage, EmptyState } from '../../components/ui/shared';
import { mockClasses, mockResearch } from '../../lib/constants';

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  section?: string;
  students?: number;
  schedule?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  admin: string;
}

interface ResearchItem {
  id: string;
  title: string;
  author: string;
  year: number;
  status: string;
}

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: classes, error: classesError, execute: fetchClasses } = useAsync<Course[]>(() =>
    coursesDB.getAllCourses().then((data: any) => (data as Course[])).catch(() => mockClasses as Course[])
  );

  const { data: events, error: eventsError, execute: fetchEvents } = useAsync<Event[]>(() =>
    eventsDB.getAllEvents().then((data: any) => (data as Event[])).catch(() => [] as Event[])
  );

  const { data: announcements, error: announcementsError, execute: fetchAnnouncements } = useAsync<Announcement[]>(() =>
    announcementsDB.getAllAnnouncements().then((data: any) => data as Announcement[]).catch(() => [] as Announcement[])
  );

  const { data: research, error: researchError, execute: fetchResearch } = useAsync<ResearchItem[]>(() =>
    researchDB.getAllResearch().then((data: any) => data as ResearchItem[]).catch(() => (mockResearch as unknown as ResearchItem[]))
  );

  useEffect(() => {
    if (user?.id) {
      fetchClasses();
      fetchEvents();
      fetchAnnouncements();
      fetchResearch();
    }
  }, [user?.id, fetchClasses, fetchEvents, fetchAnnouncements, fetchResearch]);

  useEffect(() => {
    const refreshFacultyData = () => {
      fetchAnnouncements();
      fetchEvents();
      fetchResearch();
    };

    window.addEventListener('announcementsUpdated', refreshFacultyData);
    window.addEventListener('eventsUpdated', refreshFacultyData);
    window.addEventListener('researchUpdated', refreshFacultyData);

    return () => {
      window.removeEventListener('announcementsUpdated', refreshFacultyData);
      window.removeEventListener('eventsUpdated', refreshFacultyData);
      window.removeEventListener('researchUpdated', refreshFacultyData);
    };
  }, [fetchAnnouncements, fetchEvents, fetchResearch]);

  const totalStudents = classes?.reduce((sum, c) => sum + (c.students || 0), 0) || 0;
  const courseCount = classes?.length || 0;
  const courseMaterials = 12; // TODO: Fetch from materials collection
  const researchPapers = research?.length ?? (researchError ? mockResearch.length : 0);

  const stats = [
    { label: 'Classes Teaching', value: courseCount, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Students', value: totalStudents, icon: BarChart3, color: 'bg-green-500' },
    { label: 'Course Materials', value: courseMaterials, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Research Papers', value: researchPapers, icon: FileText, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome {user?.name}! Here's your teaching portal</p>
      </div>

      {(classesError || eventsError || announcementsError || researchError) && <ErrorMessage message="Some data failed to load. Using fallback data." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Classes</h2>
        {!classes || classes.length === 0 ? (
          <EmptyState
            icon="BookOpen"
            title="No classes assigned"
            description="You don't have any classes assigned yet"
          />
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <div key={cls.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">{cls.code} - {cls.name}</p>
                  <p className="text-sm text-gray-600">
                    {cls.section ? `Section ${cls.section}` : 'Section 1'} • {cls.students || 0} students
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {cls.schedule || cls.semester}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
