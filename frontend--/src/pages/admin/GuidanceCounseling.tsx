import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { guidanceDB, studentDB } from '../../lib/database';
import { Card, EmptyState, ErrorMessage, LoadingSpinner, SuccessMessage } from '../../components/ui/shared';

interface Student {
  id: string;
  name: string;
  email: string;
  idNumber?: string;
  program?: string;
}

interface GuidanceRecord {
  id: string;
  studentId: string;
  email: string;
  incident_date: string;
  severity: string;
  offense: string;
  guidance_notes?: string;
  action_taken?: string;
  is_resolved: boolean;
  createdAt?: string;
}

const initialForm = {
  studentId: '',
  offense: '',
  severity: 'Low',
  incident_date: new Date().toISOString().slice(0, 10),
  guidance_notes: '',
  action_taken: '',
  is_resolved: false,
};

export const AdminGuidanceCounseling: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: studentRecords,
    loading: recordsLoading,
    error: recordsError,
    execute: fetchRecords,
  } = useAsync<GuidanceRecord[]>(() =>
    guidanceDB.getStudentDisciplineRecords(form.studentId, students.find((s) => s.id === form.studentId)?.email).then((data: any) => data as GuidanceRecord[]),
    false
  );

  const { data: studentsData, error: studentsError, execute: fetchStudents } = useAsync<Student[]>(() =>
    studentDB.getAllStudents().then((data: any) => data as Student[]),
    false
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData);
    }
  }, [studentsData]);

  useEffect(() => {
    if (selectedStudentId) {
      setForm((prev) => ({ ...prev, studentId: selectedStudentId }));
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (form.studentId) {
      fetchRecords();
    }
  }, [form.studentId, fetchRecords]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === form.studentId),
    [students, form.studentId]
  );

  const handleInput = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!form.studentId) {
      setError('Select a student first.');
      return;
    }
    if (!form.offense.trim()) {
      setError('Offense is required.');
      return;
    }

    try {
      await guidanceDB.addDisciplineRecord({
        studentId: form.studentId,
        email: selectedStudent?.email || '',
        incident_date: form.incident_date,
        severity: form.severity,
        offense: form.offense,
        guidance_notes: form.guidance_notes,
        action_taken: form.action_taken,
        is_resolved: form.is_resolved,
        createdAt: new Date().toISOString(),
      });

      setSuccess('Guidance counseling record added successfully.');
      setForm(initialForm);
      setSelectedStudentId('');
      fetchStudents();
      if (selectedStudent?.id) {
        fetchRecords();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save guidance record');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Guidance Counseling</h1>
        <p className="text-gray-600 mt-2">Add counseling records for a specific student and review their history.</p>
      </div>

      {(studentsError || recordsError) && <ErrorMessage message="Failed to load guidance counseling data." />}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <Card className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Select Student</p>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} {student.idNumber ? `(${student.idNumber})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Student Email</p>
          <p className="text-gray-700">{selectedStudent?.email || 'Select a student to view email'}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Program</p>
          <p className="text-gray-700">{selectedStudent?.program || 'N/A'}</p>
        </div>
      </Card>

      <Card className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Offense</label>
          <input
            type="text"
            value={form.offense}
            onChange={(e) => handleInput('offense', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Describe the offense or reason for counseling"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
          <select
            value={form.severity}
            onChange={(e) => handleInput('severity', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Date</label>
          <input
            type="date"
            value={form.incident_date}
            onChange={(e) => handleInput('incident_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={form.is_resolved}
            onChange={(e) => handleInput('is_resolved', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Mark as resolved</span>
        </div>
      </Card>

      <Card className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Guidance Notes</label>
          <textarea
            value={form.guidance_notes}
            onChange={(e) => handleInput('guidance_notes', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Write notes or counseling recommendations"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Action Taken</label>
          <textarea
            value={form.action_taken}
            onChange={(e) => handleInput('action_taken', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Describe follow-up actions or referrals"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
        >
          <Plus size={18} /> Add Guidance Record
        </button>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Student Guidance History</h2>
            <p className="text-sm text-gray-600">Showing records for the selected student.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-700">
            <ShieldAlert size={18} /> {studentRecords?.length || 0} records
          </div>
        </div>

        {recordsLoading ? (
          <LoadingSpinner />
        ) : !studentRecords || studentRecords.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No guidance records"
            description="Select a student and add a record to see their counseling history."
          />
        ) : (
          <div className="space-y-4">
            {studentRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{record.offense}</p>
                    <p className="text-sm text-gray-500">Incident Date: {new Date(record.incident_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.is_resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.is_resolved ? 'Resolved' : 'For Counseling'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      {record.severity}
                    </span>
                  </div>
                </div>

                {(record.guidance_notes || record.action_taken) && (
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {record.guidance_notes && <p><span className="font-semibold">Notes:</span> {record.guidance_notes}</p>}
                    {record.action_taken && <p><span className="font-semibold">Action Taken:</span> {record.action_taken}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-800">{students.length}</p>
            </div>
            <ClipboardList className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selected Student</p>
              <p className="text-2xl font-bold text-gray-800">{selectedStudent?.name || 'None'}</p>
            </div>
            <CheckCircle2 className="text-green-600" size={24} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved Records</p>
              <p className="text-2xl font-bold text-gray-800">{(studentRecords || []).filter((r) => r.is_resolved).length}</p>
            </div>
            <ShieldAlert className="text-orange-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};