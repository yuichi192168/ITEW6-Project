import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const dataDirectory = path.resolve(currentDirectory, '../data');
const dataFilePath = path.join(dataDirectory, 'db.json');

const defaultDb = {
  users: [],
  subjects: [],
  students: [],
  faculties: [],
  courses: [],
  grades: [],
  schedules: [],
  events: [],
  research: [],
  announcements: [],
  disciplineRecords: [],
  messages: [],
  syllabi: [],
  activityLogs: [],
};

let writeQueue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureDbFile = async () => {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(dataFilePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(dataFilePath, `${JSON.stringify(defaultDb, null, 2)}\n`, 'utf8');
      return;
    }
    throw error;
  }
};

const loadDb = async () => {
  await ensureDbFile();
  const raw = await readFile(dataFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    ...clone(defaultDb),
    ...parsed,
  };
};

const saveDb = async (db) => {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
};

const withWriteLock = (operation) => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
};

const nowIso = () => new Date().toISOString();

const normalizeRecord = (record) => ({
  ...record,
  created_at: record.created_at ?? record.createdAt ?? null,
  updated_at: record.updated_at ?? record.updatedAt ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const normalizeString = (value) => String(value ?? '').trim().toLowerCase();

const matchesDepartment = (student, department) => {
  if (!department) return true;
  const normalizedDepartment = normalizeString(department);
  const program = normalizeString(student.program);

  if (!program) return false;
  if (normalizedDepartment === program) return true;
  if (normalizedDepartment.includes('computer science') && program === 'bscs') return true;
  if (normalizedDepartment.includes('information technology') && program === 'bsit') return true;
  if (normalizedDepartment.includes('engineering') && program.startsWith('bs')) return true;
  return false;
};

const assignSubjectToRegularStudents = (db, subject) => {
  if (!subject || !subject.yearLevel) return;
  const students = db.students ?? [];
  db.students = students.map((student) => {
    if (normalizeString(student.status) !== 'regular') return student;

    const yearValue = normalizeString(student.year || student.yearLevel);
    const subjectYear = normalizeString(subject.yearLevel);
    const matchesYear = subjectYear ? yearValue === subjectYear : true;
    const matchesDept = matchesDepartment(student, subject.department);

    if (!matchesYear || !matchesDept) return student;

    const existingSubjects = Array.isArray(student.assigned_subjects)
      ? student.assigned_subjects.map(String)
      : [];

    const assignedSubjectId = String(subject.id);
    if (existingSubjects.includes(assignedSubjectId)) return student;

    return {
      ...student,
      assigned_subjects: [...existingSubjects, assignedSubjectId],
    };
  });
};

const assignSubjectToFaculty = (db, subject) => {
  if (!subject || !subject.facultyId) return;
  const faculties = db.faculties ?? [];
  const faculty = faculties.find((item) => String(item.id) === String(subject.facultyId));
  if (!faculty) return;

  const assignedSubjectLabel = subject.name || subject.code || String(subject.id);
  faculty.assigned_subject = assignedSubjectLabel;
};

const toCollectionKey = (collectionName) => {
  if (collectionName === 'discipline-records') return 'disciplineRecords';
  return collectionName;
};

const isCollectionAllowed = (collectionName) =>
  ['users', 'subjects', 'students', 'faculties', 'courses', 'grades', 'schedules', 'events', 'research', 'announcements', 'syllabi'].includes(collectionName);
  ['users', 'subjects', 'students', 'faculties', 'courses', 'grades', 'schedules', 'events', 'research', 'announcements', 'activityLogs'].includes(collectionName);

const addActivityLog = (db, { targetUserId, targetEmail, action, performedBy }) => {
  const timestamp = nowIso();
  const logEntry = normalizeRecord({
    id: randomUUID(),
    targetUserId,
    targetEmail,
    action,
    performedBy,
    created_at: timestamp,
    updated_at: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  db.activityLogs = [...(db.activityLogs ?? []), logEntry];
};

export const getAll = async (collectionName) => {
  const db = await loadDb();
  const key = toCollectionKey(collectionName);
  if (!isCollectionAllowed(key)) {
    return null;
  }
  return (db[key] ?? []).map(normalizeRecord);
};

export const getById = async (collectionName, id) => {
  const records = await getAll(collectionName);
  if (!records) return null;
  return records.find((record) => String(record.id) === String(id)) ?? null;
};

export const query = async (collectionName, filters) => {
  const records = await getAll(collectionName);
  if (!records) return null;
  return records.filter((record) =>
    Object.entries(filters).every(([field, value]) => String(record[field] ?? '') === String(value))
  );
};

export const createRecord = async (collectionName, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return null;
    }

    const timestamp = nowIso();
    const recordData = { ...data };
  delete recordData.autoAssignRegular;

  const record = normalizeRecord({
      id: randomUUID(),
      ...recordData,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db[key] = [...(db[key] ?? []), record];
    if (key === 'users') {
      addActivityLog(db, {
        targetUserId: record.id,
        targetEmail: record.email,
        action: 'created',
        performedBy: 'Admin Console',
      });
    }
    if (key === 'subjects') {
      assignSubjectToRegularStudents(db, record);
      assignSubjectToFaculty(db, record);
    }
    await saveDb(db);
    return record;
  });

export const updateRecord = async (collectionName, id, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return null;
    }

    const records = db[key] ?? [];
    const index = records.findIndex((record) => String(record.id) === String(id));

    const timestamp = nowIso();
    if (index === -1) {
      const createdData = { ...data };
      delete createdData.autoAssignRegular;

      const created = normalizeRecord({
        id,
        ...createdData,
        created_at: timestamp,
        createdAt: timestamp,
        updated_at: timestamp,
        updatedAt: timestamp,
      });

      db[key] = [...records, created];
      await saveDb(db);
      return created;
    }

    const existing = records[index];
    const updatedData = { ...data };
    delete updatedData.autoAssignRegular;

    const updated = normalizeRecord({
      ...existing,
      ...updatedData,
      id: existing.id,
      created_at: existing.created_at ?? existing.createdAt ?? timestamp,
      createdAt: existing.createdAt ?? existing.created_at ?? timestamp,
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    records[index] = updated;
    db[key] = records;
    if (key === 'users') {
      addActivityLog(db, {
        targetUserId: updated.id,
        targetEmail: updated.email,
        action: 'updated',
        performedBy: 'Admin Console',
      });
    }
    if (key === 'subjects') {
      assignSubjectToRegularStudents(db, updated);
      assignSubjectToFaculty(db, updated);
    }
    await saveDb(db);
    return updated;
  });

export const deleteRecord = async (collectionName, id) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);
    if (!isCollectionAllowed(key)) {
      return false;
    }

    const records = db[key] ?? [];
    const nextRecords = records.filter((record) => String(record.id) !== String(id));
    if (nextRecords.length === records.length) return false;

    if (key === 'users') {
      const deletedRecord = records.find((record) => String(record.id) === String(id));
      if (deletedRecord) {
        addActivityLog(db, {
          targetUserId: deletedRecord.id,
          targetEmail: deletedRecord.email,
          action: 'deleted',
          performedBy: 'Admin Console',
        });
      }
    }

    db[key] = nextRecords;
    await saveDb(db);
    return true;
  });

export const listAdmins = async () => {
  const users = await getAll('users');
  return (users ?? []).filter((user) => String(user.role).toLowerCase() === 'admin');
};

export const assignFacultySubject = async (facultyId, subject) =>
  updateRecord('faculties', facultyId, { subject, assigned_subject: subject });

export const assignFacultyEvent = async (facultyId, eventId) =>
  updateRecord('faculties', facultyId, { event_id: eventId, eventId });

export const messageStudent = async (payload) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const timestamp = nowIso();
    const message = normalizeRecord({
      id: randomUUID(),
      ...payload,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db.messages = [...(db.messages ?? []), message];
    await saveDb(db);
    return message;
  });

export const reassignScheduleFaculty = async (scheduleId, facultyId) =>
  updateRecord('schedules', scheduleId, { faculty_id: facultyId, facultyId });

export const getDisciplineRecords = async ({ studentId, email }) => {
  const db = await loadDb();
  const records = (db.disciplineRecords ?? []).map(normalizeRecord);
  return records.filter((record) => {
    const matchesStudent = studentId ? String(record.studentId ?? '') === String(studentId) : true;
    const matchesEmail = email ? String(record.email ?? '') === String(email) : true;
    return matchesStudent && matchesEmail;
  });
};

// Faculty-specific functions
export const getFacultyDashboard = async (facultyId) => {
  const db = await loadDb();
  const faculty = (db.faculties ?? []).find((f) => String(f.id) === String(facultyId));
  
  if (!faculty) return null;

  const allSubjects = (db.subjects ?? []).map(normalizeRecord);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  
  // Get subjects assigned to faculty
  const assignedSubjects = allSubjects.filter((subject) => 
    String(subject.facultyId ?? '') === String(facultyId)
  );
  
  // Get classes/schedules for this faculty
  const facultyClasses = allSchedules.filter((schedule) => 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  const classesPerSubject = assignedSubjects.map((subject) => ({
    ...subject,
    classes: facultyClasses.filter((cls) => 
      String(cls.subject_id ?? cls.subjectId ?? '') === String(subject.id)
    ).length,
  }));

  return {
    faculty,
    subjects: classesPerSubject,
    totalClasses: facultyClasses.length,
    totalStudents: facultyClasses.reduce((sum, cls) => sum + (Number(cls.students ?? 0)), 0),
  };
};

export const getFacultyClasses = async (facultyId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  
  const facultyClasses = allSchedules.filter((schedule) => 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  return facultyClasses.map((cls) => {
    const course = allCourses.find((c) => String(c.id) === String(cls.course_id ?? cls.courseId));
    return {
      ...cls,
      courseName: course?.name ?? cls.name,
      courseCode: course?.code ?? cls.code,
    };
  });
};

export const getClassDetails = async (facultyId, classId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  
  const classSchedule = allSchedules.find((schedule) => 
    String(schedule.id) === String(classId) && 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  if (!classSchedule) return null;

  const classStudents = allStudents.filter((student) => {
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    return enrolledClasses.includes(classId);
  });

  const course = allCourses.find((c) => String(c.id) === String(classSchedule.course_id ?? classSchedule.courseId));

  return {
    ...classSchedule,
    courseName: course?.name ?? 'Unknown Course',
    courseCode: course?.code ?? 'Unknown',
    students: classStudents,
    studentCount: classStudents.length,
    materials: classSchedule.materials ?? [],
  };
};

export const getClassStudents = async (facultyId, classId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  const classSchedule = allSchedules.find((schedule) => 
    String(schedule.id) === String(classId) && 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  if (!classSchedule) return null;

  const classStudents = allStudents.filter((student) => {
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    return enrolledClasses.includes(classId);
  }).map((student) => ({
    ...student,
    yearLevel: student.year_level ?? student.yearLevel ?? 1,
    department: student.department ?? 'Unknown',
  }));

  return classStudents;
};

export const getGradeEntry = async (facultyId, classId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allGrades = (db.grades ?? []).map(normalizeRecord);
  
  const classSchedule = allSchedules.find((schedule) => 
    String(schedule.id) === String(classId) && 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  if (!classSchedule) return null;

  const classStudents = allStudents.filter((student) => {
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    return enrolledClasses.includes(classId);
  });

  const studentGrades = classStudents.map((student) => {
    const studentGradeRecords = allGrades.filter((grade) => 
      String(grade.student_id ?? grade.studentId ?? '') === String(student.id) &&
      String(grade.class_id ?? grade.classId ?? '') === String(classId)
    );

    const gradeData = studentGradeRecords.reduce((acc, grade) => {
      acc.attendance = acc.attendance || grade.attendance || 0;
      acc.activity = acc.activity || grade.activity || 0;
      acc.exam = acc.exam || grade.exam || 0;
      return acc;
    }, {});

    const totalGrade = ((gradeData.attendance * 0.1) + (gradeData.activity * 0.4) + (gradeData.exam * 0.5));

    return {
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      yearLevel: student.year_level ?? student.yearLevel ?? 1,
      department: student.department ?? 'Unknown',
      attendance: gradeData.attendance || 0,
      activity: gradeData.activity || 0,
      exam: gradeData.exam || 0,
      totalGrade: Math.round(totalGrade * 100) / 100,
    };
  });

  return {
    classId,
    classSchedule,
    studentGrades,
  };
};

export const saveClassGrades = async (facultyId, classId, gradesData) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);
    
    const classSchedule = allSchedules.find((schedule) => 
      String(schedule.id) === String(classId) && 
      String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
    );

    if (!classSchedule) return null;

    const timestamp = nowIso();
    const updatedGrades = [];

    for (const gradeEntry of gradesData) {
      const allGrades = (db.grades ?? []).map(normalizeRecord);
      const existingGrade = allGrades.find((g) => 
        String(g.student_id ?? g.studentId ?? '') === String(gradeEntry.studentId) &&
        String(g.class_id ?? g.classId ?? '') === String(classId)
      );

      const gradeRecord = normalizeRecord({
        id: existingGrade?.id ?? randomUUID(),
        student_id: gradeEntry.studentId,
        studentId: gradeEntry.studentId,
        class_id: classId,
        classId,
        attendance: gradeEntry.attendance ?? 0,
        activity: gradeEntry.activity ?? 0,
        exam: gradeEntry.exam ?? 0,
        created_at: existingGrade?.created_at ?? timestamp,
        updated_at: timestamp,
        createdAt: existingGrade?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      updatedGrades.push(gradeRecord);
    }

    // Update grades in database
    const existingGradeIds = new Set(updatedGrades.map((g) => String(g.id)));
    db.grades = [
      ...(db.grades ?? []).filter((g) => !existingGradeIds.has(String(g.id))),
      ...updatedGrades,
    ];

    await saveDb(db);
    return updatedGrades;
  });

export const uploadClassMaterial = async (classId, material) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);
    const index = allSchedules.findIndex((schedule) => String(schedule.id) === String(classId));

    if (index === -1) return null;

    const materialRecord = {
      id: randomUUID(),
      ...material,
      uploaded_at: nowIso(),
    };

    allSchedules[index].materials = [...(allSchedules[index].materials ?? []), materialRecord];
    db.schedules = allSchedules;
    await saveDb(db);

    return materialRecord;
  });

// Teaching Load functions
export const getTeachingLoad = async (facultyId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  
  const facultyClasses = allSchedules.filter((schedule) => 
    String(schedule.faculty_id ?? schedule.facultyId ?? '') === String(facultyId)
  );

  let totalLectureHours = 0;
  let totalLabHours = 0;
  let totalTeachingHours = 0;
  let totalStudents = 0;

  const classesWithHours = facultyClasses.map((cls) => {
    const course = allCourses.find((c) => String(c.id) === String(cls.course_id ?? cls.courseId));
    
    // Determine hours based on class type
    let lectureHours = 0;
    let labHours = 0;
    const classType = cls.type ?? course?.type ?? 'lecture';
    const units = Number(cls.units ?? course?.units ?? 3);
    
    if (classType === 'lecture-only') {
      lectureHours = 3; // Pure lecture = 3 hours
    } else if (classType === 'lecture-lab') {
      lectureHours = 2; // Lecture with lab = 2 hours lecture
      labHours = 3;     // + 3 hours lab
    } else if (classType === 'lab-only') {
      labHours = 3; // Lab only = 3 hours
    } else {
      lectureHours = 3; // Default to lecture
    }

    totalLectureHours += lectureHours;
    totalLabHours += labHours;
    totalTeachingHours += lectureHours + labHours;
    totalStudents += Number(cls.students ?? 0);

    return {
      id: cls.id,
      code: course?.code ?? cls.code,
      name: course?.name ?? cls.name,
      section: cls.section,
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
    classes: classesWithHours,
    totalClasses: facultyClasses.length,
    totalStudents,
    totalLectureHours,
    totalLabHours,
    totalTeachingHours,
  };
};

// Syllabus functions
export const getFacultySyllabi = async (facultyId) => {
  const db = await loadDb();
  const allSyllabi = (db.syllabi ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);
  
  // Get subjects assigned to faculty
  const facultySubjects = allSubjects.filter((subject) => 
    String(subject.facultyId ?? '') === String(facultyId)
  );

  // Filter syllabi for this faculty's subjects
  const facultySyllabi = allSyllabi.filter((syllabus) => {
    const subjectId = syllabus.subject_id ?? syllabus.subjectId;
    return facultySubjects.some((subject) => String(subject.id) === String(subjectId));
  });

  return facultySyllabi.map((syllabus) => {
    const subject = facultySubjects.find((s) => 
      String(s.id) === String(syllabus.subject_id ?? syllabus.subjectId)
    );
    return {
      ...syllabus,
      subjectName: subject?.name ?? 'Unknown',
      subjectCode: subject?.code ?? 'Unknown',
    };
  });
};

export const uploadSyllabus = async (facultyId, syllabusData) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allSubjects = (db.subjects ?? []).map(normalizeRecord);
    
    // Verify faculty owns the subject
    const subject = allSubjects.find((s) => 
      String(s.id) === String(syllabusData.subject_id ?? syllabusData.subjectId) &&
      String(s.facultyId ?? '') === String(facultyId)
    );

    if (!subject) return null;

    const timestamp = nowIso();
    const syllabusRecord = normalizeRecord({
      id: randomUUID(),
      subject_id: subject.id,
      subjectId: subject.id,
      faculty_id: facultyId,
      facultyId,
      ...syllabusData,
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db.syllabi = [...(db.syllabi ?? []), syllabusRecord];
    await saveDb(db);
    return syllabusRecord;
  });

export const deleteSyllabus = async (facultyId, syllabusId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allSyllabi = (db.syllabi ?? []).map(normalizeRecord);
    
    const syllabus = allSyllabi.find((s) => String(s.id) === String(syllabusId));
    if (!syllabus || String(syllabus.faculty_id ?? syllabus.facultyId ?? '') !== String(facultyId)) {
      return false;
    }

    db.syllabi = allSyllabi.filter((s) => String(s.id) !== String(syllabusId));
    await saveDb(db);
    return true;
  });

// Events functions
export const getAllEvents = async () => {
  const db = await loadDb();
  return (db.events ?? []).map(normalizeRecord);
};

export const joinEvent = async (facultyId, eventId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allEvents = (db.events ?? []).map(normalizeRecord);
    const index = allEvents.findIndex((e) => String(e.id) === String(eventId));

    if (index === -1) return null;

    const event = allEvents[index];
    const attendees = event.attendees ?? event.faculties ?? [];
    
    // Check if already joined
    if (attendees.some((a) => String(a) === String(facultyId))) {
      return event;
    }

    const updated = normalizeRecord({
      ...event,
      attendees: [...attendees, facultyId],
      faculties: [...attendees, facultyId],
      updated_at: nowIso(),
      updatedAt: nowIso(),
    });

    allEvents[index] = updated;
    db.events = allEvents;
    await saveDb(db);
    return updated;
  });

export const inviteStudentsToEvent = async (facultyId, eventId, studentIds) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allEvents = (db.events ?? []).map(normalizeRecord);
    const index = allEvents.findIndex((e) => String(e.id) === String(eventId));

    if (index === -1) return null;

    const event = allEvents[index];
    const invitedStudents = event.invited_students ?? event.invitedStudents ?? [];
    
    // Add new student invites
    const newInvites = studentIds.filter((id) => 
      !invitedStudents.some((s) => String(s) === String(id))
    );

    const updated = normalizeRecord({
      ...event,
      invited_students: [...invitedStudents, ...newInvites],
      invitedStudents: [...invitedStudents, ...newInvites],
      updated_at: nowIso(),
      updatedAt: nowIso(),
    });

    allEvents[index] = updated;
    db.events = allEvents;
    await saveDb(db);
    return updated;
  });

