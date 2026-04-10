import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ResearchItem {
  id: string;
  title: string;
  description: string;
  authors: string[];
  year: number;
  status: 'published' | 'in-progress' | 'draft';
  url: string;
  adviser: string;
  panelMembers: string[];
}

export const FacultyResearch: React.FC = () => {
  const { user } = useAuth();
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchResearch = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/research`);
        if (!response.ok) throw new Error('Failed to fetch research');
        const data: ResearchItem[] = await response.json();
        const sorted = data.sort((a, b) => b.year - a.year);
        setResearch(sorted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading research');
      } finally {
        setLoading(false);
      }
    };

    fetchResearch();
  }, [user?.id]);

  if (loading) {
    return <div className="text-center py-10">Loading research...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Research</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
      )}

      {research.length === 0 ? (
        <div className="card text-center py-10">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No research entries yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {research.map((researchItem) => (
            <div key={researchItem.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary mt-1 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{researchItem.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{researchItem.description}</p>
                      <p className="text-gray-600 text-sm mt-2">Authors: {researchItem.authors.join(', ')}</p>
                      <p className="text-gray-600 text-sm">Year: {researchItem.year}</p>
                      {researchItem.adviser && (
                        <p className="text-gray-600 text-sm">Adviser: {researchItem.adviser}</p>
                      )}
                      {researchItem.panelMembers && researchItem.panelMembers.length > 0 && (
                        <p className="text-gray-600 text-sm">Panel: {researchItem.panelMembers.join(', ')}</p>
                      )}
                      {researchItem.url && (
                        <a
                          href={researchItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-sm mt-3"
                        >
                          <ExternalLink size={16} />
                          View Publication
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${
                    researchItem.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : researchItem.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {researchItem.status.charAt(0).toUpperCase() + researchItem.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
