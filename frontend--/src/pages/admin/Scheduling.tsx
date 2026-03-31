import React, { useEffect, useMemo } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { schedulesDB, facultyDB, studentDB, coursesDB } from '../../lib/database';
import { Card, EmptyState, ErrorMessage, LoadingSpinner } from '../../components/ui/shared';

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
  year?: string;
  program?: string;
}

interface Course {
  id: string | number;
  name?: string;
  code?: string;
}

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
  const { data: courses, execute: fetchCourses } = useAsync<Course[]>(() =>
    coursesDB.getAllCourses().then((data: any) => data as Course[])
  );

  useEffect(() => {
    fetchSchedules();
    fetchFaculties();
    fetchStudents();
    fetchCourses();
  }, [fetchSchedules, fetchFaculties, fetchStudents, fetchCourses]);

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

  const courseById = useMemo(() => {
    const map = new Map<string, Course>();
    (courses || []).forEach((c) => map.set(String(c.id), c));
    return map;
  }, [courses]);

  const getCourseLabel = (schedule: Schedule) => {
    const subjectId = schedule.subject_id || schedule.subjectId || schedule.course_id || schedule.courseId;
    if (!subjectId) return '-';
    const course = courseById.get(String(subjectId));
    if (!course) return String(subjectId);
    return course.code ? `${course.code}${course.name ? ` - ${course.name}` : ''}` : course.name || String(subjectId);
  };

  const getTimeLabel = (schedule: Schedule) => {
    const start = schedule.start_time || schedule.startTime;
    const end = schedule.end_time || schedule.endTime;
    return start && end ? `${start} - ${end}` : '-';
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
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Scheduling Management</h1>
      <p className="text-gray-600 mb-8">View complete faculty and student schedule details</p>

      {loading && <LoadingSpinner fullScreen={false} />}
      {error && <ErrorMessage message="Failed to load schedules from backend." />}

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
