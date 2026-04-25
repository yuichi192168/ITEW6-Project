import {
  loadDb,
  normalizeRecord,
  nowIso,
  saveDb,
  withWriteLock,
} from './core.js';

const toComparableString = (value) => String(value ?? '').trim();

const extractScheduleStudentIds = (schedule) => {
  const values = [
    schedule.student_id,
    schedule.studentId,
    ...(Array.isArray(schedule.student_ids) ? schedule.student_ids : []),
    ...(Array.isArray(schedule.students) ? schedule.students : []),
  ];

  return values
    .flatMap((value) => {
      if (typeof value !== 'string') return [value];
      if (!value.includes(',') && !value.includes(' ')) return [value];
      return value
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    })
    .map((value) => toComparableString(value))
    .filter(Boolean);
};

const buildScheduleLabel = (schedule) => {
  if (schedule.schedule) return String(schedule.schedule);

  const day = schedule.day ?? schedule.dayOfWeek ?? '';
  const start = schedule.start_time ?? schedule.startTime ?? '';
  const end = schedule.end_time ?? schedule.endTime ?? '';

  const dayPart = String(day).trim();
  const startPart = String(start).trim();
  const endPart = String(end).trim();

  if (dayPart && startPart && endPart) return `${dayPart} ${startPart} - ${endPart}`;
  if (dayPart && startPart) return `${dayPart} ${startPart}`;
  if (startPart && endPart) return `${startPart} - ${endPart}`;
  if (dayPart) return dayPart;
  return 'TBD';
};

const resolveCourseRecord = (schedule, allCourses, allSubjects) => {
  const catalog = [...allCourses, ...allSubjects];
  const candidates = [
    schedule.course_id,
    schedule.courseId,
    schedule.subject_id,
    schedule.subjectId,
    schedule.classId,
    schedule.courseCode,
    schedule.courseName,
  ]
    .map((value) => toComparableString(value).toLowerCase())
    .filter(Boolean);

  return catalog.find((item) => {
    const itemCandidates = [item.id, item.code, item.name]
      .map((value) => toComparableString(value).toLowerCase())
      .filter(Boolean);

    return itemCandidates.some((itemCandidate) => candidates.includes(itemCandidate));
  });
};

const normalizePeopleList = (value) => {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];

  return entries
    .flatMap((entry) => {
      if (entry == null) return [];
      if (typeof entry === 'string') return [entry.trim()];
      if (typeof entry === 'object') {
        return [entry.name, entry.fullName, entry.displayName, entry.label, entry.title, entry.id]
          .map((item) => String(item ?? '').trim())
          .filter(Boolean);
      }
      return [String(entry).trim()];
    })
    .filter(Boolean);
};

const resolvePeopleNames = (value, peopleIndex) => {
  const entries = Array.isArray(value) ? value : value ? [value] : [];

  return entries
    .map((entry) => {
      if (entry == null) return '';

      if (typeof entry === 'object') {
        return String(entry.name || entry.fullName || entry.displayName || entry.label || entry.title || entry.id || '').trim();
      }

      const key = String(entry).trim();
      if (!key) return '';

      return (
        peopleIndex.get(key) ||
        peopleIndex.get(key.toLowerCase()) ||
        key
      );
    })
    .map((name) => String(name ?? '').trim())
    .filter(Boolean);
};

const buildPeopleIndex = (db) => {
  const index = new Map();
  const allUsers = (db.users ?? []).map(normalizeRecord);
  const allFaculties = (db.faculties ?? []).map(normalizeRecord);

  const registerPerson = (person) => {
    const resolvedName = String(person?.name || person?.fullName || person?.displayName || person?.label || person?.title || '').trim();
    if (!resolvedName) return;

    [person?.id, person?.uid, person?.userId, person?.user_id, person?.firebaseUid, person?.authUid, person?.email]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .forEach((key) => {
        index.set(key, resolvedName);
        index.set(key.toLowerCase(), resolvedName);
      });
  };

  allUsers.forEach(registerPerson);
  allFaculties.forEach(registerPerson);

  return index;
};

const resolveScheduleFacultyName = (schedule, peopleIndex) => {
  const directName = normalizePeopleList([
    schedule.faculty_name,
    schedule.facultyName,
    schedule.faculty,
    schedule.instructor,
    schedule.teacher,
  ])[0];

  if (directName) return directName;

  const facultyCandidates = [
    schedule.faculty_id,
    schedule.facultyId,
    schedule.instructor_id,
    schedule.instructorId,
    schedule.teacher_id,
    schedule.teacherId,
    ...(Array.isArray(schedule.faculty_ids) ? schedule.faculty_ids : []),
    ...(Array.isArray(schedule.facultyIds) ? schedule.facultyIds : []),
  ]
    .map((value) => toComparableString(value))
    .filter(Boolean);

  for (const candidate of facultyCandidates) {
    const resolved = peopleIndex.get(candidate) || peopleIndex.get(candidate.toLowerCase());
    if (resolved) return resolved;
  }

  return 'TBD';
};

