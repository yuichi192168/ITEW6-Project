import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Syllabus {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  content: string;
  fileUrl: string;
  status: 'draft' | 'published';
  updatedAt: string;
}

export const FacultySyllabus: React.FC = () => {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSyllabi = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/faculty/${user.id}/syllabi`);
        if (!response.ok) throw new Error('Failed to fetch syllabi');
        const data: Syllabus[] = await response.json();
        setSyllabi(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading syllabi');
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabi();
  }, [user?.id]);

  const handleUpload = async () => {
    if (!user?.id || !courseId || !title || !file) {
      setError('Please fill all fields and select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(`http://localhost:8080/faculty/${user.id}/syllabi`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const newSyllabus: Syllabus = await response.json();
      setSyllabi([...syllabi, newSyllabus]);
      setShowModal(false);
      setCourseId('');
      setTitle('');
      setFile(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading syllabus');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (syllabusId: string) => {
    if (!user?.id || !window.confirm('Are you sure?')) return;

    try {
      const response = await fetch(`http://localhost:8080/faculty/${user.id}/syllabi/${syllabusId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');
      setSyllabi(syllabi.filter((s) => s.id !== syllabusId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting syllabus');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading syllabi...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Syllabus & Lessons</h1>
          <p className="text-gray-600 mt-2">Manage course syllabi and lesson materials</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Syllabus</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Syllabus</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course ID"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {syllabi.length === 0 ? (
        <div className="text-center py-10 text-gray-600">No syllabi found. Create one to get started.</div>
      ) : (
        <div className="space-y-4">
          {syllabi.map((syllabus) => (
            <div key={syllabus.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-primary text-white p-3 rounded-lg">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{syllabus.courseCode}</h3>
                    <p className="text-gray-600 text-sm">{syllabus.title}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Last updated: {new Date(syllabus.updatedAt).toLocaleDateString()}
                    </p>
                    {syllabus.fileUrl && (
                      <a
                        href={syllabus.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary text-sm mt-2"
                      >
                        <FileText size={16} />
                        View File
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      syllabus.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {syllabus.status.charAt(0).toUpperCase() + syllabus.status.slice(1)}
                  </span>
                  <button
                    onClick={() => handleDelete(syllabus.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