// Research functions
export const getFacultyResearch = async (facultyId) => {
  const db = await loadDb();
  const allResearch = (db.research ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  // Get research where faculty is panel member or adviser
  const facultyResearch = allResearch.filter((research) => {
    const panelMembers = research.panel_members ?? research.panelMembers ?? [];
    const advisers = research.advisers ?? research.advisers ?? [];
    
    const isPanelMember = panelMembers.some((member) => 
      typeof member === 'string' 
        ? String(member) === String(facultyId)
        : String(member.id ?? member) === String(facultyId)
    );
    
    const isAdviser = advisers.some((adviser) => 
      typeof adviser === 'string'
        ? String(adviser) === String(facultyId)
        : String(adviser.id ?? adviser) === String(facultyId)
    );

    return isPanelMember || isAdviser;
  });

  return facultyResearch.map((research) => {
    const panelMembers = research.panel_members ?? research.panelMembers ?? [];
    const advisers = research.advisers ?? research.advisers ?? [];
    
    const isPanelMember = panelMembers.some((member) => 
      typeof member === 'string' 
        ? String(member) === String(facultyId)
        : String(member.id ?? member) === String(facultyId)
    );

    // Get student details
    const studentIds = research.students ?? research.student_ids ?? [];
    const researchStudents = studentIds.map((studentId) => {
      const student = allStudents.find((s) => String(s.id) === String(studentId));
      return student || { id: studentId, name: 'Unknown' };
    });

    return {
      ...research,
      role: isPanelMember ? 'panel_member' : 'adviser',
      category: isPanelMember ? 'Panel' : 'Adviser',
      students: researchStudents,
      studentCount: researchStudents.length,
    };
  });
};

export const getResearchDetails = async (facultyId, researchId) => {
  const db = await loadDb();
  const allResearch = (db.research ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  const research = allResearch.find((r) => String(r.id) === String(researchId));
  if (!research) return null;

  const panelMembers = research.panel_members ?? research.panelMembers ?? [];
  const advisers = research.advisers ?? research.advisers ?? [];
  
  // Verify faculty is involved
  const isFacultyInvolved = panelMembers.some((member) => 
    typeof member === 'string'
      ? String(member) === String(facultyId)
      : String(member.id ?? member) === String(facultyId)
  ) || advisers.some((adviser) =>
    typeof adviser === 'string'
      ? String(adviser) === String(facultyId)
      : String(adviser.id ?? adviser) === String(facultyId)
  );

  if (!isFacultyInvolved) return null;

  const studentIds = research.students ?? research.student_ids ?? [];
  const researchStudents = studentIds.map((studentId) => {
    const student = allStudents.find((s) => String(s.id) === String(studentId));
    return student || { id: studentId, name: 'Unknown' };
  });

  return {
    ...research,
    students: researchStudents,
    panel_members: panelMembers,
    advisers: advisers,
    details: research.description || research.abstract || '',
  };
};

// ==================== STUDENT-SPECIFIC FUNCTIONS ====================

export const getStudentProfile = async (studentId) => {
  const db = await loadDb();
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  const student = allStudents.find((s) => String(s.id) === String(studentId));
  return student ?? null;
};

export const updateStudentProfile = async (studentId, profileData) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const student = await getStudentProfile(studentId);
    if (!student) return null;

    const timestamp = nowIso();
    const updated = normalizeRecord({
      ...student,
      ...profileData,
      id: student.id,
      created_at: student.created_at ?? student.createdAt ?? timestamp,
      createdAt: student.createdAt ?? student.created_at ?? timestamp,
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    const allStudents = db.students ?? [];
    const index = allStudents.findIndex((s) => String(s.id) === String(studentId));
    if (index === -1) return null;

    allStudents[index] = updated;
    db.students = allStudents;
    await saveDb(db);
    return updated;
  });

export const getStudentGrades = async (studentId, term = 'all') => {
  const db = await loadDb();
  const allGrades = (db.grades ?? []).map(normalizeRecord);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  
  const studentGrades = allGrades.filter((grade) => 
    String(grade.student_id ?? grade.studentId ?? '') === String(studentId)
  );

  const gradesWithCourseInfo = studentGrades.map((grade) => {
    const schedule = allSchedules.find((s) => String(s.id) === String(grade.class_id ?? grade.classId));
    const course = schedule ? allCourses.find((c) => String(c.id) === String(schedule.course_id ?? schedule.courseId)) : null;
    
    const totalGrade = ((grade.attendance ?? 0) * 0.1) + ((grade.activity ?? 0) * 0.4) + ((grade.exam ?? 0) * 0.5);

    return {
      gradeId: grade.id,
      classId: grade.class_id ?? grade.classId,
      courseCode: course?.code ?? 'Unknown',
      courseName: course?.name ?? 'Unknown',
      term: schedule?.term ?? 'N/A',
      attendance: grade.attendance ?? 0,
      activity: grade.activity ?? 0,
      exam: grade.exam ?? 0,
      totalGrade: Math.round(totalGrade * 100) / 100,
    };
  });

  if (term !== 'all') {
    gradesWithCourseInfo.filter((g) => String(g.term) === String(term));
  }

  // Calculate GWA
  const totalGrades = gradesWithCourseInfo.reduce((sum, g) => sum + g.totalGrade, 0);
  const gwa = gradesWithCourseInfo.length > 0 ? Math.round((totalGrades / gradesWithCourseInfo.length) * 100) / 100 : 0;

  return {
    studentId,
    grades: gradesWithCourseInfo,
    gwa,
    totalCourses: gradesWithCourseInfo.length,
  };
};

export const getStudentSchedule = async (studentId) => {
  const db = await loadDb();
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  
  const student = allStudents.find((s) => String(s.id) === String(studentId));
  if (!student) return null;

  const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
  
  const studentSchedule = enrolledClasses.map((classId) => {
    const schedule = allSchedules.find((s) => String(s.id) === String(classId));
    if (!schedule) return null;

    const course = allCourses.find((c) => String(c.id) === String(schedule.course_id ?? schedule.courseId));
    
    return {
      classId: schedule.id,
      courseCode: course?.code ?? schedule.code,
      courseName: course?.name ?? schedule.name,
      section: schedule.section,
      schedule: schedule.schedule ?? 'TBD',
      room: schedule.room ?? 'TBD',
      units: course?.units ?? 3,
      type: course?.type ?? 'lecture',
      materials: schedule.materials ?? [],
      quizzes: schedule.quizzes ?? [],
      exams: schedule.exams ?? [],
      activities: schedule.activities ?? [],
    };
  }).filter((item) => item !== null);

  return {
    studentId,
    enrolledClasses: studentSchedule,
    totalCourses: studentSchedule.length,
  };
};

export const getScheduleDetails = async (studentId, classId) => {
  const db = await loadDb();
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  const schedule = allSchedules.find((s) => String(s.id) === String(classId));
  if (!schedule) return null;

  const student = allStudents.find((s) => String(s.id) === String(studentId));
  if (!student) return null;

  const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
  const isEnrolled = enrolledClasses.includes(classId);

  if (!isEnrolled) return null;

  const course = allCourses.find((c) => String(c.id) === String(schedule.course_id ?? schedule.courseId));

  return {
    classId,
    courseCode: course?.code ?? schedule.code,
    courseName: course?.name ?? schedule.name,
    section: schedule.section,
    schedule: schedule.schedule ?? 'TBD',
    room: schedule.room ?? 'TBD',
    faculty: schedule.faculty_name ?? schedule.facultyName ?? 'TBD',
    units: course?.units ?? 3,
    type: course?.type ?? 'lecture',
    description: course?.description ?? 'No description',
    materials: (schedule.materials ?? []).map((m) => ({
      id: m.id,
      title: m.title ?? 'Material',
      type: m.type ?? 'document',
      url: m.url ?? m.fileUrl,
      uploadedAt: m.uploaded_at ?? m.uploadedAt ?? new Date().toISOString(),
    })),
    assessments: {
      quizzes: (schedule.quizzes ?? []).map((q) => ({
        id: q.id,
        title: q.title,
        dueDate: q.due_date ?? q.dueDate,
        status: q.status ?? 'pending',
      })),
      exams: (schedule.exams ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        status: e.status ?? 'upcoming',
      })),
      activities: (schedule.activities ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.due_date ?? a.dueDate,
        status: a.status ?? 'pending',
      })),
    },
  };
};