const studentCandidateValues = (student) => [
  student?.id,
  student?.studentId,
  student?.student_id,
  student?.uid,
  student?.userId,
  student?.user_id,
  student?.firebaseUid,
  student?.authUid,
  student?.email,
];

const resolveStudentContext = (db, studentIdentifier) => {
  const requested = toComparableString(studentIdentifier);
  const allStudents = (db.students ?? []).map(normalizeRecord);
  const allUsers = (db.users ?? []).map(normalizeRecord);

  const directStudent = allStudents.find((student) =>
    studentCandidateValues(student).some((value) => toComparableString(value) === requested)
  );

  const linkedUser = allUsers.find((user) =>
    [user.id, user.uid, user.userId, user.user_id, user.firebaseUid, user.email].some(
      (value) => toComparableString(value) === requested
    )
  );

  const emailLinkedStudent =
    directStudent ||
    allStudents.find(
      (student) =>
        toComparableString(student.email) &&
        toComparableString(student.email) === toComparableString(linkedUser?.email)
    );

  const resolvedStudent = directStudent || emailLinkedStudent || null;

  return {
    requested,
    linkedUser,
    resolvedStudent,
    canonicalStudentId: toComparableString(resolvedStudent?.id || requested),
  };
};

export const getDisciplineRecords = async ({ studentId, email }) => {
  const db = await loadDb();
  const records = (db.disciplineRecords ?? []).map(normalizeRecord);
  return records.filter((record) => {
    const matchesStudent = studentId ? String(record.studentId ?? '') === String(studentId) : true;
    const matchesEmail = email ? String(record.email ?? '') === String(email) : true;
    return matchesStudent && matchesEmail;
  });
};

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

  const studentGrades = allGrades.filter(
    (grade) => String(grade.student_id ?? grade.studentId ?? '') === String(studentId)
  );

  const gradesWithCourseInfo = studentGrades.map((grade) => {
    const schedule = allSchedules.find(
      (s) => String(s.id) === String(grade.class_id ?? grade.classId)
    );
    const course = schedule
      ? allCourses.find((c) => String(c.id) === String(schedule.course_id ?? schedule.courseId))
      : null;

    const totalGrade =
      (grade.attendance ?? 0) * 0.1 + (grade.activity ?? 0) * 0.4 + (grade.exam ?? 0) * 0.5;

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

  const filteredGrades =
    term !== 'all'
      ? gradesWithCourseInfo.filter((g) => String(g.term) === String(term))
      : gradesWithCourseInfo;

  const totalGrades = filteredGrades.reduce((sum, g) => sum + g.totalGrade, 0);
  const gwa =
    filteredGrades.length > 0
      ? Math.round((totalGrades / filteredGrades.length) * 100) / 100
      : 0;

  return {
    studentId,
    grades: filteredGrades,
    gwa,
    totalCourses: filteredGrades.length,
  };
};

export const getStudentSchedule = async (studentId) => {
  const db = await loadDb();
  const { resolvedStudent, canonicalStudentId } = resolveStudentContext(db, studentId);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);

  if (!resolvedStudent) return null;

  const enrolledClasses = resolvedStudent.enrolled_classes ?? resolvedStudent.enrolledClasses ?? [];
  const enrolledClassIds = new Set(enrolledClasses.map((classId) => toComparableString(classId)));
  const requestedStudentId = canonicalStudentId;

  const relevantSchedules = allSchedules.filter((schedule) => {
    const scheduleId = toComparableString(schedule.id);
    const directlyAssignedStudentIds = extractScheduleStudentIds(schedule);

    return (
      enrolledClassIds.has(scheduleId) ||
      directlyAssignedStudentIds.some((assignedId) => assignedId === requestedStudentId)
    );
  });

  const studentSchedule = relevantSchedules.map((schedule) => {
    const course = resolveCourseRecord(schedule, allCourses, allSubjects);

    return {
      classId: schedule.id,
      courseCode: course?.code ?? schedule.courseCode ?? schedule.code ?? 'TBD',
      courseName: course?.name ?? schedule.courseName ?? schedule.name ?? 'Untitled Course',
      section: schedule.section,
      schedule: buildScheduleLabel(schedule),
      room: schedule.room ?? 'TBD',
      units: course?.units ?? schedule.units ?? 3,
      type: course?.type ?? schedule.type ?? 'lecture',
      materials: schedule.materials ?? [],
      quizzes: schedule.quizzes ?? [],
      exams: schedule.exams ?? [],
      activities: schedule.activities ?? [],
    };
  });

  return {
    studentId: canonicalStudentId,
    enrolledClasses: studentSchedule,
    totalCourses: studentSchedule.length,
  };
};

