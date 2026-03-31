import React, { useState, useEffect } from 'react';
import { BookOpen, Edit, Trash2 } from 'lucide-react';
import { Card, SectionHeader, LoadingSpinner, ErrorMessage, SuccessMessage } from '../../components/ui/shared';

interface Subject {
  id: string | number;
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  created_at: string;
  updated_at: string;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
}

export const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    description: '',
    credits: 3,
    department: ''
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/subjects`);
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSubject
        ? `${API_BASE}/admin/subjects/${editingSubject.id}`
        : `${API_BASE}/admin/subjects`;

      const method = editingSubject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save subject');

      setSuccess(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
      setShowForm(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      credits: subject.credits,
      department: subject.department
    });
    setShowForm(true);
  };

  const handleDelete = async (subjectId: string | number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete subject');

      setSuccess('Subject deleted successfully');
      fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      department: ''
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <SectionHeader
        title="Subjects & Curriculum"
        subtitle="Manage subjects and curriculum offerings"
        action={{
          label: 'Add Subject',
          onClick: () => {
            setEditingSubject(null);
            resetForm();
            setShowForm(true);
          }
        }}
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {showForm && (
        <Card title={editingSubject ? 'Edit Subject' : 'Add New Subject'} className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSubject(null);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.credits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit subject"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subjects.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No subjects found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
