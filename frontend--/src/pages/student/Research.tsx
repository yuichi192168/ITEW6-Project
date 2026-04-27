import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { facultyDB, studentDB } from '../../lib/database';

interface StudentResearch {
  id: string;
  title: string;
  description: string;
  authors: string[] | string;
  year: number;
  status: string;
  adviser?: string;
  panelMembers?: string[];
  url?: string;
}

interface PeopleRecord {
  id: string | number;
  name: string;
  email?: string;
}

export const StudentResearch: React.FC = () => {
  const { user } = useAuth();
  const [research, setResearch] = useState<StudentResearch[]>([]);
  const [facultyPeople, setFacultyPeople] = useState<PeopleRecord[]>([]);
  const [studentPeople, setStudentPeople] = useState<PeopleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const [faculties, students] = await Promise.all([
          facultyDB.getAllFaculty().catch(() => []),
          studentDB.getAllStudents().catch(() => []),
        ]);

        setFacultyPeople((faculties || []) as PeopleRecord[]);
        setStudentPeople((students || []) as PeopleRecord[]);
      } catch {
        setFacultyPeople([]);
        setStudentPeople([]);
      }
    };

    void loadPeople();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchResearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await studentDB.getStudentResearch(user.id);
        setResearch(data as unknown as StudentResearch[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load research');
      } finally {
        setLoading(false);
      }
    };

    void fetchResearch();
  }, [user?.id]);

  const sortedResearch = useMemo(
    () => [...research].sort((a, b) => b.year - a.year),
    [research]
  );

  const peopleIndex = useMemo(() => {
    const map = new Map<string, string>();

    const register = (person: PeopleRecord) => {
      const name = String(person?.name ?? '').trim();
      if (!name) return;

      [person?.id, person?.email]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .forEach((key) => {
          map.set(key, name);
          map.set(key.toLowerCase(), name);
        });
    };

    facultyPeople.forEach(register);
    studentPeople.forEach(register);

    return map;
  }, [facultyPeople, studentPeople]);

  const resolveName = (value: string) => {
    const key = String(value ?? '').trim();
    if (!key) return '';
    return peopleIndex.get(key) || peopleIndex.get(key.toLowerCase()) || key;
  };

  const formatNames = (value: string[] | string | undefined) => {
    if (!value) return '';

    const items = Array.isArray(value) ? value : [value];
    return items
      .map((item) => resolveName(String(item)))
      .filter(Boolean)
      .join(', ');
  };

  if (loading) return <div className="text-center py-8">Loading research...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Research</h1>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>}

      {sortedResearch.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-700">No research entries</h3>
          <p className="text-gray-600">You haven't participated in any research projects yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedResearch.map((researchItem, index) => (
            <div
              key={researchItem.id || `${researchItem.title}-${researchItem.year}-${index}`}
              className="card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary mt-1 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{researchItem.title}</h3>
                      <p className="text-gray-600 text-sm mt-2">{researchItem.description}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Authors: {formatNames(researchItem.authors)}</p>
                        {researchItem.adviser && <p>Adviser: {resolveName(researchItem.adviser)}</p>}
                        <p>Year: {researchItem.year}</p>
                      </div>
                      {researchItem.url && (
                        <a href={researchItem.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm mt-2 inline-block">
                          View Publication →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${
                  researchItem.status === 'Published' ? 'bg-green-100 text-green-800' :
                  researchItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {researchItem.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
