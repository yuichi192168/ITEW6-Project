import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit2, Eye, EyeOff, CheckCircle, Search } from 'lucide-react';
import { useAsync, useForm, useSearch } from '../../hooks/useAsync';
import { studentDB } from '../../lib/database';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { FormInput, SectionHeader, Card } from '../../components/ui/shared';

const initialFormState = { 
  name: '', 
  email: '', 
  idNumber: '', 
  year: '1st', 
  program: 'BSCS', // Defaulted to BSCS
  status: 'Regular',
  phone: '',
  address: '',
  dateOfBirth: '',
  skills: '',
  organizations: '',
  password: ''
};

export const AdminStudents: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetcher = useMemo(() => () => studentDB.getAllStudents(), []);
  const { data: studentsData, execute: refreshStudents } = useAsync(fetcher);

  const { formData, handleChange, reset, setFormData } = useForm(initialFormState, {});

  const searchFields: (keyof typeof initialFormState)[] = ['name', 'idNumber', 'email', 'program'];
  const { searchQuery, results: filteredStudents, setSearchQuery } = useSearch(studentsData || [], searchFields);

  const handleEdit = (student: any) => {
    setEditingId(student.id);
    setFormData({
      ...initialFormState,
      ...student,
      password: '' 
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddOrUpdate = async () => {
    if (!formData.email || !formData.name || (!editingId && !formData.password)) {
      return alert("Please fill in Name, Email, and Password.");
    }

    setIsSubmitting(true);
    try {
      const { password, ...dataToSave } = formData;

      if (editingId) {
        await studentDB.updateStudent(editingId, dataToSave);
        
        const userRef = doc(db, 'users', editingId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, { ...dataToSave, updatedAt: new Date().toISOString() });
        } else {
          await setDoc(userRef, { ...dataToSave, role: 'student', createdAt: new Date().toISOString() });
        }
        alert("Student profile updated!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const uid = userCredential.user.uid;

        const userData = {
          ...dataToSave,
          id: uid,
          role: 'student',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', uid), userData);
        await studentDB.addStudent(userData);
        
        alert("Student registered successfully!");
      }

      await refreshStudents();
      handleCancel();
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert(err.message || "An error occurred.");
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
          onClick: showForm ? handleCancel : () => setShowForm(true) 
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
                    type={passwordVisible ? "text" : "password"} 
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
            
            {/* UPDATED PROGRAM DROPDOWN */}
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
                {isSubmitting ? 'Processing...' : (editingId ? 'Save Changes' : 'Register Student')}
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
              {filteredStudents.map((s: any) => (
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
                    <button onClick={() => handleEdit(s)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <Edit2 size={18}/>
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('Delete student?')) studentDB.deleteStudent(s.id).then(refreshStudents) }} 
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};