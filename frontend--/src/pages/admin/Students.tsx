import React, { useMemo, useState } from 'react';
import { Trash2, Edit2, Eye, EyeOff, Search, X, User } from 'lucide-react';
import { useAsync, useForm, useSearch } from '../../hooks/useAsync';
import { studentDB } from '../../lib/database';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FormInput, SectionHeader, Card } from '../../components/ui/shared';

const initialFormState = {
  name: '',
  email: '',
  idNumber: '',
  year: '1st',
  program: 'BSCS',
  status: 'Regular',
  phone: '',
  address: '',
  dateOfBirth: '',
  skills: '',
  organizations: '',
  password: '',
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const AdminStudents: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [organizationFilter, setOrganizationFilter] = useState('All');

  const fetcher = useMemo(() => () => studentDB.getAllStudents(), []);
  const { data: studentsData, execute: refreshStudents } = useAsync(fetcher);
  const { formData, handleChange, reset, setFormData } = useForm(initialFormState, {});

  const searchFields: (keyof typeof initialFormState)[] = ['name', 'idNumber', 'email', 'program'];
  const { searchQuery, results: filteredStudents, setSearchQuery } = useSearch(studentsData || [], searchFields);
  const students = studentsData || [];

  const skillOptions = useMemo(() => {
    const unique = new Set<string>();
    students.forEach((student: any) => {
      const rawSkills = typeof student.skills === 'string' ? student.skills : '';
      rawSkills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .forEach((s: string) => unique.add(s));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const organizationOptions = useMemo(() => {
    const unique = new Set<string>();
    students.forEach((student: any) => {
      const rawOrganizations = typeof student.organizations === 'string' ? student.organizations : '';
      rawOrganizations
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean)
        .forEach((o: string) => unique.add(o));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const displayedStudents = useMemo(() => {
    return filteredStudents.filter((student: any) => {
      const matchesYear = yearFilter === 'All' || student.year === yearFilter;
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter;

      const studentSkills = typeof student.skills === 'string' ? student.skills.toLowerCase() : '';
      const matchesSkill = skillFilter === 'All' || studentSkills.split(',').map((s: string) => s.trim()).includes(skillFilter.toLowerCase());

      const studentOrganizations = typeof student.organizations === 'string' ? student.organizations.toLowerCase() : '';
      const matchesOrganization =
        organizationFilter === 'All' || studentOrganizations.split(',').map((o: string) => o.trim()).includes(organizationFilter.toLowerCase());

      return matchesYear && matchesStatus && matchesSkill && matchesOrganization;
    });
  }, [filteredStudents, yearFilter, statusFilter, skillFilter, organizationFilter]);

  const handleEdit = (student: any) => {
    setEditingId(student.id);
    setFormData({
      ...initialFormState,
      ...student,
      password: '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    if (!db) {
      alert('Database is not initialized.');
      return;
    }

    try {
      await studentDB.deleteStudent(id);
      await deleteDoc(doc(db, 'users', id));
      alert('Student deleted successfully.');
      await refreshStudents();
    } catch (err) {
      console.error('Delete Error:', err);
      alert('Failed to delete student records.');
    }
  };

  const handleAddOrUpdate = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedName = formData.name.trim();
    const normalizedPassword = formData.password.trim();

    if (!normalizedEmail || !normalizedName || (!editingId && !normalizedPassword)) {
      return alert('Please fill in Name, Email, and Password.');
    }
    if (!isValidEmail(normalizedEmail)) {
      return alert('Please enter a valid email address (example: student@email.com).');
    }
    if (!db || !auth) {
      alert('Authentication or database is not initialized.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { password, ...dataToSave } = formData;
      const cleanedDataToSave = {
        ...dataToSave,
        name: normalizedName,
        email: normalizedEmail,
      };

      if (editingId) {
        await studentDB.updateStudent(editingId, cleanedDataToSave);

        const userRef = doc(db, 'users', editingId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, {
            ...cleanedDataToSave,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await setDoc(userRef, {
            ...cleanedDataToSave,
            id: editingId,
            role: 'student',
            createdAt: new Date().toISOString(),
          });
        }

        alert('Student profile updated!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
        const uid = userCredential.user.uid;

        const userData = {
          ...cleanedDataToSave,
          id: uid,
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', uid), userData);
        await studentDB.addStudent(userData);

        alert('Student registered successfully!');
      }

      await refreshStudents();
      handleCancel();
    } catch (err: any) {
      console.error('Submit Error:', err);
      alert(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
    setPasswordVisible(false);
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Students Management"
        subtitle="Manage student accounts and profiles"
        action={{
          label: showForm ? 'Close' : 'Register New Student',
          onClick: showForm ? handleCancel : () => setShowForm(true),
        }}
      />

      {showForm && (
        <Card title={editingId ? `Editing: ${formData.name}` : 'New Registration'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Full Name" id="name" value={formData.name} onChange={handleChange} />
            <FormInput label="Email" id="email" type="email" value={formData.email} onChange={handleChange} />

            {!editingId && (
              <div className="flex flex-col">
                <label className="text-sm font-semibold mb-1 text-gray-700">Password</label>
                <div className="flex items-center border p-2 rounded-lg bg-white focus-within:ring-2 focus-within:ring-orange-500">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="flex-1 outline-none"
                  />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="text-gray-400">
                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <FormInput label="ID Number" id="idNumber" value={formData.idNumber} onChange={handleChange} />
            <FormInput label="Phone" id="phone" value={formData.phone} onChange={handleChange} />
            <FormInput label="Address" id="address" value={formData.address} onChange={handleChange} />
            <FormInput label="Date of Birth" id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1 text-gray-700">Program</label>
              <select
                id="program"
                value={formData.program}
                onChange={handleChange}
                className="border p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="BSCS">BSCS</option>
                <option value="BSIT">BSIT</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1 text-gray-700">Year Level</label>
              <select id="year" value={formData.year} onChange={handleChange} className="border p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1 text-gray-700">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="border p-2 rounded-lg bg-white font-bold outline-none focus:ring-2 focus:ring-orange-500">
                <option value="Regular">Regular</option>
                <option value="Irregular">Irregular</option>
              </select>
            </div>

            <FormInput label="Skills" id="skills" value={formData.skills} onChange={handleChange} />
            <FormInput label="Organizations" id="organizations" value={formData.organizations} onChange={handleChange} />

            <div className="col-span-full flex gap-3 mt-4">
              <button
                onClick={handleAddOrUpdate}
                disabled={isSubmitting}
                className="bg-orange-600 text-white px-10 py-2.5 rounded-xl font-bold hover:bg-orange-700 disabled:bg-gray-400 transition"
              >
                {isSubmitting ? 'Processing...' : editingId ? 'Save Changes' : 'Register Student'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Name, ID, or Program..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500">
            <option value="All">All Year Levels</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500">
            <option value="All">All Status</option>
            <option value="Regular">Regular</option>
            <option value="Irregular">Irregular</option>
          </select>

          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="border p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500">
            <option value="All">All Skills</option>
            {skillOptions.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>

          <select
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            className="border p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="All">All Organizations</option>
            {organizationOptions.map((organization) => (
              <option key={organization} value={organization}>
                {organization}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-400 text-xs uppercase">
                <th className="p-4">Student</th>
                <th className="p-4">ID Number</th>
                <th className="p-4">Program / Year</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{s.idNumber}</td>
                  <td className="p-4 text-sm">
                    <div className="font-bold text-blue-600">{s.program}</div>
                    <div className="text-gray-400">{s.year} Year</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'Irregular' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button onClick={() => setViewingStudent(s)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors" title="View Profile">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleEdit(s)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {viewingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{viewingStudent.name}</h2>
                  <p className="text-orange-100">{viewingStudent.idNumber}</p>
                </div>
              </div>
              <button onClick={() => setViewingStudent(null)} className="hover:bg-white/10 p-2 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Email Address</p>
                <p className="text-gray-700">{viewingStudent.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Phone Number</p>
                <p className="text-gray-700">{viewingStudent.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Program & Year</p>
                <p className="text-gray-700 font-semibold">
                  {viewingStudent.program} - {viewingStudent.year} Year
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-bold ${viewingStudent.status === 'Irregular' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {viewingStudent.status}
                </span>
              </div>
              <div className="col-span-full border-t pt-4">
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Address</p>
                <p className="text-gray-700">{viewingStudent.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Skills</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewingStudent.skills
                    ? viewingStudent.skills.split(',').map((skill: string) => (
                        <span key={skill} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md">
                          {skill.trim()}
                        </span>
                      ))
                    : 'None'}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Organizations</p>
                <p className="text-gray-700 text-sm">{viewingStudent.organizations || 'None'}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end">
              <button onClick={() => setViewingStudent(null)} className="bg-gray-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-900 transition">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};