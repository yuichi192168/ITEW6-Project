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
                </div>
              </div>

              <button className="w-full mt-4 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition">
                Manage Class
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
