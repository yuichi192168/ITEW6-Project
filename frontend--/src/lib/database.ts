export type DocumentData = Record<string, any>;

import { getApiBase } from './api-base';
import { db } from './firebase';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const API_BASE = getApiBase();

const requireDb = () => {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  return db;
};

const formatScheduleTime = (schedule: Record<string, any>) => {
  const day = String(schedule.day || '').trim();
  const start = String(schedule.start_time || schedule.startTime || '').trim();
  const end = String(schedule.end_time || schedule.endTime || '').trim();
  const time = String(schedule.time || '').trim();

  if (time) return time;
  if (day && start && end) return `${day} ${start} - ${end}`;
  if (day) return day;
  return '';
};

const normalizeScheduleClass = async (scheduleDoc: any) => {
  const schedule = {
    id: scheduleDoc.id,
    ...scheduleDoc.data(),
  } as Record<string, any>;

  return {
    id: String(schedule.id),
    classId: String(schedule.id),
    courseCode: schedule.courseCode || schedule.subjectCode || schedule.code || '',
    courseName: schedule.courseName || schedule.subjectName || schedule.name || '',
    section: schedule.section || '',
    semester: schedule.semester || schedule.term || '',
    yearLevel: schedule.yearLevel || schedule.year_level || '',
    schedule: formatScheduleTime(schedule),
    room: schedule.room || '',
    units: Number(schedule.units || schedule.credits || 3),
    type: schedule.type || '',
    materials: Array.isArray(schedule.materials) ? schedule.materials : [],
    quizzes: Array.isArray(schedule.quizzes) ? schedule.quizzes : [],
    exams: Array.isArray(schedule.exams) ? schedule.exams : [],
    activities: Array.isArray(schedule.activities) ? schedule.activities : [],
    facultyId: schedule.faculty_id || schedule.facultyId || '',
    faculty: schedule.facultyName || schedule.faculty || '',
    description: schedule.description || '',
  };
};

const normalizeEventRecord = (eventDoc: any) => {
  const event = {
    id: eventDoc.id,
    ...eventDoc.data(),
  } as Record<string, any>;

  const invitedStudents = Array.isArray(event.invited_students)
    ? event.invited_students
    : Array.isArray(event.invitedStudents)
      ? event.invitedStudents
      : [];

  const attendees = Array.isArray(event.attendees)
    ? event.attendees
    : Array.isArray(event.faculties)
      ? event.faculties
      : Array.isArray(event.registeredFacultyIds)
        ? event.registeredFacultyIds
        : [];

  return {
    ...event,
    invited_students: invitedStudents,
    invitedStudents,
    attendees,
    isRegistered: false,
  };
};

const normalizeResearchRecord = (researchDoc: any) => {
  const research = {
    id: researchDoc.id,
    ...researchDoc.data(),
  } as Record<string, any>;

  const panelMembers = Array.isArray(research.panelMembers)
    ? research.panelMembers
    : Array.isArray(research.panel_members)
      ? research.panel_members
      : [];

  const advisers = Array.isArray(research.advisers)
    ? research.advisers
    : Array.isArray(research.adviser)
      ? [research.adviser]
      : [];

  const students = Array.isArray(research.students)
    ? research.students
    : Array.isArray(research.student_ids)
      ? research.student_ids
      : [];

  return {
    ...research,
    panelMembers,
    panel_members: panelMembers,
    advisers,
    students,
    studentCount: Number(research.studentCount ?? students.length ?? 0),
  };
};

const normalizeSyllabusRecord = (syllabusDoc: any) => {
  const syllabus = {
    id: syllabusDoc.id,
    ...syllabusDoc.data(),
  } as Record<string, any>;

  return {
    ...syllabus,
    status: syllabus.status || syllabus.status || 'draft',
    updatedAt: syllabus.updatedAt || syllabus.updated_at || null,
    updated_at: syllabus.updated_at || syllabus.updatedAt || null,
  };
};

const buildStudentSchedulePayload = async (studentId: string) => {
  const firestoreDb = requireDb();
  const studentSnapshot = await getDoc(doc(firestoreDb, 'students', studentId));

  if (!studentSnapshot.exists()) {
    return null;
  }

  const student = { id: studentSnapshot.id, ...studentSnapshot.data() } as Record<string, any>;
  const enrolledClassIds = Array.isArray(student.enrolled_classes)
    ? student.enrolled_classes.map((classId: any) => String(classId))
    : [];

  const enrolledClasses = await Promise.all(
    enrolledClassIds.map(async (classId) => {
      const scheduleSnapshot = await getDoc(doc(firestoreDb, 'schedules', classId));
      if (!scheduleSnapshot.exists()) return null;
      return normalizeScheduleClass(scheduleSnapshot);
    })
  );

  const filtered = enrolledClasses.filter(Boolean) as Array<Record<string, any>>;

  return {
    studentId,
    enrolledClasses: filtered,
    totalCourses: filtered.length,
  };
};

