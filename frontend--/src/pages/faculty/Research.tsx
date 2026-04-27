import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface ResearchItem {
  id: string;
  title: string;
  description: string;
  authors: string[];
  year: number;
  status: string;
  url?: string;
  adviser?: string;
  panelMembers?: string[];
  panel_members?: string[];
  category?: string;
  role?: string;
  studentCount?: number;
  students?: Array<{ id: string; name?: string; email?: string }>;
}

export const FacultyResearch: React.FC = () => {
  const { user } = useAuth();
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchFacultyEndpoint = async (path: string, init?: RequestInit) => {
    const directResponse = await fetch(`${API_BASE}${path}`, init);
    if (directResponse.status !== 404) {
      return directResponse;
    }

    return fetch(`${API_BASE}/api${path}`, init);
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchResearch = async () => {
      try {
        setLoading(true);
        const response = await fetchFacultyEndpoint(`/faculty/${user.id}/research`);
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

  const normalizeStatus = (status: string) => {
    const normalized = String(status || 'draft').toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'published') return 'published';
    if (normalized === 'in-progress') return 'in-progress';
    return 'draft';
  };

  const handleViewDetails = async (researchId: string) => {
    if (!user?.id) return;

    try {
      setLoadingDetails(true);
      const response = await fetchFacultyEndpoint(`/faculty/${user.id}/research/${researchId}`);
      if (!response.ok) throw new Error('Failed to fetch research details');
      const data = (await response.json()) as ResearchItem;
      setSelectedResearch(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading research details');
    } finally {
      setLoadingDetails(false);
    }
  };

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
                      <p className="text-gray-600 text-sm mt-2">Authors: {(researchItem.authors || []).join(', ') || 'N/A'}</p>
                      <p className="text-gray-600 text-sm">Year: {researchItem.year}</p>
                      <p className="text-gray-600 text-sm">
                        Category: {researchItem.category || (researchItem.role === 'panel_member' ? 'Panel' : 'Adviser')}
                      </p>
                      <p className="text-gray-600 text-sm">Students: {researchItem.studentCount ?? researchItem.students?.length ?? 0}</p>
                      {researchItem.adviser && (
                        <p className="text-gray-600 text-sm">Adviser: {researchItem.adviser}</p>
                      )}
                      {(researchItem.panelMembers || researchItem.panel_members) && (researchItem.panelMembers || researchItem.panel_members || []).length > 0 && (
                        <p className="text-gray-600 text-sm">Panel: {(researchItem.panelMembers || researchItem.panel_members || []).join(', ')}</p>
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
                      <button
                        onClick={() => handleViewDetails(researchItem.id)}
                        className="inline-flex items-center gap-1 text-sm mt-3 px-3 py-1 rounded border border-primary text-primary hover:bg-primary hover:text-white"
                      >
                        {loadingDetails && selectedResearch?.id === researchItem.id ? 'Loading...' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${
                    normalizeStatus(researchItem.status) === 'published'
                      ? 'bg-green-100 text-green-800'
                      : normalizeStatus(researchItem.status) === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {String(researchItem.status || 'Draft')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedResearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedResearch.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedResearch.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p><strong>Year:</strong> {selectedResearch.year}</p>
                <p><strong>Status:</strong> {selectedResearch.status}</p>
                <p><strong>Category:</strong> {selectedResearch.category || (selectedResearch.role === 'panel_member' ? 'Panel' : 'Adviser')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p><strong>Adviser:</strong> {selectedResearch.adviser || 'N/A'}</p>
                <p><strong>Panel:</strong> {(selectedResearch.panelMembers || selectedResearch.panel_members || []).join(', ') || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Students</h3>
              {selectedResearch.students && selectedResearch.students.length > 0 ? (
                <div className="space-y-2">
                  {selectedResearch.students.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded p-2 text-sm">
                      <p className="font-medium text-gray-800">{student.name || student.id}</p>
                      <p className="text-gray-500">{student.email || 'No email available'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No student details available.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedResearch(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