export const enrollStudentCourse = async (studentId, classId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allStudents = (db.students ?? []).map(normalizeRecord);
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);
    
    const student = allStudents.find((s) => String(s.id) === String(studentId));
    const schedule = allSchedules.find((s) => String(s.id) === String(classId));
    
    if (!student || !schedule) return null;

    // Check if already enrolled
    const enrolledClasses = student.enrolled_classes ?? student.enrolledClasses ?? [];
    if (enrolledClasses.includes(classId)) return student;

    // Check for schedule conflicts (for irregular students)
    const hasConflict = enrolledClasses.some((existingClassId) => {
      const existingSchedule = allSchedules.find((s) => String(s.id) === String(existingClassId));
      return existingSchedule?.schedule === schedule.schedule;
    });

    if (hasConflict) return { error: 'Schedule conflict detected' };

    const timestamp = nowIso();
    const updated = normalizeRecord({
      ...student,
      enrolled_classes: [...enrolledClasses, classId],
      enrolledClasses: [...enrolledClasses, classId],
      enrollment_status: 'pending-approval',
      enrollmentStatus: 'pending-approval',
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    const studentIndex = allStudents.findIndex((s) => String(s.id) === String(studentId));
    allStudents[studentIndex] = updated;
    db.students = allStudents;
    await saveDb(db);
    
    return updated;
  });

