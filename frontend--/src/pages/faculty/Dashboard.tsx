import React, { useEffect, useState } from 'react';
import { Users, BarChart3, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorMessage, EmptyState } from '../../components/ui/shared';

interface Dashboard {
  faculty: { id: string; name: string; email: string };
  subjects: Array<{ id: string; name: string; code: string; classes: number }>;
  totalClasses: number;
  totalStudents: number;
}

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  students: number;
  schedule: string;
}

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const data: Dashboard = await response.json();
        setDashboard(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading dashboard');
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchClasses = async () => {
      try {
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/classes`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data: Class[] = await response.json();
        setClasses(data);
      } catch (err) {
        console.error('Error loading classes:', err);
        setClasses([]);
      }
    };

    fetchDashboard();
    fetchClasses();
  }, [user?.id]);

  const totalStudents = dashboard?.totalStudents || 0;
  const courseCount = dashboard?.totalClasses || 0;
  const researchPapers = dashboard?.subjects.length || 0;

  const stats = [
    { label: 'Classes Teaching', value: courseCount, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Students', value: totalStudents, icon: BarChart3, color: 'bg-green-500' },
    { label: 'Subjects', value: dashboard?.subjects?.length || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Research', value: researchPapers, icon: FileText, color: 'bg-orange-500' },
  ];

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome {user?.name}! Here's your teaching portal</p>
      </div>

      {error && <ErrorMessage message={error} />}

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
                  <p className="font-semibold text-gray-800">{cls.courseCode} - {cls.courseName}</p>
                  <p className="text-sm text-gray-600">
                    Section {cls.section} • {cls.students || 0} students
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {cls.schedule}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