const buildScheduleDetails = async (studentId: string, classId: string) => {
  const firestoreDb = requireDb();
  const studentSnapshot = await getDoc(doc(firestoreDb, 'students', studentId));
  if (!studentSnapshot.exists()) return null;

  const scheduleSnapshot = await getDoc(doc(firestoreDb, 'schedules', classId));
  if (!scheduleSnapshot.exists()) return null;

  const schedule = await normalizeScheduleClass(scheduleSnapshot);
  const scheduleData = { id: scheduleSnapshot.id, ...scheduleSnapshot.data() } as Record<string, any>;

  return {
    ...schedule,
    description: scheduleData.description || '',
    faculty: scheduleData.facultyName || scheduleData.faculty || '',
    materials: Array.isArray(scheduleData.materials) ? scheduleData.materials : [],
    assessments: {
      quizzes: Array.isArray(scheduleData.quizzes) ? scheduleData.quizzes : [],
      exams: Array.isArray(scheduleData.exams) ? scheduleData.exams : [],
      activities: Array.isArray(scheduleData.activities) ? scheduleData.activities : [],
    },
  };
};

const buildQueryString = (params?: Record<string, any>) => {
  if (!params || Object.keys(params).length === 0) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const apiRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const normalizeCollection = (collectionName: string) => {
  if (collectionName === 'disciplineRecords') return 'discipline-records';
  return collectionName;
};

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    return await apiRequest<T>(`/admin/${normalizeCollection(collectionName)}/${docId}`);
  } catch {
    return null;
  }
};

export const getCollection = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  return apiRequest<T[]>(`/admin/${normalizeCollection(collectionName)}`);
};

export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const created = await apiRequest<{ id: string }>(`/admin/${normalizeCollection(collectionName)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return String(created.id);
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  await apiRequest(`/admin/${normalizeCollection(collectionName)}/${docId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  await apiRequest(`/admin/${normalizeCollection(collectionName)}/${docId}`, {
    method: 'DELETE',
  });
};

export const queryCollection = async <T extends DocumentData>(
  collectionName: string,
  conditions: Array<[string, string, any]>
): Promise<T[]> => {
  const filters: Record<string, any> = {};
  conditions.forEach(([field, operator, value]) => {
    if (operator === '==') {
      filters[field] = value;
    }
  });

  const queryString = buildQueryString(filters);
  return apiRequest<T[]>(`/admin/${normalizeCollection(collectionName)}${queryString}`);
};

export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  await updateDocument(collectionName, docId, data);
};

export const updateDocumentFields = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  await updateDocument(collectionName, docId, data);
};

export const deleteDocumentOld = async (
  collectionName: string,
  docId: string
): Promise<void> => deleteDocument(collectionName, docId);

export const addDocumentOld = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => addDocument(collectionName, data);

export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: DocumentData;
  }>
): Promise<void> => {
  for (const operation of operations) {
    if (operation.type === 'delete') {
      await deleteDocument(operation.collection, operation.docId);
    } else {
      await updateDocument(operation.collection, operation.docId, operation.data || {});
    }
  }
};

