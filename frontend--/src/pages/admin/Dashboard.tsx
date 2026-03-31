import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Users2, BookOpen, BarChart3, RefreshCw, ArrowRight, Plus, Calendar, FileText } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { studentDB, facultyDB, coursesDB, eventsDB, announcementsDB } from '../../lib/database';
import { ErrorMessage, EmptyState } from '../../components/ui/shared';

interface Student {
  id: string;
  name: string;
  idNumber: string;
  year: string;
  email: string;
  program?: string;
}

interface Faculty {
  id: string;
  name: string;
  department: string;
  specialization: string;
  email: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: students, error: studentsError, execute: fetchStudents } = useAsync<Student[]>(() =>
    studentDB.getAllStudents().then((data: any) => data as Student[])
  );

  const { data: faculty, error: facultyError, execute: fetchFaculty } = useAsync<Faculty[]>(() =>
    facultyDB.getAllFaculty().then((data: any) => data as Faculty[])
  );

  const { data: courses, error: coursesError, execute: fetchCourses } = useAsync<Course[]>(() =>
    coursesDB.getAllCourses().then((data: any) => (data as unknown as Course[]))
  );

  const { data: events, error: eventsError, execute: fetchEvents } = useAsync<any[]>(() =>
    eventsDB.getAllEvents().then((data: any) => data)
  );

  const { data: announcements, error: announcementsError, execute: fetchAnnouncements } = useAsync<any[]>(() =>
    announcementsDB.getAllAnnouncements().then((data: any) => data)
  );

  // Initial Fetch on Mount
  useEffect(() => {
    fetchStudents();
    fetchFaculty();
    fetchCourses();
    fetchEvents();
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const refreshAll = () => {
    fetchStudents();
    fetchFaculty();
    fetchCourses();
    fetchEvents();
    fetchAnnouncements();
  };

  // Event Listeners for real-time updates
  useEffect(() => {
    const onUpdated = () => refreshAll();

    window.addEventListener('studentsUpdated', onUpdated);
    window.addEventListener('facultyUpdated', onUpdated);
    window.addEventListener('coursesUpdated', onUpdated);
    window.addEventListener('eventsUpdated', onUpdated);
    window.addEventListener('announcementsUpdated', onUpdated);
    window.addEventListener('researchUpdated', onUpdated);

    return () => {
      window.removeEventListener('studentsUpdated', onUpdated);
      window.removeEventListener('facultyUpdated', onUpdated);
      window.removeEventListener('coursesUpdated', onUpdated);
      window.removeEventListener('eventsUpdated', onUpdated);
      window.removeEventListener('announcementsUpdated', onUpdated);
      window.removeEventListener('researchUpdated', onUpdated);
    };
  }, []);

  // Log specific errors to console for easier debugging
  useEffect(() => {
    if (studentsError) console.error("Firebase Students Error:", studentsError);
    if (facultyError) console.error("Firebase Faculty Error:", facultyError);
    if (coursesError) console.error("Firebase Courses Error:", coursesError);
    if (eventsError) console.error("Firebase Events Error:", eventsError);
    if (announcementsError) console.error("Firebase Announcements Error:", announcementsError);
  }, [studentsError, facultyError, coursesError, eventsError, announcementsError]);

  const hasError = !!(studentsError || facultyError || coursesError || eventsError || announcementsError);

  // Calculate comprehensive statistics
  const departmentStats = useMemo(() => {
    const deptMap = new Map<string, { students: number; faculty: number }>();

    students?.forEach(student => {
      const dept = student.program || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { students: 0, faculty: 0 });
      }
      deptMap.get(dept)!.students++;
    });

    faculty?.forEach(fac => {
      const dept = fac.department || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { students: 0, faculty: 0 });
      }
      deptMap.get(dept)!.faculty++;
    });

    return Array.from(deptMap.entries()).map(([dept, counts]) => ({
      department: dept,
      students: counts.students,
      faculty: counts.faculty,
    }));
  }, [students, faculty]);

  const stats = [
    { label: 'Total Students', value: students?.length || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Faculty', value: faculty?.length || 0, icon: Users2, color: 'bg-green-500' },
    { label: 'Active Classes', value: courses?.length || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Total Programs', value: departmentStats.length || 0, icon: BarChart3, color: 'bg-orange-500' },
    { label: 'Events', value: events?.length || 0, icon: Calendar, color: 'bg-red-500' },
    { label: 'Announcements', value: announcements?.length || 0, icon: FileText, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the administration panel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {hasError && <ErrorMessage message="Failed to load dashboard data. Check console for details." />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Students by Program</h2>
          {departmentStats.length === 0 ? (
            <EmptyState
              icon="GraduationCap"
              title="No student data"
              description="Student records will appear here once added"
            />
          ) : (
            <div className="space-y-3">
              {departmentStats.map((dept) => (
                <div key={dept.department} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{dept.department}</p>
                    <p className="text-xs text-gray-600">{dept.students} students</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                      {dept.students}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Faculty by Department</h2>
          {departmentStats.length === 0 ? (
            <EmptyState
              icon="Users2"
              title="No faculty data"
              description="Faculty records will appear here once added"
            />
          ) : (
            <div className="space-y-3">
              {departmentStats.map((dept) => (
                <div key={dept.department} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{dept.department}</p>
                    <p className="text-xs text-gray-600">{dept.faculty} faculty members</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                      {dept.faculty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => navigate('/dashboard/admin/students')}
              className="w-full inline-flex items-center justify-between bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition shadow-md shadow-blue-100"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} /> Add Student
              </div>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/faculty')}
              className="w-full inline-flex items-center justify-between bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition shadow-md shadow-green-100"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} /> Add Faculty
              </div>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/events')}
              className="w-full inline-flex items-center justify-between bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition shadow-md shadow-purple-100"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} /> Add Event
              </div>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/research')}
              className="w-full inline-flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition shadow-md shadow-orange-100"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} /> Add Research
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {!students || students.length === 0 ? (
              <div className="text-center py-6">
                <Users className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 text-sm">No students registered yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Latest Students:</p>
                {students.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{student.name}</p>
                      <p className="text-xs text-gray-600">{student.program}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {student.year}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {faculty && faculty.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4 mt-4">
                <p className="text-sm text-gray-600 font-medium">Latest Faculty:</p>
                {faculty.slice(0, 2).map((fac) => (
                  <div key={fac.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{fac.name}</p>
                      <p className="text-xs text-gray-600">{fac.department}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {fac.specialization}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};