export const getStudentEvents = async (studentId) => {
  const db = await loadDb();
  const allEvents = (db.events ?? []).map(normalizeRecord);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  
  const student = allStudents.find((s) => String(s.id) === String(studentId));
  if (!student) return null;

  const registeredEvents = student.registered_events ?? student.registeredEvents ?? [];

  return allEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.startTime ?? event.start_time,
    endTime: event.endTime ?? event.end_time,
    location: event.location,
    type: event.type,
    isRegistered: registeredEvents.includes(event.id),
  }));
};

export const registerStudentEvent = async (studentId, eventId) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allStudents = (db.students ?? []).map(normalizeRecord);
    
    const student = allStudents.find((s) => String(s.id) === String(studentId));
    if (!student) return null;

    const registeredEvents = student.registered_events ?? student.registeredEvents ?? [];
    if (registeredEvents.includes(eventId)) return student;

    const timestamp = nowIso();
    const updated = normalizeRecord({
      ...student,
      registered_events: [...registeredEvents, eventId],
      registeredEvents: [...registeredEvents, eventId],
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    const studentIndex = allStudents.findIndex((s) => String(s.id) === String(studentId));
    allStudents[studentIndex] = updated;
    db.students = allStudents;
    await saveDb(db);
    
    return updated;
  });

