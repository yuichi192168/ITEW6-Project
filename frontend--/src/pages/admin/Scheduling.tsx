import React, { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { schedulesDB, facultyDB, studentDB, coursesDB } from '../../lib/database';
import { Card, EmptyState, ErrorMessage, LoadingSpinner } from '../../components/ui/shared';
import { onSyncEvent } from '../../lib/syncEvents';

interface Schedule {
  id: string;
  subject_id?: string;
  subjectId?: string;
  course_id?: string;
  courseId?: string;
  faculty_id?: string;
  facultyId?: string;
  student_id?: string;
  studentId?: string;
  student_ids?: string[];
  students?: string[];
  day?: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  section?: string;
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
  section?: string;
  year?: string;
  program?: string;
}

interface Subject {
  id: string | number;
  name?: string;
  code?: string;
  yearLevel?: string;
  department?: string;
  sections?: string[];
  facultyId?: string | number;
  faculty_id?: string | number;
}

interface ScheduleFormData {
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  department: string;
  yearLevel: string;
  section: string;
}

type ScheduleFormErrors = Partial<Record<keyof ScheduleFormData, string>>;

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

export const AdminScheduling: React.FC = () => {
  const { data: schedules, loading, error, execute: fetchSchedules } = useAsync<Schedule[]>(() =>
    schedulesDB.getAllSchedules().then((data: any) => data as Schedule[])
  );
  const { data: faculties, execute: fetchFaculties } = useAsync<Faculty[]>(() =>
    facultyDB.getAllFaculty().then((data: any) => data as Faculty[])
  );
  const { data: students, execute: fetchStudents } = useAsync<Student[]>(() =>
    studentDB.getAllStudents().then((data: any) => data as Student[])
  );
  const { data: subjects, execute: fetchSubjects } = useAsync<Subject[]>(() =>
    coursesDB.getAllCourses().then((data) => data as Subject[])
  );
  const [formData, setFormData] = useState<ScheduleFormData>({
    courseId: '',
    day: '',
    startTime: '',
    endTime: '',
    room: '',
    department: '',
    yearLevel: '',
    section: '',
  });
  const [formErrors, setFormErrors] = useState<ScheduleFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    fetchSchedules();
    fetchFaculties();
    fetchStudents();
    fetchSubjects();

    // Listen for sync events to refresh data
    const unsubscribe = onSyncEvent(({ detail }) => {
      if (detail.type === 'subjectCreated' || detail.type === 'subjectUpdated' || detail.type === 'subjectDeleted') {
        fetchSubjects();
      }
      if (detail.type === 'facultyCreated' || detail.type === 'facultyUpdated' || detail.type === 'facultyDeleted') {
        fetchFaculties();
      }
      if (detail.type === 'studentCreated' || detail.type === 'studentUpdated' || detail.type === 'studentDeleted') {
        fetchStudents();
      }
    });

    return unsubscribe;
  }, [fetchSchedules, fetchFaculties, fetchStudents, fetchSubjects]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const facultyById = useMemo(() => {
    const map = new Map<string, Faculty>();
    (faculties || []).forEach((f) => map.set(String(f.id), f));
    return map;
  }, [faculties]);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    (students || []).forEach((s) => map.set(String(s.id), s));
    return map;
  }, [students]);

  const subjectById = useMemo(() => {
    const map = new Map<string, Subject>();
    (subjects || []).forEach((s) => map.set(String(s.id), s));
    return map;
  }, [subjects]);

  const sectionOptions = useMemo(() => {
    const fallbackSections = [
      '1IT-A', '1IT-B', '1IT-C', '1IT-D', '1IT-E',
      '2IT-A', '2IT-B', '2IT-C', '2IT-D', '2IT-E',
      '3IT-A', '3IT-B', '3IT-C', '3IT-D', '3IT-E',
      '4IT-A', '4IT-B', '4IT-C', '4IT-D', '4IT-E',
      '1CS-A', '1CS-B', '1CS-C', '1CS-D', '1CS-E',
      '2CS-A', '2CS-B', '2CS-C', '2CS-D', '2CS-E',
      '3CS-A', '3CS-B', '3CS-C', '3CS-D', '3CS-E',
      '4CS-A', '4CS-B', '4CS-C', '4CS-D', '4CS-E',
    ];

    const uniqueSections = new Set<string>();
    (students || []).forEach((student) => {
      const section = String(student.section ?? '').trim();
      if (section) uniqueSections.add(section);
    });

    return Array.from(new Set([...uniqueSections, ...fallbackSections]));
  }, [students]);

  // Parse section to extract year level and department
  const parseSectionInfo = (section: string) => {
    const match = section.match(/^(\d+)([A-Z]+)-([A-Z]+)$/);
    if (match) {
      return {
        year: match[1],
        department: match[2],
        sectionLetter: match[3],
      };
    }
    return null;
  };

  // Get unique departments from sections
  const departmentOptions = useMemo(() => {
    const departments = new Set<string>();
    sectionOptions.forEach((section) => {
      const info = parseSectionInfo(section);
      if (info) {
        departments.add(info.department);
      }
    });
    return Array.from(departments).sort();
  }, [sectionOptions]);

  // Get unique year levels from sections
  const yearLevelOptions = useMemo(() => {
    const years = new Set<string>();
    sectionOptions.forEach((section) => {
      const info = parseSectionInfo(section);
      if (info) {
        years.add(info.year);
      }
    });
    return Array.from(years).sort();
  }, [sectionOptions]);

  // Filter sections based on selected department and year level
  const filteredSectionOptions = useMemo(() => {
    if (!formData.department && !formData.yearLevel) {
      return sectionOptions;
    }

    return sectionOptions.filter((section) => {
      const info = parseSectionInfo(section);
      if (!info) return false;

      if (formData.department && info.department !== formData.department) {
        return false;
      }

      if (formData.yearLevel && info.year !== formData.yearLevel) {
        return false;
      }

      return true;
    });
  }, [sectionOptions, formData.department, formData.yearLevel]);

  const getCourseLabel = (schedule: Schedule) => {
    const subjectId = schedule.subject_id || schedule.subjectId || schedule.course_id || schedule.courseId;
    if (!subjectId) return '-';
    const subject = subjectById.get(String(subjectId));
    if (!subject) return String(subjectId);
    return subject.code ? `${subject.code}${subject.name ? ` - ${subject.name}` : ''}` : subject.name || String(subjectId);
  };

  const getTimeLabel = (schedule: Schedule) => {
    const start = schedule.start_time || schedule.startTime;
    const end = schedule.end_time || schedule.endTime;
    return start && end ? `${start} - ${end}` : '-';
  };

  const getCourseOptionLabel = (course: Subject) => {
    if (course.code && course.name) return `${course.code} - ${course.name}`;
    return course.code || course.name || String(course.id);
  };

  const updateField = <K extends keyof ScheduleFormData>(field: K, value: ScheduleFormData[K]) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setFormErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const validateForm = (data: ScheduleFormData): ScheduleFormErrors => {
    const errors: ScheduleFormErrors = {};

    if (!data.courseId.trim()) errors.courseId = 'Course or subject is required.';
    if (!data.department.trim()) errors.department = 'Department is required.';
    if (!data.yearLevel.trim()) errors.yearLevel = 'Year level is required.';
    if (!data.section.trim()) errors.section = 'Section is required.';
    if (!data.day.trim()) errors.day = 'Day is required.';
    if (!data.startTime.trim()) errors.startTime = 'Start time is required.';
    if (!data.endTime.trim()) errors.endTime = 'End time is required.';
    if (!data.room.trim()) errors.room = 'Room is required.';

    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      errors.endTime = 'End time must be later than start time.';
    }

    return errors;
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      day: '',
      startTime: '',
      endTime: '',
      room: '',
      department: '',
      yearLevel: '',
      section: '',
    });
    setFormErrors({});
  };

  const handleCreateSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setToast({ type: 'error', message: 'Please fix the highlighted fields before submitting.' });
      return;
    }

    const selectedSubject = subjectById.get(String(formData.courseId));
    const assignedFacultyId = String(selectedSubject?.facultyId ?? selectedSubject?.faculty_id ?? '').trim();

    const payload: Record<string, any> = {
      course_id: formData.courseId,
      courseId: formData.courseId,
      subject_id: formData.courseId,
      subjectId: formData.courseId,
      day: formData.day,
      start_time: formData.startTime,
      end_time: formData.endTime,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
      section: formData.section || undefined,
      // Store subject info for easier lookup
      subjectCode: selectedSubject?.code || '',
      subjectName: selectedSubject?.name || '',
    };

    if (!assignedFacultyId) {
      setToast({ type: 'error', message: 'Assign a faculty in Subjects & Curriculum before creating this schedule.' });
      setSubmitting(false);
      return;
    }

    payload.faculty_id = assignedFacultyId;
    payload.facultyId = assignedFacultyId;

    try {
      setSubmitting(true);
      const createdScheduleId = await schedulesDB.addSchedule(payload);

      if (formData.section && createdScheduleId) {
        const selectedSection = formData.section.trim().toLowerCase();
        const matchingStudents = (students || []).filter((student) => {
          const studentSection = String(student.section ?? '').trim().toLowerCase();
          return studentSection === selectedSection;
        });

        await Promise.all(
          matchingStudents.map(async (student) => {
            try {
              const studentRecord = (await studentDB.getStudent(String(student.id))) as Record<string, any> | null;
              const currentEnrolled = [
                ...((studentRecord?.enrolled_classes as string[] | undefined) ?? []),
                ...((studentRecord?.enrolledClasses as string[] | undefined) ?? []),
              ]
                .map((value) => String(value ?? '').trim())
                .filter(Boolean);

              const nextEnrolled = Array.from(new Set([...currentEnrolled, String(createdScheduleId)]));

              await studentDB.updateStudent(String(student.id), {
                enrolled_classes: nextEnrolled,
                enrolledClasses: nextEnrolled,
              });
            } catch {
              // Section enrollment sync is best-effort.
            }
          })
        );
      }

      setToast({ type: 'success', message: 'Schedule created successfully.' });
      resetForm();
      await fetchSchedules();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create schedule.';
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const facultySchedules = useMemo(() => {
    return (schedules || []).filter((schedule) => !!(schedule.faculty_id || schedule.facultyId));
  }, [schedules]);

  const studentSchedules = useMemo(() => {
    return (schedules || []).filter(
      (schedule) =>
        !!(schedule.student_id || schedule.studentId) ||
        (Array.isArray(schedule.student_ids) && schedule.student_ids.length > 0) ||
        (Array.isArray(schedule.students) && schedule.students.length > 0)
    );
  }, [schedules]);

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`min-w-[280px] max-w-sm rounded-lg px-4 py-3 shadow-lg text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-2">Scheduling Management</h1>
      <p className="text-gray-600 mb-8">Assign faculty to subjects, sections, and meeting times while keeping weekly load under 21 hours.</p>

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load schedules from backend." />}

      <Card title="Create Schedule" className="mb-6">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(event) => updateField('department', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.department ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select department</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {formErrors.department && <p className="text-red-600 text-xs mt-1">{formErrors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
              <select
                value={formData.yearLevel}
                onChange={(event) => updateField('yearLevel', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.yearLevel ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select year level</option>
                {yearLevelOptions.map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
              {formErrors.yearLevel && <p className="text-red-600 text-xs mt-1">{formErrors.yearLevel}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course / Subject</label>
              <select
                value={formData.courseId}
                onChange={(event) => updateField('courseId', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.courseId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select course / subject</option>
                {(subjects || []).map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {getCourseOptionLabel(course)}
                  </option>
                ))}
              </select>
              {formErrors.courseId && <p className="text-red-600 text-xs mt-1">{formErrors.courseId}</p>}
              {formData.courseId && (
                <p className="mt-2 text-xs text-gray-500">
                  Faculty assigned: {
                    (() => {
                      const selectedSubject = subjectById.get(String(formData.courseId));
                      const assignedFacultyId = String(selectedSubject?.facultyId ?? selectedSubject?.faculty_id ?? '').trim();
                      return assignedFacultyId ? (facultyById.get(assignedFacultyId)?.name || assignedFacultyId) : 'No faculty assigned yet';
                    })()
                  }
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={formData.day}
                onChange={(event) => updateField('day', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.day ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
              {formErrors.day && <p className="text-red-600 text-xs mt-1">{formErrors.day}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(event) => updateField('room', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.room ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Room 301"
                required
              />
              {formErrors.room && <p className="text-red-600 text-xs mt-1">{formErrors.room}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(event) => updateField('startTime', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.startTime && <p className="text-red-600 text-xs mt-1">{formErrors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(event) => updateField('endTime', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.endTime && <p className="text-red-600 text-xs mt-1">{formErrors.endTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={formData.section}
                onChange={(event) => updateField('section', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.section ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={!formData.department || !formData.yearLevel}
              >
                <option value="">Select section</option>
                {(() => {
                  const selectedSubject = subjectById.get(String(formData.courseId));
                  const subjectSections = selectedSubject?.sections || [];
                  // Show subject-specific sections if available, otherwise show filtered sections
                  const options = subjectSections.length > 0 ? subjectSections : filteredSectionOptions;
                  return options.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ));
                })()}
              </select>
              {formErrors.section && <p className="text-red-600 text-xs mt-1">{formErrors.section}</p>}
              {!formData.department || !formData.yearLevel ? (
                <p className="text-xs text-amber-600 mt-1">
                  Please select department and year level first
                </p>
              ) : (
                <>
                  {formData.courseId && (() => {
                    const selectedSubject = subjectById.get(String(formData.courseId));
                    const subjectSections = selectedSubject?.sections || [];
                    return subjectSections.length > 0 ? (
                      <p className="text-xs text-green-600 mt-1">
                        Using pre-assigned sections for this subject
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">
                        Showing sections for {formData.department} Year {formData.yearLevel}
                      </p>
                    );
                  })()}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(event) => updateField('room', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.room ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Room 301"
                required
              />
              {formErrors.room && <p className="text-red-600 text-xs mt-1">{formErrors.room}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              {submitting ? 'Creating...' : 'Create Schedule'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium"
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      <Card title="Faculty Schedule Details">
        {!facultySchedules || facultySchedules.length === 0 ? (
          <EmptyState
            icon="Calendar"
            title="No faculty schedules found"
            description="No faculty schedule records are available from the backend."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-gray-500 text-xs uppercase">
                  <th className="text-left p-4">Faculty</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Course / Subject</th>
                  <th className="text-left p-4">Section</th>
                  <th className="text-left p-4">Day</th>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Room</th>
                </tr>
              </thead>
              <tbody>
                {facultySchedules.map((schedule) => {
                  const facultyId = String(schedule.faculty_id || schedule.facultyId || '');
                  const faculty = facultyById.get(facultyId);
                  return (
                    <tr key={`faculty-${schedule.id}`} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{faculty?.name || facultyId || '-'}</td>
                      <td className="p-4">{faculty?.email || '-'}</td>
                      <td className="p-4">{faculty?.department || '-'}</td>
                      <td className="p-4">{getCourseLabel(schedule)}</td>
                      <td className="p-4">{schedule.section || '-'}</td>
                      <td className="p-4">{schedule.day || '-'}</td>
                      <td className="p-4">{getTimeLabel(schedule)}</td>
                      <td className="p-4">{schedule.room || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Student Schedule Details" className="mt-6">
        {!studentSchedules || studentSchedules.length === 0 ? (
          <EmptyState
            icon="Calendar"
            title="No student schedules found"
            description="No student schedule records are available from the backend."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-gray-500 text-xs uppercase">
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">ID Number</th>
                  <th className="text-left p-4">Program / Year</th>
                  <th className="text-left p-4">Faculty</th>
                  <th className="text-left p-4">Course / Subject</th>
                  <th className="text-left p-4">Day</th>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Room</th>
                </tr>
              </thead>
              <tbody>
                {studentSchedules.map((schedule) => {
                  const primaryStudentId = String(
                    schedule.student_id ||
                      schedule.studentId ||
                      (Array.isArray(schedule.student_ids) && schedule.student_ids[0]) ||
                      (Array.isArray(schedule.students) && schedule.students[0]) ||
                      ''
                  );
                  const student = studentById.get(primaryStudentId);
                  const facultyId = String(schedule.faculty_id || schedule.facultyId || '');
                  const faculty = facultyById.get(facultyId);

                  return (
                    <tr key={`student-${schedule.id}`} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{student?.name || primaryStudentId || '-'}</td>
                      <td className="p-4">{student?.idNumber || '-'}</td>
                      <td className="p-4">{student ? `${student.program || '-'} / ${student.year || '-'}` : '-'}</td>
                      <td className="p-4">{faculty?.name || facultyId || '-'}</td>
                      <td className="p-4">{getCourseLabel(schedule)}</td>
                      <td className="p-4">{schedule.day || '-'}</td>
                      <td className="p-4">{getTimeLabel(schedule)}</td>
                      <td className="p-4">{schedule.room || '-'}</td>
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
