import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit2, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useForm } from '../../hooks/useAsync';
import { useSearch } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/useAsync';
import { facultyDB } from '../../lib/database';
import { LoadingSpinner, ErrorMessage, EmptyState, FormInput, SectionHeader, Pagination, Card } from '../../components/ui/shared';
import { mockFaculty } from '../../lib/constants';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string;
  phone?: string;
  office?: string;
  qualifications?: string;
}

interface FacultyFormData {
  name: string;
  email: string;
  department: string;
  specialization: string;
  phone: string;
  office: string;
  qualifications: string;
}

const initialFormState: FacultyFormData = {
  name: '',
  email: '',
  department: 'Computer Science',
  specialization: '',
  phone: '',
  office: '',
  qualifications: '',
};

const validationSchema = {
  name: (value: string) => value.trim().length < 3 ? 'Name must be at least 3 characters' : '',
  email: (value: string) => !value.includes('@') ? 'Invalid email address' : '',
  department: (value: string) => value.trim().length === 0 ? 'Department is required' : '',
  specialization: (value: string) => value.trim().length === 0 ? 'Specialization is required' : '',
  phone: (value: string) => value.trim().length === 0 ? 'Phone is required' : '',
  office: (value: string) => value.trim().length === 0 ? 'Office location is required' : '',
  qualifications: (value: string) => value.trim().length === 0 ? 'Qualifications are required' : '',
};

export const AdminFaculty: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>(mockFaculty as Faculty[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);

  const { data: facultyData, loading, error, execute: fetchFaculty } = useAsync<Faculty[]>(() =>
    facultyDB.getAllFaculty().then((data: any) => data as Faculty[]).catch(() => mockFaculty as Faculty[])
  );

  const { formData, errors, touched, handleChange, handleBlur, reset, setFormData } = useForm<FacultyFormData>(
    initialFormState,
    validationSchema
  );

  const { searchQuery, results: filteredFaculty, setSearchQuery } = useSearch<Faculty>(
    faculty,
    ['name', 'email', 'department', 'specialization']
  );

  // Filter by department
  const departmentFiltered = useMemo(() => {
    if (departmentFilter === 'All') return filteredFaculty;
    return filteredFaculty.filter(f => f.department === departmentFilter);
  }, [filteredFaculty, departmentFilter]);

  const { currentPage, totalPages, currentData, goToPage } = usePagination(departmentFiltered, 5);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  useEffect(() => {
    if (facultyData && facultyData.length > 0) {
      setFaculty(facultyData);
    }
  }, [facultyData]);

  const departments = useMemo(() => {
    const depts = new Set(faculty.map(f => f.department));
    return ['All', ...Array.from(depts)];
  }, [faculty]);

  const handleAddOrUpdate = async () => {
    if (Object.values(errors).some(e => e)) {
      alert('Please fix validation errors');
      return;
    }

    try {
      if (editingId) {
        await facultyDB.updateFaculty(editingId, formData);
        const updated = faculty.map(f =>
          f.id === editingId ? { ...f, ...formData } : f
        );
        setFaculty(updated);
        setEditingId(null);
        window.dispatchEvent(new Event('facultyUpdated'));
        alert('Faculty updated successfully!');
      } else {
        const id = await facultyDB.addFaculty({ ...formData });
        const newFaculty: Faculty = {
          ...formData,
          id,
        };
        setFaculty([...faculty, newFaculty]);
        window.dispatchEvent(new Event('facultyUpdated'));
        alert('Faculty added successfully!');
      }
      reset();
      setShowForm(false);
    } catch (err) {
      console.error('faculty save error', err);
      alert('Failed to save faculty');
    }
  };

  const handleEdit = (f: Faculty) => {
    setFormData({
      name: f.name,
      email: f.email,
      department: f.department,
      specialization: f.specialization,
      phone: f.phone || '',
      office: f.office || '',
      qualifications: f.qualifications || '',
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await facultyDB.deleteFaculty(id);
      setFaculty(faculty.filter(f => f.id !== id));
      window.dispatchEvent(new Event('facultyUpdated'));
      alert('Faculty deleted successfully!');
    } catch (err) {
      console.error('faculty delete error', err);
      alert('Failed to delete faculty');
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
        title="Faculty Management"
        subtitle="Manage all faculty members in the system"
        action={{ label: showForm ? 'Cancel' : 'Add Faculty', onClick: showForm ? handleCancel : () => setShowForm(true) }}
      />

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load faculty. Showing mock data." />}

      {/* Add/Edit Form */}
      {showForm && (
        <Card title={editingId ? 'Edit Faculty' : 'Add New Faculty'} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              id="name"
              type="text"
              placeholder="Dr. John Smith"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name ? errors.name : ''}
            />
            <FormInput
              label="Email Address"
              id="email"
              type="email"
              placeholder="john.smith@university.edu"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <select
                id="department"
                value={formData.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Engineering</option>
                <option>Business</option>
                <option>Liberal Arts</option>
              </select>
              {touched.department && errors.department && (
                <p className="text-red-600 text-xs font-medium mt-1">{errors.department}</p>
              )}
            </div>
            <FormInput
              label="Specialization"
              id="specialization"
              type="text"
              placeholder="e.g., Artificial Intelligence"
              value={formData.specialization}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.specialization ? errors.specialization : ''}
            />
            <FormInput
              label="Phone"
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : ''}
            />
            <FormInput
              label="Office Location"
              id="office"
              type="text"
              placeholder="Building A, Room 201"
              value={formData.office}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.office ? errors.office : ''}
            />
            <FormInput
              label="Qualifications"
              id="qualifications"
              type="text"
              placeholder="Ph.D. in Computer Science"
              value={formData.qualifications}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.qualifications ? errors.qualifications : ''}
            />
            <button
              onClick={handleAddOrUpdate}
              disabled={hasValidationErrors}
              className="col-span-full md:col-span-1 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
            >
              {editingId ? 'Update Faculty' : 'Add Faculty'}
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
              placeholder="Search by name, email, department, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  departmentFilter === dept
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Faculty Table */}
      <Card title="Faculty List">
        {!faculty || faculty.length === 0 ? (
          <EmptyState
            icon="Users2"
            title="No faculty members found"
            description="Add a faculty member to get started"
          />
        ) : departmentFiltered.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No matching faculty"
            description={`No faculty match your filters`}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialization</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((f) => (
                    <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{f.name}</td>
                      <td className="py-3 px-4 text-gray-600">{f.email}</td>
                      <td className="py-3 px-4 text-gray-600">{f.department}</td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {f.specialization}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
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
                Showing {currentData.length === 0 ? 0 : (currentPage - 1) * 5 + 1} to {Math.min(currentPage * 5, departmentFiltered.length)} of {departmentFiltered.length} faculty members
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