export const getStudentResearch = async (studentId) => {
  const db = await loadDb();
  const allResearch = (db.research ?? []).map(normalizeRecord);
  
  const studentResearch = allResearch.filter((research) => {
    const students = research.students ?? research.student_ids ?? [];
    return students.some((s) => 
      typeof s === 'string' 
        ? String(s) === String(studentId)
        : String(s.id ?? s) === String(studentId)
    );
  });

  return studentResearch.map((research) => ({
    id: research.id,
    title: research.title,
    description: research.description ?? research.abstract,
    authors: research.authors ?? [research.author],
    year: research.year,
    status: research.status,
    adviser: research.adviser ?? research.advisers?.[0],
    panelMembers: research.panel_members ?? research.panelMembers ?? [],
    url: research.url ?? research.link,
  }));
};

export const updateStudentResearchStatus = async (studentId, researchId, status) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const allResearch = (db.research ?? []).map(normalizeRecord);
    
    const research = allResearch.find((r) => String(r.id) === String(researchId));
    if (!research) return null;

    // Verify student is involved
    const students = research.students ?? research.student_ids ?? [];
    const isInvolved = students.some((s) =>
      typeof s === 'string'
        ? String(s) === String(studentId)
        : String(s.id ?? s) === String(studentId)
    );

    if (!isInvolved) return null;

    const timestamp = nowIso();
    const updated = normalizeRecord({
      ...research,
      status,
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    const researchIndex = allResearch.findIndex((r) => String(r.id) === String(researchId));
    allResearch[researchIndex] = updated;
    db.research = allResearch;
    await saveDb(db);
    
    return updated;
  });
