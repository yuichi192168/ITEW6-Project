import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Edit2, Trash2, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { researchDB, facultyDB, studentDB } from '../../lib/database';
import { EmptyState, FormInput, SectionHeader, Card, LoadingSpinner, ErrorMessage } from '../../components/ui/shared';

interface ResearchItem {
  id: string;
  title: string;
  author?: string;
  authors?: string[];
  students?: string[];
  year: number;
  status: 'Draft' | 'In Progress' | 'Approved' | 'Published' | string;
  description?: string;
  assignedPanel?: string[];
  advisers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Faculty {
  id: string | number;
  name: string;
  email?: string;
  department?: string;
}

interface Student {
  id: string | number;
  name: string;
  email?: string;
  idNumber?: string;
}


export const AdminResearch: React.FC = () => {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [form, setForm] = useState<ResearchItem>({
    id: '',
    title: '',
    authors: [],
    students: [],
    year: new Date().getFullYear(),
    status: 'Draft',
    description: '',
    assignedPanel: [],
    advisers: [],
  });

  const { data: researchData, loading, error, execute: fetchResearch } = useAsync<ResearchItem[]>(() =>
    researchDB.getAllResearch().then((data: any) => data as ResearchItem[])
  );

  const { data: faculties, execute: fetchFaculties } = useAsync<Faculty[]>(() =>
    facultyDB.getAllFaculty().then((data: any) => data as Faculty[])
  );

  const { data: students, execute: fetchStudents } = useAsync<Student[]>(() =>
    studentDB.getAllStudents().then((data: any) => data as Student[])
  );

  const facultyOptions = useMemo(
    () => (faculties || []).map((f) => ({ id: String(f.id), name: f.name })),
    [faculties]
  );

  const studentOptions = useMemo(
    () => (students || []).map((s) => ({ id: String(s.id), name: s.name })),
    [students]
  );

  useEffect(() => {
    fetchResearch();
    fetchFaculties();
    fetchStudents();
  }, [fetchResearch, fetchFaculties, fetchStudents]);

  useEffect(() => {
    if (researchData?.length) {
      setResearch(researchData);
    }
  }, [researchData]);

  const filteredResearch = useMemo(() => {
    let filtered = research;
    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [research, statusFilter, searchQuery]);

  const handleAddOrUpdate = async () => {
    if (!form.title) {
      alert('Title is required');
      return;
    }

    try {
      if (editingId) {
        await researchDB.updateResearch(editingId, form);
        setResearch((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, ...form } : r))
        );
        alert('Research updated successfully');
      } else {
        const id = await researchDB.addResearch(form);
        setResearch((prev) => [...prev, { ...form, id }]);
        alert('Research entry added successfully');
      }
      window.dispatchEvent(new Event('researchUpdated'));
      resetForm();
    } catch (err) {
      console.error('save research error', err);
      alert('Failed to save research entry');
    }
  };

  const handleEdit = (item: ResearchItem) => {
    setForm(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this research entry?')) return;

    try {
      await researchDB.deleteResearch(id);
      setResearch((prev) => prev.filter((r) => r.id !== id));
      window.dispatchEvent(new Event('researchUpdated'));
      alert('Research entry removed');
    } catch (err) {
      console.error('delete research error', err);
      alert('Failed to delete research entry');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await researchDB.updateResearch(id, { status: 'Approved' });
      setResearch((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
      );
      alert('Research approved!');
    } catch (err) {
      console.error('approve error', err);
      alert('Failed to approve research');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await researchDB.updateResearch(id, { status: newStatus });
      setResearch((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('status change error', err);
    }
  };

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      authors: [],
      students: [],
      year: new Date().getFullYear(),
      status: 'Draft',
      description: '',
      assignedPanel: [],
      advisers: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleAuthor = (authorId: string) => {
    const current = form.authors || [];
    const updated = current.includes(authorId)
      ? current.filter((a) => a !== authorId)
      : [...current, authorId];
    setForm({ ...form, authors: updated });
  };

  const toggleStudent = (studentId: string) => {
    const current = form.students || [];
    const updated = current.includes(studentId)
      ? current.filter((s) => s !== studentId)
      : [...current, studentId];
    setForm({ ...form, students: updated });
  };

  const toggleAdviser = (adviserId: string) => {
    const current = form.advisers || [];
    const updated = current.includes(adviserId)
      ? current.filter((a) => a !== adviserId)
      : [...current, adviserId];
    setForm({ ...form, advisers: updated });
  };

  const togglePanel = (panel: string) => {
    const current = form.assignedPanel || [];
    const updated = current.includes(panel)
      ? current.filter((p) => p !== panel)
      : [...current, panel];
    setForm({ ...form, assignedPanel: updated });
  };

  const panelOptions = ['Panel A', 'Panel B', 'Panel C', 'Panel D'];

  return (
    <div>
      <SectionHeader
        title="Research Management"
        subtitle="Manage research projects, approve, assign advisers, and track status"
        action={{
          label: showForm ? 'Cancel' : 'Add Research',
          onClick: showForm ? resetForm : () => setShowForm(true),
        }}
      />

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load research entries from backend." />}

      {/* Add/Edit Form */}
      {showForm && (
        <Card title={editingId ? 'Edit Research' : 'Add New Research'} className="mb-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Research title"
              />
              <FormInput
                label="Year"
                type="number"
                value={String(form.year)}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary"
                placeholder="Research description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Approved">Approved</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Authors (Faculty)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {facultyOptions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No faculty available</p>
                  ) : (
                    facultyOptions.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.authors || []).includes(f.id)}
                          onChange={() => toggleAuthor(f.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{f.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Students</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {studentOptions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No students available</p>
                  ) : (
                    studentOptions.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.students || []).includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Advisers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {facultyOptions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No faculty available</p>
                  ) : (
                    facultyOptions.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.advisers || []).includes(f.id)}
                          onChange={() => toggleAdviser(f.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{f.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Panels</label>
                <div className="space-y-2 border border-gray-300 rounded-lg p-2">
                  {panelOptions.map((panel) => (
                    <label key={panel} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.assignedPanel || []).includes(panel)}
                        onChange={() => togglePanel(panel)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{panel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddOrUpdate}
                className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-medium"
              >
                {editingId ? 'Update Research' : 'Add Research'}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search research by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Draft', 'In Progress', 'Approved', 'Published'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Research List */}
      {filteredResearch.length === 0 ? (
        <EmptyState
          title="No research entries found"
          description="Add research using the form above"
        />
      ) : (
        <div className="space-y-4">
          {filteredResearch.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.status !== 'Approved' && item.status !== 'Published' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded text-sm"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Year:</span> {item.year}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="ml-1 border border-gray-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Approved">Approved</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>

                {(item.authors || []).length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">Authors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.authors?.map((authorId) => {
                        const author = facultyOptions.find((f) => f.id === authorId);
                        return (
                          <span key={authorId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {author?.name || authorId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(item.students || []).length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">Students:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.students?.map((studentId) => {
                        const student = studentOptions.find((s) => s.id === studentId);
                        return (
                          <span key={studentId} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                            {student?.name || studentId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(item.advisers || []).length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">Advisers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.advisers?.map((adviserId) => {
                        const adviser = facultyOptions.find((f) => f.id === adviserId);
                        return (
                          <span key={adviserId} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                            {adviser?.name || adviserId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(item.assignedPanel || []).length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">Panels:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.assignedPanel?.map((panel) => (
                        <span key={panel} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                          {panel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
