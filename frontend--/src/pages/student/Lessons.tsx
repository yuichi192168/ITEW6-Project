import React, { useEffect, useState } from 'react';
import { BookOpen, Download, File } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CourseMaterial {
  id: string;
  title: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface LessonCourse {
  classId: string;
  courseCode: string;
  courseName: string;
  materials: CourseMaterial[];
}

export const StudentLessons: React.FC = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLessons = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8080/student/${user.id}/schedule`);
        if (!response.ok) {
          throw new Error('Failed to load schedule');
        }

        const data = await response.json();
        
        // Filter only classes with materials
        const lessonsWithMaterials = data.enrolledClasses
          .filter((cls: any) => cls.materials && cls.materials.length > 0)
          .map((cls: any) => ({
            classId: cls.classId,
            courseCode: cls.courseCode,
            courseName: cls.courseName,
            materials: cls.materials || []
          }));

        setLessons(lessonsWithMaterials);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id]);

  if (loading) return <div className="text-center py-8">Loading lessons...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Lessons & Materials</h1>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      {lessons.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-700">No materials available yet</h3>
          <p className="text-gray-600">Faculty will upload course materials as they become available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div key={lesson.classId} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-primary text-white p-3 rounded-lg flex-shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{lesson.courseName}</h3>
                    <p className="text-gray-600 text-sm">{lesson.courseCode}</p>
                    <div className="mt-3 space-y-2">
                      {lesson.materials.map((material) => (
                        <div key={material.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="flex items-center gap-2">
                            <File size={16} className="text-gray-600" />
                            <span className="text-sm text-gray-700">{material.title}</span>
                            <span className="text-xs text-gray-500">({material.type})</span>
                          </div>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary-dark"
                            title="Download material"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