export const studentDB = {
  getStudent: async (studentId: string) => {
    const firestoreDb = requireDb();
    const studentSnapshot = await getDoc(doc(firestoreDb, 'students', studentId));
    if (!studentSnapshot.exists()) return null;
    return { id: studentSnapshot.id, ...(studentSnapshot.data() as Record<string, any>) } as any;
  },
  getAllStudents: async () => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'students'));
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
  },
  getStudentGrades: async (studentId: string, term = 'all') => {
    const firestoreDb = requireDb();
    const [gradesSnapshot, scheduleSnapshot, courseSnapshot] = await Promise.all([
      getDocs(collection(firestoreDb, 'grades')),
      getDocs(collection(firestoreDb, 'schedules')),
      getDocs(collection(firestoreDb, 'courses')),
    ]);

    const allSchedules = scheduleSnapshot.docs.map((scheduleDoc) => ({
      id: scheduleDoc.id,
      ...scheduleDoc.data(),
    }) as Record<string, any>);

    const allCourses = courseSnapshot.docs.map((courseDoc) => ({
      id: courseDoc.id,
      ...courseDoc.data(),
    }) as Record<string, any>);

    const studentGrades = gradesSnapshot.docs
      .map((gradeDoc) => ({ id: gradeDoc.id, ...gradeDoc.data() } as Record<string, any>))
      .filter((grade) =>
        String(grade.studentId || grade.student_id || '').trim() === String(studentId).trim()
      );

    const gradesWithCourseInfo = studentGrades.map((grade) => {
      const classId = String(grade.classId || grade.class_id || '');
      const schedule = allSchedules.find((s) => String(s.id) === classId);
      const courseId = String(schedule?.course_id || schedule?.courseId || '');
      const course = allCourses.find((c) => String(c.id) === courseId);
      const attendance = Number(grade.attendance ?? 0);
      const activity = Number(grade.activity ?? 0);
      const exam = Number(grade.exam ?? 0);
      const totalGrade = Math.round((attendance * 0.1 + activity * 0.4 + exam * 0.5) * 100) / 100;

      return {
        gradeId: String(grade.id),
        classId,
        courseCode: course?.code || schedule?.courseCode || schedule?.subjectCode || 'Unknown',
        courseName: course?.name || schedule?.courseName || schedule?.subjectName || 'Unknown',
        term: schedule?.term || schedule?.semester || 'N/A',
        attendance,
        activity,
        exam,
        totalGrade,
      };
    });

    const filteredGrades =
      term !== 'all'
        ? gradesWithCourseInfo.filter((grade) => String(grade.term) === String(term))
        : gradesWithCourseInfo;

    const totalGrades = filteredGrades.reduce((sum, grade) => sum + grade.totalGrade, 0);
    const gwa = filteredGrades.length > 0 ? Math.round((totalGrades / filteredGrades.length) * 100) / 100 : 0;

    return {
      studentId,
      grades: filteredGrades,
      gwa,
      totalCourses: filteredGrades.length,
    };
  },
  getStudentEvents: async (studentId: string) => {
    const firestoreDb = requireDb();
    const [studentSnapshot, eventsSnapshot] = await Promise.all([
      getDoc(doc(firestoreDb, 'students', studentId)),
      getDocs(collection(firestoreDb, 'events')),
    ]);

    if (!studentSnapshot.exists()) {
      return [];
    }

    const student = { id: studentSnapshot.id, ...studentSnapshot.data() } as Record<string, any>;
    const registeredEvents = Array.isArray(student.registered_events)
      ? student.registered_events
      : Array.isArray(student.registeredEvents)
      ? student.registeredEvents
      : [];

    return eventsSnapshot.docs.map((eventDoc) => {
      const event = normalizeEventRecord(eventDoc);
      return {
        ...event,
        date: event.date || '',
        time: event.time || event.startTime || event.start_time || '',
        location: event.location || '',
        type: event.type || '',
        description: event.description || '',
        isRegistered: registeredEvents.includes(event.id),
      };
    });
  },
  registerStudentEvent: async (studentId: string, eventId: string) => {
    const firestoreDb = requireDb();
    const studentRef = doc(firestoreDb, 'students', studentId);
    const studentSnapshot = await getDoc(studentRef);

    if (!studentSnapshot.exists()) {
      throw new Error('Student not found');
    }

    await updateDoc(studentRef, {
      registered_events: arrayUnion(eventId),
      registeredEvents: arrayUnion(eventId),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { studentId, eventId };
  },
  getStudentResearch: async (studentId: string) => {
    const firestoreDb = requireDb();
    const researchSnapshot = await getDocs(collection(firestoreDb, 'research'));

    return researchSnapshot.docs
      .map(normalizeResearchRecord)
      .filter((research) => {
        const students = Array.isArray(research.students) ? research.students : [];
        return students.some((recordStudentId) =>
          String(recordStudentId || '').trim() === String(studentId).trim()
        );
      });
  },
  addStudent: async (data: any) => {
    if (data?.id) {
      await updateDocument('students', String(data.id), data);
      return String(data.id);
    }
    return addDocument('students', data);
  },
  updateStudent: (studentId: string, data: any) => updateDocument('students', studentId, data),
  deleteStudent: (studentId: string) => deleteDocument('students', studentId),
  getDisciplineRecords: async (params?: { studentId?: string; email?: string }) => {
    const firestoreDb = requireDb();
    let recordsQuery = query(collection(firestoreDb, 'disciplineRecords'));

    if (params?.studentId) {
      recordsQuery = query(recordsQuery, where('studentId', '==', params.studentId));
    }

    if (params?.email) {
      recordsQuery = query(recordsQuery, where('email', '==', params.email));
    }

    const snapshot = await getDocs(recordsQuery);
    return snapshot.docs.map((recordDoc) => ({
      id: recordDoc.id,
      ...recordDoc.data(),
    }));
  },
};

export const facultyDB = {
  getFaculty: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const facultySnapshot = await getDoc(doc(firestoreDb, 'faculties', facultyId));
    if (!facultySnapshot.exists()) return null;
    return { id: facultySnapshot.id, ...(facultySnapshot.data() as Record<string, any>) } as any;
  },
  getAllFaculty: async () => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'faculties'));
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
  },
  addFaculty: async (data: any) => {
    if (data?.id) {
      await updateDocument('faculties', String(data.id), data);
      return String(data.id);
    }
    return addDocument('faculties', data);
  },
  updateFaculty: (facultyId: string, data: any) => updateDocument('faculties', facultyId, data),
  deleteFaculty: (facultyId: string) => deleteDocument('faculties', facultyId),
  assignSubject: async (facultyId: string, subject: string) =>
    apiRequest(`/admin/faculty/${facultyId}/assign-subject`, {
      method: 'PUT',
      body: JSON.stringify({ subject }),
    }),
  assignEvent: async (facultyId: string, eventId: string) =>
    apiRequest(`/admin/faculty/${facultyId}/assign-event`, {
      method: 'PUT',
      body: JSON.stringify({ event_id: eventId }),
    }),
  messageStudent: async (payload: any) =>
    apiRequest(`/admin/faculty/message-student`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFacultyEvents: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'events'));

    return snapshot.docs
      .map(normalizeEventRecord)
      .map((event) => ({
        ...event,
        isRegistered: Array.isArray(event.attendees)
          ? event.attendees.some((id: any) => String(id) === String(facultyId))
          : false,
      }))
      .filter((event) => {
        const eventFacultyIds = Array.isArray(event.attendees)
          ? event.attendees
          : [];

        return (
          String(event.facultyId || event.faculty_id || '') === String(facultyId) ||
          eventFacultyIds.some((id: any) => String(id) === String(facultyId))
        );
      });
  },
  joinEvent: async (facultyId: string, eventId: string) => {
    const firestoreDb = requireDb();
    const eventRef = doc(firestoreDb, 'events', eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventSnapshot.data() as Record<string, any>;
    const attendees = Array.isArray(eventData.attendees)
      ? eventData.attendees
      : Array.isArray(eventData.faculties)
        ? eventData.faculties
        : [];

    if (!attendees.some((id) => String(id) === String(facultyId))) {
      await updateDoc(eventRef, {
        attendees: arrayUnion(facultyId),
        faculties: arrayUnion(facultyId),
        registeredFacultyIds: arrayUnion(facultyId),
        registered_faculty_ids: arrayUnion(facultyId),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const event = normalizeEventRecord(await getDoc(eventRef));
    return {
      ...event,
      isRegistered: Array.isArray(event.attendees)
        ? event.attendees.some((id: any) => String(id) === String(facultyId))
        : false,
    };
  },
  inviteStudentsToEvent: async (facultyId: string, eventId: string, studentIds: string[]) => {
    const firestoreDb = requireDb();
    const eventRef = doc(firestoreDb, 'events', eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventSnapshot.data() as Record<string, any>;
    const invitedStudents = Array.isArray(eventData.invited_students)
      ? eventData.invited_students
      : Array.isArray(eventData.invitedStudents)
        ? eventData.invitedStudents
        : [];

    const nextInvited = Array.from(new Set([...invitedStudents, ...studentIds.map(String)]));

    await updateDoc(eventRef, {
      invited_students: nextInvited,
      invitedStudents: nextInvited,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const event = normalizeEventRecord(await getDoc(eventRef));
    return {
      ...event,
      isRegistered: Array.isArray(event.attendees)
        ? event.attendees.some((id: any) => String(id) === String(facultyId))
        : false,
    };
  },
  getClassStudents: async (classId: string) => {
    const firestoreDb = requireDb();
    try {
      const studentsQuery = query(
        collection(firestoreDb, 'students'),
        where('enrolled_classes', 'array-contains', classId)
      );
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map((studentDoc) => {
        const student = { id: studentDoc.id, ...studentDoc.data() } as Record<string, any>;
        return {
          id: student.id,
          name: student.name || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.email || student.id,
          email: student.email || '',
          yearLevel: student.yearLevel || student.year_level || '',
          department: student.department || '',
        };
      });
    } catch {
      const snapshot = await getDocs(collection(firestoreDb, 'students'));
      return snapshot.docs
        .map((studentDoc) => ({ id: studentDoc.id, ...studentDoc.data() } as Record<string, any>))
        .filter((student) => Array.isArray(student.enrolled_classes) && student.enrolled_classes.includes(classId))
        .map((student) => ({
          id: student.id,
          name: student.name || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.email || student.id,
          email: student.email || '',
          yearLevel: student.yearLevel || student.year_level || '',
          department: student.department || '',
        }));
    }
  },
  getFacultyGradeEntry: async (facultyId: string, classId: string) => {
    const firestoreDb = requireDb();
    const scheduleRef = doc(firestoreDb, 'schedules', classId);
    const scheduleSnapshot = await getDoc(scheduleRef);
    if (!scheduleSnapshot.exists()) return null;

    const scheduleData = scheduleSnapshot.data() as Record<string, any>;
    if (String(scheduleData.faculty_id || scheduleData.facultyId || '') !== String(facultyId)) {
      return null;
    }

    const classSchedule = await normalizeScheduleClass(scheduleSnapshot);
    const studentSnapshot = await getDocs(
      query(collection(firestoreDb, 'students'), where('enrolled_classes', 'array-contains', classId))
    );
    const allGradesSnapshot = await getDocs(collection(firestoreDb, 'grades'));
    const allGrades = allGradesSnapshot.docs.map((gradeDoc) => ({
      id: gradeDoc.id,
      ...gradeDoc.data(),
    }) as Record<string, any>);

    const studentGrades = studentSnapshot.docs.map((studentDoc) => {
      const student = { id: studentDoc.id, ...studentDoc.data() } as Record<string, any>;
      const studentGradeRecords = allGrades.filter(
        (grade) =>
          String(grade.studentId || grade.student_id || '') === String(student.id) &&
          String(grade.classId || grade.class_id || '') === String(classId)
      );

      const gradeData = studentGradeRecords.reduce(
        (acc, grade) => {
          acc.attendance = acc.attendance || Number(grade.attendance || 0);
          acc.activity = acc.activity || Number(grade.activity || 0);
          acc.exam = acc.exam || Number(grade.exam || 0);
          return acc;
        },
        { attendance: 0, activity: 0, exam: 0 }
      );

      const totalGrade = gradeData.attendance * 0.1 + gradeData.activity * 0.4 + gradeData.exam * 0.5;
      return {
        studentId: student.id,
        studentName: student.name || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.email || student.id,
        email: student.email || '',
        yearLevel: student.yearLevel || student.year_level || '',
        department: student.department || '',
        attendance: gradeData.attendance,
        activity: gradeData.activity,
        exam: gradeData.exam,
        totalGrade: Math.round(totalGrade * 100) / 100,
      };
    });

    return {
      classId,
      classSchedule,
      studentGrades,
    };
  },
  saveFacultyClassGrades: async (facultyId: string, classId: string, gradesData: any[]) => {
    const firestoreDb = requireDb();
    const gradeCollection = collection(firestoreDb, 'grades');
    const gradeSnapshot = await getDocs(gradeCollection);
    const existingGrades = gradeSnapshot.docs.map((gradeDoc) => ({
      id: gradeDoc.id,
      ...gradeDoc.data(),
    }) as Record<string, any>);

    const now = new Date().toISOString();
    const updatedGrades = [] as Record<string, any>[];

    for (const gradeEntry of gradesData) {
      const existingGrade = existingGrades.find(
        (grade) =>
          String(grade.studentId || grade.student_id || '') === String(gradeEntry.studentId) &&
          String(grade.classId || grade.class_id || '') === String(classId)
      );

      const gradeRef = existingGrade
        ? doc(firestoreDb, 'grades', existingGrade.id)
        : doc(gradeCollection);

      const record = {
        id: existingGrade?.id || gradeRef.id,
        studentId: gradeEntry.studentId,
        student_id: gradeEntry.studentId,
        classId,
        class_id: classId,
        attendance: gradeEntry.attendance ?? 0,
        activity: gradeEntry.activity ?? 0,
        exam: gradeEntry.exam ?? 0,
        updatedAt: now,
        updated_at: now,
      };

      await setDoc(gradeRef, record);
      updatedGrades.push(record);
    }

    return updatedGrades;
  },
  getFacultyTeachingLoad: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const scheduleSnapshot = await getDocs(collection(firestoreDb, 'schedules'));
    const courseSnapshot = await getDocs(collection(firestoreDb, 'courses'));

    const allCourses = courseSnapshot.docs.map((courseDoc) => ({ id: courseDoc.id, ...courseDoc.data() } as Record<string, any>));

    const facultyClasses = scheduleSnapshot.docs
      .map((scheduleDoc) => ({ id: scheduleDoc.id, ...scheduleDoc.data() } as Record<string, any>))
      .filter((schedule) => String(schedule.faculty_id || schedule.facultyId || '') === String(facultyId));

    let totalLectureHours = 0;
    let totalLabHours = 0;
    let totalTeachingHours = 0;
    let totalStudents = 0;

    const classes = facultyClasses.map((cls) => {
      const course = allCourses.find((course) => String(course.id) === String(cls.course_id || cls.courseId));
      const classType = String(cls.type || course?.type || 'lecture').toLowerCase();
      const units = Number(cls.units ?? course?.units ?? 3);

      let lectureHours = 0;
      let labHours = 0;
      if (classType === 'lecture-only') {
        lectureHours = 3;
      } else if (classType === 'lecture-lab') {
        lectureHours = 2;
        labHours = 3;
      } else if (classType === 'lab-only') {
        labHours = 3;
      } else {
        lectureHours = 3;
      }

      totalLectureHours += lectureHours;
      totalLabHours += labHours;
      totalTeachingHours += lectureHours + labHours;
      totalStudents += Number(cls.students ?? 0);

      return {
        id: cls.id,
        code: course?.code ?? cls.code ?? cls.courseCode ?? cls.subjectCode ?? '',
        name: course?.name ?? cls.name ?? cls.courseName ?? cls.subjectName ?? '',
        section: cls.section || '',
        type: classType,
        units,
        lectureHours,
        labHours,
        totalHours: lectureHours + labHours,
        students: Number(cls.students ?? 0),
      };
    });

    return {
      facultyId,
      classes,
      totalClasses: classes.length,
      totalStudents,
      totalLectureHours,
      totalLabHours,
      totalTeachingHours,
    };
  },
  getFacultyResearch: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const [researchSnapshot, studentSnapshot] = await Promise.all([
      getDocs(collection(firestoreDb, 'research')),
      getDocs(collection(firestoreDb, 'students')),
    ]);

    const allStudents = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return researchSnapshot.docs
      .map(normalizeResearchRecord)
      .filter((research) => {
        const panelMembers = Array.isArray(research.panelMembers)
          ? research.panelMembers
          : [];
        const advisers = Array.isArray(research.advisers)
          ? research.advisers
          : [];

        return (
          panelMembers.some((id: any) => String(id) === String(facultyId)) ||
          advisers.some((id: any) => String(id) === String(facultyId))
        );
      })
      .map((research) => {
        const studentIds = Array.isArray(research.students) ? research.students : [];
        const researchStudents = studentIds.map((studentId: any) => {
          const student = allStudents.find((s) => String(s.id) === String(studentId));
          return student || { id: studentId, name: 'Unknown', email: '' };
        });

        return {
          ...research,
          students: researchStudents,
          studentCount: researchStudents.length,
        };
      });
  },
  getFacultyResearchDetails: async (facultyId: string, researchId: string) => {
    const firestoreDb = requireDb();
    const researchRef = doc(firestoreDb, 'research', researchId);
    const researchSnapshot = await getDoc(researchRef);
    if (!researchSnapshot.exists()) return null;

    const research = normalizeResearchRecord(researchSnapshot);
    const panelMembers = Array.isArray(research.panelMembers)
      ? research.panelMembers
      : [];
    const advisers = Array.isArray(research.advisers)
      ? research.advisers
      : [];

    const isFacultyInvolved =
      panelMembers.some((id: any) => String(id) === String(facultyId)) ||
      advisers.some((id: any) => String(id) === String(facultyId));

    if (!isFacultyInvolved) return null;

    const studentIds = Array.isArray(research.students) ? research.students : [];
    const studentsSnapshot = await getDocs(collection(firestoreDb, 'students'));
    const allStudents = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const researchStudents = studentIds.map((studentId: any) => {
      const student = allStudents.find((s) => String(s.id) === String(studentId));
      return student || { id: studentId, name: 'Unknown', email: '' };
    });

    return {
      ...research,
      students: researchStudents,
      panel_members: panelMembers,
      advisers,
      details: research.description || research.abstract || '',
    };
  },
  getFacultySyllabi: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'syllabi'));
    return snapshot.docs
      .map(normalizeSyllabusRecord)
      .filter((syllabus) => String(syllabus.facultyId || syllabus.faculty_id || '') === String(facultyId));
  },
  uploadSyllabus: async (facultyId: string, payload: any) => {
    const firestoreDb = requireDb();
    const syllabusRef = doc(collection(firestoreDb, 'syllabi'));
    const now = new Date().toISOString();
    const record = {
      id: syllabusRef.id,
      facultyId,
      faculty_id: facultyId,
      ...payload,
      updatedAt: now,
      updated_at: now,
    };

    await setDoc(syllabusRef, record);
    return normalizeSyllabusRecord(await getDoc(syllabusRef));
  },
  deleteSyllabus: async (facultyId: string, syllabusId: string) => {
    const firestoreDb = requireDb();
    const syllabusRef = doc(firestoreDb, 'syllabi', syllabusId);
    const snapshot = await getDoc(syllabusRef);

    if (!snapshot.exists()) {
      return false;
    }

    const syllabus = snapshot.data() as Record<string, any>;
    if (String(syllabus.facultyId || syllabus.faculty_id || '') !== String(facultyId)) {
      return false;
    }

    await deleteDoc(syllabusRef);
    return true;
  },
  getFacultyClasses: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'schedules'));
    const classes = await Promise.all(
      snapshot.docs
        .filter((scheduleDoc) => {
          const schedule = scheduleDoc.data() as Record<string, any>;
          return String(schedule.faculty_id || schedule.facultyId || '') === String(facultyId);
        })
        .map((scheduleDoc) => normalizeScheduleClass(scheduleDoc))
    );

    return classes;
  },
  getFacultyDashboard: async (facultyId: string) => {
    const firestoreDb = requireDb();
    const [facultySnapshot, subjectSnapshot, scheduleSnapshot, researchSnapshot] = await Promise.all([
      getDoc(doc(firestoreDb, 'faculties', facultyId)),
      getDocs(collection(firestoreDb, 'subjects')),
      getDocs(collection(firestoreDb, 'schedules')),
      getDocs(collection(firestoreDb, 'research')),
    ]);

    const faculty = facultySnapshot.exists()
      ? { id: facultySnapshot.id, ...(facultySnapshot.data() as Record<string, any>) }
      : { id: facultyId, name: '', email: '' };

    const subjects = subjectSnapshot.docs
      .filter((subjectDoc) => {
        const subject = subjectDoc.data() as Record<string, any>;
        return String(subject.facultyId || subject.faculty_id || '') === String(facultyId);
      })
      .map((subjectDoc) => {
        const subject = subjectDoc.data() as Record<string, any>;
        const relatedClasses = scheduleSnapshot.docs.filter((scheduleDoc) => {
          const schedule = scheduleDoc.data() as Record<string, any>;
          const scheduleFacultyId = String(schedule.faculty_id || schedule.facultyId || '');
          const subjectId = String(schedule.subject_id || schedule.subjectId || schedule.course_id || schedule.courseId || '');
          return scheduleFacultyId === String(facultyId) && (
            subjectId === subjectDoc.id ||
            String(schedule.courseCode || '') === String(subject.code || '') ||
            String(schedule.subjectCode || '') === String(subject.code || '')
          );
        });

        return {
          id: subjectDoc.id,
          name: subject.name || subject.title || '',
          code: subject.code || '',
          classes: relatedClasses.length,
        };
      });

    const classes = await Promise.all(
      scheduleSnapshot.docs
        .filter((scheduleDoc) => {
          const schedule = scheduleDoc.data() as Record<string, any>;
          return String(schedule.faculty_id || schedule.facultyId || '') === String(facultyId);
        })
        .map((scheduleDoc) => normalizeScheduleClass(scheduleDoc))
    );

    const totalStudents = classes.reduce((count, classItem) => {
      const rawSchedule = scheduleSnapshot.docs.find((scheduleDoc) => String(scheduleDoc.id) === String(classItem.classId));
      const scheduleData = rawSchedule?.data() as Record<string, any> | undefined;
      const studentIds = Array.isArray(scheduleData?.student_ids) ? scheduleData?.student_ids : [];
      const studentsValue = Number(scheduleData?.students || studentIds.length || 0);
      return count + studentsValue;
    }, 0);

    return {
      faculty,
      subjects,
      totalClasses: classes.length,
      totalStudents,
    };
  },
};

