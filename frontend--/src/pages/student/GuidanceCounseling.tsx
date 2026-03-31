import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { guidanceDB } from '../../lib/database';
import { EmptyState, ErrorMessage } from '../../components/ui/shared';

interface DisciplineRecord {
  id: number;
  incident_date: string;
  severity: string;
  status: string;
  offense: string;
  guidance_notes?: string;
  action_taken?: string;
  is_resolved: boolean;
}

export const StudentGuidanceCounseling: React.FC = () => {
  const { user } = useAuth();
  const {
    data: records,
    error,
    execute,
  } = useAsync<DisciplineRecord[]>(() =>
    guidanceDB.getStudentDisciplineRecords(user?.id, user?.email).then((data: any) => data as DisciplineRecord[])
  );

  useEffect(() => {
    if (user?.id || user?.email) {
      execute();
    }
  }, [user?.id, user?.email, execute]);

  const badRecords = (records || []).filter((r) => !r.is_resolved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Guidance Counseling</h1>
        <p className="text-gray-600 mt-2">View your discipline records and counseling remarks</p>
      </div>

      {error && <ErrorMessage message="Failed to load guidance counseling records." />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{records?.length || 0}</p>
            </div>
            <ClipboardList className="text-blue-600" size={26} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Attention</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{badRecords}</p>
            </div>
            <ShieldAlert className="text-red-600" size={26} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{(records?.length || 0) - badRecords}</p>
            </div>
            <CheckCircle2 className="text-green-600" size={26} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Discipline Records</h2>
        {!records || records.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No discipline records found"
            description="Your guidance counseling records will appear here when available"
          />
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{record.offense}</p>
                    <p className="text-sm text-gray-500">
                      Incident Date: {new Date(record.incident_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.is_resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {record.is_resolved ? 'Resolved' : 'For Counseling'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      {record.severity}
                    </span>
                  </div>
                </div>

                {(record.guidance_notes || record.action_taken) && (
                  <div className="mt-3 space-y-1">
                    {record.guidance_notes && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Guidance Notes:</span> {record.guidance_notes}
                      </p>
                    )}
                    {record.action_taken && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Action Taken:</span> {record.action_taken}
                      </p>
                    )}
                  </div>
                )}

                {!record.is_resolved && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle size={16} />
                    Please coordinate with Guidance Office for this record.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
