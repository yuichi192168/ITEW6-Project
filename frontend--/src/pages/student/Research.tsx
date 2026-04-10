import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

export const StudentResearch: React.FC = () => {
  const { user } = useAuth();
  const [research, setResearch] = useState<StudentResearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchResearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8080/student/${user.id}/research`);
        if (!response.ok) {
          throw new Error('Failed to load research');
        }

        const data = await response.json();
        setResearch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load research');
      } finally {
        setLoading(false);
      }
    };

    fetchResearch();
  }, [user?.id]);

  const sortedResearch = useMemo(
    () => [...research].sort((a, b) => b.year - a.year),
    [research]
  );

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
          {sortedResearch.map((researchItem) => (
            <div key={researchItem.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary mt-1 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{researchItem.title}</h3>
                      <p className="text-gray-600 text-sm mt-2">{researchItem.description}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Authors: {Array.isArray(researchItem.authors) ? researchItem.authors.join(', ') : researchItem.authors}</p>
                        {researchItem.adviser && <p>Adviser: {researchItem.adviser}</p>}
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
