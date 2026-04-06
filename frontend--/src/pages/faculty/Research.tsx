import React, { useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { researchDB } from '../../lib/database';
import { EmptyState } from '../../components/ui/shared';
import { mockResearch } from '../../lib/constants';

interface ResearchItem {
  id: string;
  title: string;
  author: string;
  year: number;
  status: 'Published' | 'In Progress' | 'Draft' | string;
}

export const FacultyResearch: React.FC = () => {
  const { data: research, error, execute: fetchResearch } = useAsync<ResearchItem[]>(() =>
    researchDB.getAllResearch().then((data: any) => data as ResearchItem[]).catch(() => (mockResearch as unknown as ResearchItem[]))
  );

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  useEffect(() => {
    const refreshResearch = () => fetchResearch();
    window.addEventListener('researchUpdated', refreshResearch);
    return () => window.removeEventListener('researchUpdated', refreshResearch);
  }, [fetchResearch]);

  const visibleResearch = useMemo(() => {
    if (research && research.length > 0) return research;
    if (error) return mockResearch as unknown as ResearchItem[];
    return [] as ResearchItem[];
  }, [research, error]);

  const sortedResearch = useMemo(
    () => [...visibleResearch].sort((a, b) => b.year - a.year),
    [visibleResearch]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Research</h1>

      {sortedResearch.length === 0 ? (
        <EmptyState
          icon="FileText"
          title="No research entries yet"
          description="Published or in-progress research from the admin dashboard will appear here."
        />
      ) : (
        <div className="space-y-4">
          {sortedResearch.map((researchItem) => (
            <div key={researchItem.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <FileText className="text-primary mt-1 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{researchItem.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">Author: {researchItem.author}</p>
                      <p className="text-gray-600 text-sm">Year: {researchItem.year}</p>
                    </div>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${researchItem.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
