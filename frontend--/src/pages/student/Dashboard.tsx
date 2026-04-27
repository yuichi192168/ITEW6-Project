import React, { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, BookOpen, FileText, Bell, Clock, Link as LinkIcon, User, BookMarked, CalendarDays, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorMessage, EmptyState } from '../../components/ui/shared';
import { Link } from 'react-router-dom';
import { announcementsDB, schedulesDB, studentDB } from '../../lib/database';

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

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [gradesSummary, setGradesSummary] = useState<{ gwa: number; totalCourses: number; grades: any[] } | null>(null);
  const [scheduleData, setScheduleData] = useState<{ enrolledClasses: any[]; totalCourses: number } | null>(null);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setError(null);

      try {
        const [gradesJson, scheduleJson, eventsJson, researchJson, announcementsJson] = await Promise.all([
          studentDB.getStudentGrades(user.id),
          schedulesDB.getStudentSchedule(user.id),
          studentDB.getStudentEvents(user.id),
          studentDB.getStudentResearch(user.id),
          announcementsDB.getAllAnnouncements(),
        ]);

        setGradesSummary(gradesJson);
        setScheduleData(scheduleJson as { enrolledClasses: any[]; totalCourses: number });
        setEventsList(eventsJson as Event[]);
        setResearchList(researchJson as ResearchItem[]);
        setAnnouncements(announcementsJson as Announcement[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student data');
      }
    };

    void fetchData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshStudentData = async () => {
      try {
        const [eventsJson, researchJson, announcementsJson] = await Promise.all([
          studentDB.getStudentEvents(user.id),
          studentDB.getStudentResearch(user.id),
          announcementsDB.getAllAnnouncements(),
        ]);

        setEventsList(eventsJson as Event[]);
        setResearchList(researchJson as ResearchItem[]);
        setAnnouncements(announcementsJson as Announcement[]);
      } catch {
        // ignore refresh errors
      }
    };

    window.addEventListener('announcementsUpdated', refreshStudentData);
    window.addEventListener('eventsUpdated', refreshStudentData);
    window.addEventListener('researchUpdated', refreshStudentData);

    return () => {
      window.removeEventListener('announcementsUpdated', refreshStudentData);
      window.removeEventListener('eventsUpdated', refreshStudentData);
      window.removeEventListener('researchUpdated', refreshStudentData);
    };
  }, [user?.id]);

  const hasError = !!error;

  const gpa = useMemo(() => {
    if (!gradesSummary || gradesSummary.totalCourses === 0) return '0.00';
    return gradesSummary.gwa.toFixed(2);
  }, [gradesSummary]);

  const completedCourses = gradesSummary?.totalCourses ?? 0;
  const currentClasses = scheduleData?.totalCourses ?? 0;
  const researchPapers = researchList.length;

  const recentAnnouncements = announcements.slice(0, 3);
  const upcomingEvents = eventsList
    .filter((event) => new Date(event.date).getTime() > Date.now())
    .slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome {user?.name}! Here's your academic overview</p>
      </div>

      {hasError && <ErrorMessage message="Some data failed to load. Using cached data." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/dashboard/student/grades" className="card block hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">GPA</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{gpa}</p>
            </div>
            <Award className="text-purple-500" size={32} />
          </div>
        </Link>
        <Link to="/dashboard/student/grades" className="card block hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed Courses</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{completedCourses}</p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </Link>
        <Link to="/dashboard/student/schedule" className="card block hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Current Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{currentClasses}</p>
            </div>
            <Calendar className="text-green-500" size={32} />
          </div>
        </Link>
        <Link to="/dashboard/student/research" className="card block hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Research Papers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{researchPapers}</p>
            </div>
            <FileText className="text-orange-500" size={32} />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Bell className="mr-2" size={20} />
            School Announcements
          </h2>
          {recentAnnouncements.length === 0 ? (
            <EmptyState
              icon="Bell"
              title="No announcements"
              description="Check back later for announcements"
            />
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-gray-800">{announcement.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-2">Posted by {announcement.admin} on {announcement.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Upcoming Events
          </h2>
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon="Calendar"
              title="No upcoming events"
              description="No scheduled events at this time"
            />
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-l-4 border-primary pl-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-600">{event.date} - {event.type}</p>
                  <p className="text-xs text-gray-500">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Clock className="mr-2" size={20} />
          Upcoming Events
        </h2>
        {upcomingEvents.length === 0 ? (
          <EmptyState icon="Clock" title="No upcoming events" description="Your schedule is clear" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((activity: Event) => (
              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.type}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    activity.type === 'exam' ? 'bg-red-100 text-red-800' :
                    activity.type === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <LinkIcon className="mr-2" size={20} />
          Quick Links
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/dashboard/student/profile" className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
            <User className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="font-semibold text-blue-800">My Profile</p>
          </Link>
          <Link to="/dashboard/student/grades" className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
            <BookMarked className="mx-auto mb-2 text-green-600" size={24} />
            <p className="font-semibold text-green-800">My Grades</p>
          </Link>
          <Link to="/dashboard/student/schedule" className="p-3 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition-colors">
            <Calendar className="mx-auto mb-2 text-yellow-600" size={24} />
            <p className="font-semibold text-yellow-800">Schedule</p>
          </Link>
          <Link to="/dashboard/student/events" className="p-3 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
            <CalendarDays className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="font-semibold text-purple-800">Events</p>
          </Link>
          <Link to="/dashboard/student/research" className="p-3 bg-red-50 rounded-lg text-center hover:bg-red-100 transition-colors">
            <FileText className="mx-auto mb-2 text-red-600" size={24} />
            <p className="font-semibold text-red-800">Research</p>
          </Link>
          <Link to="/dashboard/student/lessons" className="p-3 bg-indigo-50 rounded-lg text-center hover:bg-indigo-100 transition-colors">
            <BookOpen className="mx-auto mb-2 text-indigo-600" size={24} />
            <p className="font-semibold text-indigo-800">Lessons</p>
          </Link>
          <Link to="/dashboard/student/guidance-counseling" className="p-3 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors">
            <ShieldAlert className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="font-semibold text-orange-800">Guidance</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
