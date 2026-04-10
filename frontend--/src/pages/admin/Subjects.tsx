import React, { useState, useEffect } from 'react';
import { BookOpen, Edit, Trash2 } from 'lucide-react';
import { Card, SectionHeader, LoadingSpinner, ErrorMessage, SuccessMessage } from '../../components/ui/shared';
import { emitSyncEvent, onSyncEvent } from '../../lib/syncEvents';

interface Subject {
  id: string | number;
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  yearLevel: string;
  type: 'Lecture' | 'Lab' | 'Both';
  lectureUnits: number;
  labUnits: number;
  facultyId?: string | number;
  created_at: string;
  updated_at: string;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  yearLevel: string;
  type: 'Lecture' | 'Lab' | 'Both';
  lectureUnits: number;
  labUnits: number;
}

export const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
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
    department: '',
    yearLevel: '1st',
    type: 'Both',
    lectureUnits: 2,
    labUnits: 3,
  });

  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    fetchSubjects();

    // Listen for sync events to refresh subjects when changes happen elsewhere
    const unsubscribe = onSyncEvent(({ detail }) => {
      if (detail.source !== 'Subjects' && (detail.type === 'subjectCreated' || detail.type === 'subjectUpdated' || detail.type === 'subjectDeleted')) {
        fetchSubjects();
      }
    });

    return unsubscribe;
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
        body: JSON.stringify({
          ...formData,
          autoAssignRegular: true,
        })
      });

      if (!response.ok) throw new Error('Failed to save subject');

      const savedSubject = await response.json();
      
      setSuccess(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
      setShowForm(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
      
      // Emit sync event for other pages to listen
      if (editingSubject) {
        emitSyncEvent('subjectUpdated', savedSubject, 'Subjects');
      } else {
        emitSyncEvent('subjectCreated', savedSubject, 'Subjects');
      }
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
      department: subject.department,
      yearLevel: subject.yearLevel || '1st',
      type: subject.type || 'Both',
      lectureUnits: subject.lectureUnits ?? 2,
      labUnits: subject.labUnits ?? 3,
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
      
      // Emit sync event for other pages to listen
      emitSyncEvent('subjectDeleted', { id: subjectId }, 'Subjects');
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
      department: '',
      yearLevel: '1st',
      type: 'Both',
      lectureUnits: 2,
      labUnits: 3,
    });
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesDepartment = departmentFilter === 'All' || subject.department === departmentFilter;
    const matchesYear = yearFilter === 'All' || subject.yearLevel === yearFilter;
    return matchesDepartment && matchesYear;
  });

  const departmentStats = filteredSubjects.reduce<Record<string, number>>((acc, subject) => {
    acc[subject.department] = (acc[subject.department] || 0) + 1;
    return acc;
  }, {});

  const yearStats = filteredSubjects.reduce<Record<string, number>>((acc, subject) => {
    acc[subject.yearLevel] = (acc[subject.yearLevel] || 0) + 1;
    return acc;
  }, {});

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
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
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
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                <select
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value as SubjectFormData['type'];
                    setFormData({
                      ...formData,
                      type,
                      lectureUnits: type === 'Lab' ? 0 : 2,
                      labUnits: type === 'Lecture' ? 0 : 3,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Lab</option>
                  <option value="Both">Both</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lecture Units</label>
                <input
                  type="number"
                  min="0"
                  value={formData.lectureUnits}
                  onChange={(e) => setFormData({ ...formData, lectureUnits: parseInt(e.target.value) || 0 })}
                  disabled={formData.type === 'Lab'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lab Units</label>
                <input
                  type="number"
                  min="0"
                  value={formData.labUnits}
                  onChange={(e) => setFormData({ ...formData, labUnits: parseInt(e.target.value) || 0 })}
                  disabled={formData.type === 'Lecture'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
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

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All</option>
              {[...new Set(subjects.map((subject) => subject.department))].map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Year Level:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(departmentStats).map(([department, count]) => (
            <div key={department} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{department}</p>
              <p className="text-xl font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400">subjects</p>
            </div>
          ))}
          {Object.entries(yearStats).map(([year, count]) => (
            <div key={year} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{year} Year</p>
              <p className="text-xl font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400">subjects</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecture Units</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Units</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.yearLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.lectureUnits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.labUnits}</td>
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

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No subjects found for the selected filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
