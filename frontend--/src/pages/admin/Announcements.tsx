import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit2, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useForm } from '../../hooks/useAsync';
import { useSearch } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/useAsync';
import { announcementsDB } from '../../lib/database';
import { LoadingSpinner, ErrorMessage, EmptyState, FormInput, SectionHeader, Pagination, Card } from '../../components/ui/shared';
import { mockAnnouncements } from '../../lib/constants';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  admin: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  date: string;
  admin: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

const initialFormState: AnnouncementFormData = {
  title: '',
  content: '',
  date: new Date().toISOString().split('T')[0],
  admin: 'Admin',
  priority: 'medium',
  category: 'General',
};

const validationSchema = {
  title: (value: string) => value.trim().length < 3 ? 'Title must be at least 3 characters' : '',
  content: (value: string) => value.trim().length < 10 ? 'Content must be at least 10 characters' : '',
  date: (value: string) => value === '' ? 'Date is required' : '',
  admin: (value: string) => value.trim().length === 0 ? 'Administrator name is required' : '',
  priority: (value: string) => value === '' ? 'Priority is required' : '',
  category: (value: string) => value.trim().length === 0 ? 'Category is required' : '',
};

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements as Announcement[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);

  const { data: announcementsData, loading, error, execute: fetchAnnouncements } = useAsync<Announcement[]>(() =>
    announcementsDB.getAllAnnouncements().then((data: any) => data as Announcement[]).catch(() => mockAnnouncements as Announcement[])
  );

  const { formData, errors, touched, handleChange, handleBlur, reset, setFormData } = useForm<AnnouncementFormData>(
    initialFormState,
    validationSchema
  );

  useEffect(() => {
    if (announcementsData && announcementsData.length > 0) {
      setAnnouncements(announcementsData);
    }
  }, [announcementsData]);

  const { searchQuery, results: filteredAnnouncements, setSearchQuery } = useSearch<Announcement>(
    announcements,
    ['title', 'content', 'category', 'admin']
  );

  // Filter by priority
  const priorityFiltered = useMemo(() => {
    if (priorityFilter === 'All') return filteredAnnouncements;
    return filteredAnnouncements.filter(a => a.priority === priorityFilter);
  }, [filteredAnnouncements, priorityFilter]);

  // Sort by date (newest first)
  const sortedAnnouncements = useMemo(() => {
    return [...priorityFiltered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [priorityFiltered]);

  const { currentPage, totalPages, currentData, goToPage } = usePagination(sortedAnnouncements, 5);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleAddOrUpdate = async () => {
    if (Object.values(errors).some(e => e)) {
      alert('Please fix validation errors');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        await announcementsDB.updateAnnouncement(editingId, formData);
        const updated = announcements.map(a =>
          a.id === editingId ? { ...a, ...formData } : a
        );
        setAnnouncements(updated);
        setEditingId(null);
        window.dispatchEvent(new Event('announcementsUpdated'));
        alert('Announcement updated successfully!');
      } else {
        // Add new
        const id = await announcementsDB.addAnnouncement(formData);
        const newAnnouncement: Announcement = {
          ...formData,
          id,
        };
        setAnnouncements([...announcements, newAnnouncement]);
        window.dispatchEvent(new Event('announcementsUpdated'));
        alert('Announcement created successfully!');
      }
      reset();
      setShowForm(false);
    } catch (err) {
      alert('Failed to save announcement');
    }
  };

  const handleEdit = (a: Announcement) => {
    setFormData({
      title: a.title,
      content: a.content,
      date: a.date,
      admin: a.admin,
      priority: a.priority || 'medium',
      category: a.category || 'General',
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementsDB.deleteAnnouncement(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      window.dispatchEvent(new Event('announcementsUpdated'));
      alert('Announcement deleted successfully!');
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const hasValidationErrors = Object.values(errors).some(e => e);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <SectionHeader
        title="Announcements Management"
        subtitle="Create and manage system announcements for students and faculty"
        action={{
          label: showForm ? 'Cancel' : 'Add Announcement',
          onClick: showForm ? handleCancel : () => setShowForm(true),
        }}
      />

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load announcements. Showing mock data." />}

      {/* Add/Edit Form */}
      {showForm && (
        <Card title={editingId ? 'Edit Announcement' : 'Add New Announcement'} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Announcement Title"
              id="title"
              type="text"
              placeholder="e.g., Registration Deadline"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.title ? errors.title : ''}
            />
            <FormInput
              label="Date"
              id="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.date ? errors.date : ''}
            />
            <FormInput
              label="Administrator Name"
              id="admin"
              type="text"
              placeholder="Your name or title"
              value={formData.admin}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.admin ? errors.admin : ''}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <FormInput
              label="Category"
              id="category"
              type="text"
              placeholder="e.g., Academic, Administrative, Event"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.category ? errors.category : ''}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
              <textarea
                id="content"
                placeholder="Full announcement content..."
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const event = { target: { id: 'content', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                  handleChange(event);
                }}
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  const event = { target: { id: 'content', value: e.target.value } } as React.FocusEvent<HTMLInputElement, Element>;
                  handleBlur(event);
                }}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  touched.content && errors.content
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-300 focus:ring-primary'
                }`}
              />
              {touched.content && errors.content && (
                <p className="text-red-600 text-xs font-medium mt-1">{errors.content}</p>
              )}
            </div>
            <button
              onClick={handleAddOrUpdate}
              disabled={hasValidationErrors}
              className="col-span-full md:col-span-1 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
            >
              {editingId ? 'Update Announcement' : 'Create Announcement'}
            </button>
            <button
              onClick={handleCancel}
              className="col-span-full md:col-span-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-8">
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements by title, content, category, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'high', 'medium', 'low'].map(priority => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-4 py-2 rounded-lg transition font-medium capitalize ${
                  priorityFilter === priority
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {priority === 'All' ? 'All Priorities' : `${priority} Priority`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      <Card title="Announcements">
        {!announcements || announcements.length === 0 ? (
          <EmptyState
            icon="Bell"
            title="No announcements"
            description="Create an announcement to get started"
          />
        ) : sortedAnnouncements.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No matching announcements"
            description={`No announcements match your filters`}
          />
        ) : (
          <>
            <div className="space-y-3">
              {currentData.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                      <div className="flex gap-2 items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityColor(announcement.priority || 'medium')}`}>
                          {announcement.priority || 'medium'} Priority
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                        {announcement.category && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {announcement.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-3">By {announcement.admin}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                itemsPerPage={5}
                onItemsPerPageChange={() => {}}
              />
              <p className="mt-4 text-sm text-gray-600">
                Showing {currentData.length === 0 ? 0 : (currentPage - 1) * 5 + 1} to {Math.min(currentPage * 5, sortedAnnouncements.length)} of {sortedAnnouncements.length} announcements
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
