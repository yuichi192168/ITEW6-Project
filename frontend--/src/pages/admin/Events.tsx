import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit2, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useForm } from '../../hooks/useAsync';
import { useSearch } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/useAsync';
import { eventsDB } from '../../lib/database';
import { LoadingSpinner, ErrorMessage, EmptyState, FormInput, SectionHeader, Pagination, Card } from '../../components/ui/shared';

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  type: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}

interface EventFormData {
  title: string;
  date: string;
  description: string;
  type: string;
  location: string;
  startTime: string;
  endTime: string;
}

const initialFormState: EventFormData = {
  title: '',
  date: '',
  description: '',
  type: 'school',
  location: '',
  startTime: '',
  endTime: '',
};

const validationSchema = {
  title: (value: string) => value.trim().length < 3 ? 'Title must be at least 3 characters' : '',
  date: (value: string) => value === '' ? 'Date is required' : '',
  description: (value: string) => value.trim().length < 10 ? 'Description must be at least 10 characters' : '',
  type: (value: string) => value === '' ? 'Event type is required' : '',
  location: (value: string) => value.trim().length === 0 ? 'Location is required' : '',
  startTime: (value: string) => value === '' ? 'Start time is required' : '',
  endTime: (value: string) => value === '' ? 'End time is required' : '',
};

const validateEventForm = (data: EventFormData): string | null => {
  const title = data.title.trim();
  const description = data.description.trim();
  const location = data.location.trim();

  if (title.length < 3) return 'Title must be at least 3 characters.';
  if (!data.date) return 'Date is required.';
  if (description.length < 10) return 'Description must be at least 10 characters.';
  if (!data.type) return 'Event type is required.';
  if (!location) return 'Location is required.';
  if (!data.startTime) return 'Start time is required.';
  if (!data.endTime) return 'End time is required.';
  if (data.startTime >= data.endTime) return 'End time must be later than start time.';
  return null;
};

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);

  const { data: eventsData, loading, error, execute: fetchEvents } = useAsync<Event[]>(() =>
    eventsDB.getAllEvents().then((data: any) => data as Event[])
  );

  const { formData, errors, touched, handleChange, handleBlur, reset, setFormData } = useForm<EventFormData>(
    initialFormState,
    validationSchema
  );

  const { searchQuery, results: filteredEvents, setSearchQuery } = useSearch<Event>(
    events,
    ['title', 'description', 'location', 'type']
  );

  // Filter by type
  const typeFiltered = useMemo(() => {
    if (typeFilter === 'All') return filteredEvents;
    return filteredEvents.filter(e => e.type === typeFilter);
  }, [filteredEvents, typeFilter]);

  const { currentPage, totalPages, currentData, goToPage } = usePagination(typeFiltered, 5);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (eventsData && eventsData.length > 0) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return ['All', ...Array.from(types)];
  }, [events]);

  const handleAddOrUpdate = async () => {
    const validationError = validateEventForm(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload: EventFormData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
    };

    try {
      if (editingId) {
        await eventsDB.updateEvent(editingId, payload);
        const updated = events.map(e =>
          e.id === editingId ? { ...e, ...payload } : e
        );
        setEvents(updated);
        setEditingId(null);
        window.dispatchEvent(new Event('eventsUpdated'));
        alert('Event updated successfully!');
      } else {
        const id = await eventsDB.addEvent({ ...payload });
        const newEvent: Event = {
          ...payload,
          id,
        };
        setEvents(prev => [...prev, newEvent]);
        window.dispatchEvent(new Event('eventsUpdated'));
        alert('Event added successfully!');
      }
      reset();
      setShowForm(false);
    } catch (err) {
      console.error('event save error', err);
      alert('Failed to save event to backend.');
    }
  };

  const handleEdit = (e: Event) => {
    setFormData({
      title: e.title,
      date: e.date,
      description: e.description,
      type: e.type,
      location: e.location || '',
      startTime: e.startTime || '',
      endTime: e.endTime || '',
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsDB.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      window.dispatchEvent(new Event('eventsUpdated'));
      alert('Event deleted successfully!');
    } catch (err) {
      console.error('event delete error', err);
      alert('Failed to delete event from backend.');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const hasValidationErrors = Object.values(errors).some(e => e);

  return (
    <div>
      <SectionHeader
        title="Events Management"
        subtitle="Manage all academic events and activities"
        action={{ label: showForm ? 'Cancel' : 'Add Event', onClick: showForm ? handleCancel : () => setShowForm(true) }}
      />

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load events from backend." />}

      {/* Add/Edit Form */}
      {showForm && (
        <Card title={editingId ? 'Edit Event' : 'Add New Event'} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Event Title"
              id="title"
              type="text"
              placeholder="e.g., Midterm Exams"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.title ? errors.title : ''}
            />
            <FormInput
              label="Event Date"
              id="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.date ? errors.date : ''}
            />
            <FormInput
              label="Start Time"
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.startTime ? errors.startTime : ''}
            />
            <FormInput
              label="End Time"
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.endTime ? errors.endTime : ''}
            />
            <FormInput
              label="Location"
              id="location"
              type="text"
              placeholder="e.g., Main Campus"
              value={formData.location}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.location ? errors.location : ''}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="school">School Event</option>
                <option value="department">Department Event</option>
                <option value="academic">Academic</option>
                <option value="extracurricular">Extracurricular</option>
                <option value="holiday">Holiday</option>
              </select>
              {touched.type && errors.type && (
                <p className="text-red-600 text-xs font-medium mt-1">{errors.type}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                placeholder="Event details and description..."
                value={formData.description}
                onChange={(e) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                onBlur={(e) => handleBlur(e as unknown as React.FocusEvent<HTMLInputElement | HTMLSelectElement>)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  touched.description && errors.description
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-300 focus:ring-primary'
                }`}
              />
              {touched.description && errors.description && (
                <p className="text-red-600 text-xs font-medium mt-1">{errors.description}</p>
              )}
            </div>
            <button
              onClick={handleAddOrUpdate}
              disabled={hasValidationErrors}
              className="col-span-full md:col-span-1 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
            >
              {editingId ? 'Update Event' : 'Add Event'}
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
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  typeFilter === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card title="Events List">
        {!events || events.length === 0 ? (
          <EmptyState
            icon="CalendarDays"
            title="No events found"
            description="Add an event to get started"
          />
        ) : typeFiltered.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No matching events"
            description={`No events match your filters`}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((e) => (
                    <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{e.title}</td>
                      <td className="py-3 px-4 text-gray-600">{e.date}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.startTime && e.endTime ? `${e.startTime} - ${e.endTime}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{e.location || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                          {e.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                Showing {currentData.length === 0 ? 0 : (currentPage - 1) * 5 + 1} to {Math.min(currentPage * 5, typeFiltered.length)} of {typeFiltered.length} events
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