export const getScheduleDetails = async (studentId, classId) => {
  const db = await loadDb();
  const { resolvedStudent, canonicalStudentId } = resolveStudentContext(db, studentId);
  const peopleIndex = buildPeopleIndex(db);
  const allSchedules = (db.schedules ?? []).map(normalizeRecord);
  const allCourses = (db.courses ?? []).map(normalizeRecord);
  const allSubjects = (db.subjects ?? []).map(normalizeRecord);

  const schedule = allSchedules.find((s) => String(s.id) === String(classId));
  if (!schedule) return null;

  if (!resolvedStudent) return null;

  const enrolledClasses = resolvedStudent.enrolled_classes ?? resolvedStudent.enrolledClasses ?? [];
  const isEnrolled = enrolledClasses.some(
    (enrolledClassId) => toComparableString(enrolledClassId) === toComparableString(classId)
  );
  const isDirectlyAssigned = extractScheduleStudentIds(schedule).some(
    (assignedId) => assignedId === canonicalStudentId
  );

  if (!isEnrolled && !isDirectlyAssigned) return null;

  const course = resolveCourseRecord(schedule, allCourses, allSubjects);

  return {
    classId,
    courseCode: course?.code ?? schedule.courseCode ?? schedule.code,
    courseName: course?.name ?? schedule.courseName ?? schedule.name,
    section: schedule.section,
    schedule: buildScheduleLabel(schedule),
    room: schedule.room ?? 'TBD',
    faculty: resolveScheduleFacultyName(schedule, peopleIndex),
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
    const { resolvedStudent, canonicalStudentId } = resolveStudentContext(db, studentId);
    const allStudents = (db.students ?? []).map(normalizeRecord);
    const allSchedules = (db.schedules ?? []).map(normalizeRecord);

    const schedule = allSchedules.find((s) => String(s.id) === String(classId));

    if (!resolvedStudent || !schedule) return null;

    const enrolledClasses = resolvedStudent.enrolled_classes ?? resolvedStudent.enrolledClasses ?? [];
    if (enrolledClasses.some((enrolledClassId) => toComparableString(enrolledClassId) === toComparableString(classId))) {
      return resolvedStudent;
    }

    const hasConflict = enrolledClasses.some((existingClassId) => {
      const existingSchedule = allSchedules.find(
        (s) => String(s.id) === String(existingClassId)
      );
      return existingSchedule?.schedule === schedule.schedule;
    });

    if (hasConflict) return { error: 'Schedule conflict detected' };

    const timestamp = nowIso();
    const mergedClasses = Array.from(
      new Set([...enrolledClasses.map((value) => toComparableString(value)), toComparableString(classId)])
    );

    const updated = normalizeRecord({
      ...resolvedStudent,
      enrolled_classes: mergedClasses,
      enrolledClasses: mergedClasses,
      enrollment_status: 'pending-approval',
      enrollmentStatus: 'pending-approval',
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    const studentIndex = allStudents.findIndex(
      (s) => toComparableString(s.id) === canonicalStudentId
    );
    if (studentIndex === -1) return null;

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
  const peopleIndex = buildPeopleIndex(db);

  const studentResearch = allResearch.filter((research) => {
    const students = research.students ?? research.student_ids ?? [];
    return students.some((s) =>
      typeof s === 'string' ? String(s) === String(studentId) : String(s.id ?? s) === String(studentId)
    );
  });

  return studentResearch.map((research) => ({
    id: research.id,
    title: research.title,
    description: research.description ?? research.abstract,
    authors: resolvePeopleNames(research.authors ?? research.author ?? research.author_names, peopleIndex),
    year: research.year,
    status: research.status,
    adviser: resolvePeopleNames(research.adviser ?? research.advisers?.[0] ?? research.advisor ?? research.advisor_name, peopleIndex)[0] || '',
    advisers: resolvePeopleNames(research.advisers ?? research.advisors ?? research.adviser, peopleIndex),
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

    const students = research.students ?? research.student_ids ?? [];
    const isInvolved = students.some((s) =>
      typeof s === 'string' ? String(s) === String(studentId) : String(s.id ?? s) === String(studentId)
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
