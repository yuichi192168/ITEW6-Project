import React, { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { studentDB, guidanceDB } from '../../lib/database';
import { Card, EmptyState, ErrorMessage, FormInput, SectionHeader } from '../../components/ui/shared';

interface Student {
  id: string;
  name: string;
  email?: string;
  idNumber?: string;
}

interface DisciplineRecord {
  id: string;
  studentId: string;
  email?: string;
  offense: string;
  severity: string;
  status: string;
  incident_date: string;
  guidance_notes?: string;
  action_taken?: string;
  is_resolved: boolean;
}

export const AdminGuidance: React.FC = () => {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [offense, setOffense] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [status, setStatus] = useState('Open');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: students, execute: fetchStudents } = useAsync<Student[]>(() =>
    studentDB.getAllStudents().then((data: any) => data as Student[])
  );

  const fetchRecords = async () => {
    try {
      const data = await guidanceDB.getAllDisciplineRecords();
      setRecords(data as DisciplineRecord[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
      setRecords([]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchRecords();
  }, [fetchStudents]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    (students || []).forEach((student) => map.set(String(student.id), student));
    return map;
  }, [students]);

  const handleAddRecord = async () => {
    if (!selectedStudentId || !offense.trim()) {
      setError('Student and offense are required');
      return;
    }

    const student = studentMap.get(selectedStudentId);
    const payload = {
      studentId: selectedStudentId,
      email: student?.email || '',
      offense: offense.trim(),
      severity,
      status,
      incident_date: incidentDate,
      guidance_notes: notes.trim(),
      action_taken: actionTaken.trim(),
      is_resolved: isResolved,
    };

    try {
      setSaving(true);
      await guidanceDB.addDisciplineRecord(payload);
      setSelectedStudentId('');
      setOffense('');
      setSeverity('Low');
      setStatus('Open');
      setIncidentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setActionTaken('');
      setIsResolved(false);
      await fetchRecords();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Guidance Records"
        subtitle="Create and manage discipline records per student"
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <Card title="Add Guidance Record" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a student</option>
              {(students || []).map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.idNumber || student.id})
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Incident Date"
            id="incidentDate"
            type="date"
            value={incidentDate}
            onChange={(event) => setIncidentDate(event.target.value)}
          />

          <FormInput
            label="Offense"
            id="offense"
            value={offense}
            onChange={(event) => setOffense(event.target.value)}
            placeholder="Late submission / misconduct / absence"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Guidance Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Action Taken</label>
            <textarea
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isResolved}
              onChange={(event) => setIsResolved(event.target.checked)}
            />
            Mark as resolved
          </label>

          <button
            onClick={handleAddRecord}
            disabled={saving}
            className="md:col-span-2 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Guidance Record'}
          </button>
        </div>
      </Card>

      <Card title="Existing Records">
        {records.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No guidance records yet"
            description="Discipline entries will appear here once created."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Offense</th>
                  <th className="text-left p-3">Severity</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Incident Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const student = studentMap.get(String(record.studentId));
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{student?.name || record.studentId}</td>
                      <td className="p-3">{record.offense}</td>
                      <td className="p-3">{record.severity}</td>
                      <td className="p-3">{record.status}</td>
                      <td className="p-3">{record.incident_date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