export const adminDB = {
  getAdmin: (adminId: string) => getDocument('users', adminId),
  getAllAdmins: () => apiRequest('/admin/users/admins'),
  updateAdmin: (adminId: string, data: any) => updateDocument('users', adminId, data),
  deleteAdmin: (adminId: string) => deleteDocument('users', adminId),
};

export const coursesDB = {
  getCourse: async (courseId: string) => {
    const firestoreDb = requireDb();
    const subjectSnapshot = await getDoc(doc(firestoreDb, 'subjects', courseId));
    if (subjectSnapshot.exists()) {
      return { id: subjectSnapshot.id, ...(subjectSnapshot.data() as Record<string, any>) };
    }
    const courseSnapshot = await getDoc(doc(firestoreDb, 'courses', courseId));
    if (courseSnapshot.exists()) {
      return { id: courseSnapshot.id, ...(courseSnapshot.data() as Record<string, any>) };
    }
    return null;
  },
  getAllCourses: async () => {
    const firestoreDb = requireDb();
    const [subjectsSnapshot, coursesSnapshot] = await Promise.all([
      getDocs(collection(firestoreDb, 'subjects')),
      getDocs(collection(firestoreDb, 'courses')),
    ]);

    const subjects = subjectsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
    if (subjects.length > 0) return subjects;

    return coursesSnapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
  },
  addCourse: async (data: any) => {
    const firestoreDb = requireDb();
    if (data?.id) {
      const courseId = String(data.id);
      await setDoc(doc(firestoreDb, 'courses', courseId), { ...data, id: courseId });
      return courseId;
    }
    const courseRef = doc(collection(firestoreDb, 'courses'));
    await setDoc(courseRef, { ...data, id: courseRef.id });
    return courseRef.id;
  },
  updateCourse: async (courseId: string, data: any) => {
    const firestoreDb = requireDb();
    await updateDoc(doc(firestoreDb, 'courses', courseId), data);
  },
  deleteCourse: async (courseId: string) => {
    const firestoreDb = requireDb();
    await deleteDoc(doc(firestoreDb, 'courses', courseId));
  },
};

