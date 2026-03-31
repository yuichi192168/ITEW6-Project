import React, { useEffect, useMemo } from 'react';
import { Award, Calendar, BookOpen, FileText, Bell, Clock, Link as LinkIcon, User, BookMarked, CalendarDays, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { gradesDB, coursesDB, eventsDB } from '../../lib/database';
import { ErrorMessage, EmptyState } from '../../components/ui/shared';
import { mockAnnouncements, mockEvents, mockActivities } from '../../lib/constants';
import { Link } from 'react-router-dom';

interface Grade {
  id: string;
  course: string;
  grade: string;
  score: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: grades, error: gradesError, execute: fetchGrades } = useAsync<Grade[]>(() =>
    gradesDB.getAllGrades().then((data: any) => (data as Grade[])).catch(() => [] as Grade[])
  );

  const { data: courses, error: coursesError, execute: fetchCourses } = useAsync<Course[]>(() =>
    coursesDB.getAllCourses().then((data: any) => (data as Course[])).catch(() => [] as Course[])
  );

  const { data: events, error: eventsError, execute: fetchEvents } = useAsync<Event[]>(() =>
    eventsDB.getAllEvents().then((data: any) => (data as Event[])).catch(() => (mockEvents as unknown as Event[]))
  );

  useEffect(() => {
    if (user?.id) {
      fetchGrades();
      fetchCourses();
      fetchEvents();
    }
  }, [user?.id, fetchGrades, fetchCourses, fetchEvents]);

  const hasError = gradesError || coursesError || eventsError;

  const gpa = useMemo(() => {
    if (!grades || grades.length === 0) return 3.85;
    const avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
    return Math.min(4.0, (avgScore / 100) * 4.0).toFixed(2);
  }, [grades]);

  const completedCourses = grades?.length || 0;
  const currentClasses = courses?.length || 5;
  const researchPapers = 3; // TODO: Fetch from research collection

  const recentAnnouncements = mockAnnouncements.slice(0, 3);
  const upcomingEvents = (events || mockEvents)
    .filter(event => new Date(event.date) > new Date())
    .slice(0, 3);
  const upcomingActivities = mockActivities.filter(activity => new Date(activity.date) > new Date()).slice(0, 4);

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
          Upcoming Activities
        </h2>
        {upcomingActivities.length === 0 ? (
          <EmptyState
            icon="Clock"
            title="No upcoming activities"
            description="Your schedule is clear"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.course}</p>
                    <p className="text-xs text-gray-500">{activity.date} at {activity.time}</p>
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
