import React, { useEffect, useState } from 'react';
import { Briefcase, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ClassLoad {
  id: string;
  code: string;
  name: string;
  section: string;
  type: string;
  units: number;
  lectureHours: number;
  labHours: number;
  totalHours: number;
  students: number;
}

interface TeachingLoad {
  facultyId: string;
  classes: ClassLoad[];
  totalClasses: number;
  totalStudents: number;
  totalLectureHours: number;
  totalLabHours: number;
  totalTeachingHours: number;
}

export const FacultyTeachingLoad: React.FC = () => {
  const { user } = useAuth();
  const [teachingLoad, setTeachingLoad] = useState<TeachingLoad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchTeachingLoad = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/teaching-load`);
        if (!response.ok) throw new Error('Failed to fetch teaching load');
        const data: TeachingLoad = await response.json();
        setTeachingLoad(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading teaching load');
        setTeachingLoad(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachingLoad();
  }, [user?.id]);

  if (loading) {
    return <div className="text-center py-10">Loading teaching load...</div>;
  }

  if (error || !teachingLoad) {
    return <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error || 'Error loading data'}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Teaching Load</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{teachingLoad.totalClasses}</p>
            </div>
            <Briefcase className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{teachingLoad.totalStudents}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Teaching Hours/Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{teachingLoad.totalTeachingHours}</p>
            </div>
            <Clock className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Class Load Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Course Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Course Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Section</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Lecture Hrs</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Lab Hrs</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Hrs</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Students</th>
              </tr>
            </thead>
            <tbody>
              {teachingLoad.classes.map((cls) => (
                <tr key={cls.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-800">{cls.code}</td>
                  <td className="py-3 px-4 text-gray-600">{cls.name}</td>
                  <td className="py-3 px-4 text-gray-600">{cls.section}</td>
                  <td className="py-3 px-4">
                    <span className="bg-primary-light text-primary text-xs px-2 py-1 rounded">
                      {cls.type === 'lecture-only' && 'Lecture'}
                      {cls.type === 'lecture-lab' && 'Lec + Lab'}
                      {cls.type === 'lab-only' && 'Lab'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{cls.lectureHours}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{cls.labHours}</td>
                  <td className="py-3 px-4 text-center font-semibold text-primary">{cls.totalHours}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{cls.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Lecture Hours</p>
              <p className="text-2xl font-bold text-gray-800">{teachingLoad.totalLectureHours}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lab Hours</p>
              <p className="text-2xl font-bold text-gray-800">{teachingLoad.totalLabHours}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-primary">{teachingLoad.totalTeachingHours}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