export const gradesDB = {
  getGrade: (gradeId: string) => getDocument('grades', gradeId),
  getStudentGrades: (studentId: string) => queryCollection('grades', [['studentId', '==', studentId]]),
  getAllGrades: () => getCollection('grades'),
  updateGrade: (gradeId: string, data: any) => updateDocument('grades', gradeId, data),
  deleteGrade: (gradeId: string) => deleteDocument('grades', gradeId),
};

export const schedulesDB = {
  getSchedule: async (scheduleId: string) => {
    const firestoreDb = requireDb();
    const scheduleSnapshot = await getDoc(doc(firestoreDb, 'schedules', scheduleId));
    if (!scheduleSnapshot.exists()) return null;
    return { id: scheduleSnapshot.id, ...(scheduleSnapshot.data() as Record<string, any>) };
  },
  getAllSchedules: async () => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'schedules'));
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
  },
  addSchedule: async (data: any) => {
    const firestoreDb = requireDb();
    const scheduleRef = doc(collection(firestoreDb, 'schedules'));
    await setDoc(scheduleRef, { ...data, id: scheduleRef.id });
    return scheduleRef.id;
  },
  updateSchedule: async (scheduleId: string, data: any) => {
    const firestoreDb = requireDb();
    await updateDoc(doc(firestoreDb, 'schedules', scheduleId), data);
  },
  deleteSchedule: async (scheduleId: string) => {
    const firestoreDb = requireDb();
    await deleteDoc(doc(firestoreDb, 'schedules', scheduleId));
  },
  reassignFaculty: async (scheduleId: string, facultyId: string) => {
    const firestoreDb = requireDb();
    await updateDoc(doc(firestoreDb, 'schedules', scheduleId), { faculty_id: facultyId, facultyId });
  },
  getStudentSchedule: (studentId: string) => buildStudentSchedulePayload(studentId),
  getStudentScheduleDetails: (studentId: string, classId: string) => buildScheduleDetails(studentId, classId),
  enrollStudentCourse: async (studentId: string, classId: string) => {
    const firestoreDb = requireDb();
    const studentRef = doc(firestoreDb, 'students', studentId);
    const scheduleRef = doc(firestoreDb, 'schedules', classId);
    const [studentSnapshot, scheduleSnapshot] = await Promise.all([getDoc(studentRef), getDoc(scheduleRef)]);

    if (!studentSnapshot.exists() || !scheduleSnapshot.exists()) {
      throw new Error('Student or class not found');
    }

    const studentData = studentSnapshot.data() as Record<string, any>;
    const enrolledClasses = Array.isArray(studentData.enrolled_classes) ? studentData.enrolled_classes : [];
    if (!enrolledClasses.includes(classId)) {
      await updateDoc(studentRef, {
        enrolled_classes: arrayUnion(classId),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const scheduleData = scheduleSnapshot.data() as Record<string, any>;
    const nextStudentIds = Array.isArray(scheduleData.student_ids) ? scheduleData.student_ids : [];
    if (!nextStudentIds.includes(studentId)) {
      await updateDoc(scheduleRef, {
        student_ids: arrayUnion(studentId),
        students: (Array.isArray(scheduleData.student_ids) ? scheduleData.student_ids.length : 0) + 1,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return { studentId, classId };
  },
};

export const eventsDB = {
  getEvent: (eventId: string) => getDocument('events', eventId),
  getAllEvents: () => getCollection('events'),
  addEvent: (data: any) => addDocument('events', data),
  updateEvent: (eventId: string, data: any) => updateDocument('events', eventId, data),
  deleteEvent: (eventId: string) => deleteDocument('events', eventId),
};

export const researchDB = {
  getResearch: (researchId: string) => getDocument('research', researchId),
  getAllResearch: () => getCollection('research'),
  addResearch: (data: any) => addDocument('research', data),
  updateResearch: (researchId: string, data: any) => updateDocument('research', researchId, data),
  deleteResearch: (researchId: string) => deleteDocument('research', researchId),
};

export const announcementsDB = {
  getAnnouncement: (announcementId: string) => getDocument('announcements', announcementId),
  getAllAnnouncements: () => getCollection('announcements'),
  addAnnouncement: (data: any) => addDocument('announcements', data),
  updateAnnouncement: (announcementId: string, data: any) =>
    updateDocument('announcements', announcementId, data),
  deleteAnnouncement: (announcementId: string) => deleteDocument('announcements', announcementId),
};

export const guidanceDB = {
  getStudentDisciplineRecords: (studentId?: string, email?: string) =>
    studentDB.getDisciplineRecords({ studentId, email }),
  getAllDisciplineRecords: async () => {
    const firestoreDb = requireDb();
    const snapshot = await getDocs(collection(firestoreDb, 'disciplineRecords'));
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() as Record<string, any>) }));
  },
  addDisciplineRecord: async (data: any) => {
    const firestoreDb = requireDb();
    const recordRef = doc(collection(firestoreDb, 'disciplineRecords'));
    await setDoc(recordRef, { ...data, id: recordRef.id });
    return recordRef.id;
  },
};
