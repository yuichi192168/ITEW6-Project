import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  assignFacultyEvent,
  assignFacultySubject,
  createRecord,
  deleteRecord,
  getAll,
  getById,
  getDisciplineRecords,
  listAdmins,
  messageStudent,
  query,
  reassignScheduleFaculty,
  updateRecord,
  getFacultyDashboard,
  getFacultyClasses,
  getClassDetails,
  getClassStudents,
  getGradeEntry,
  saveClassGrades,
  uploadClassMaterial,
  getTeachingLoad,
  getFacultySyllabi,
  uploadSyllabus,
  deleteSyllabus,
  getAllEvents,
  joinEvent,
  inviteStudentsToEvent,
  getFacultyResearch,
  getResearchDetails,
  getStudentProfile,
  updateStudentProfile,
  getStudentGrades,
  getStudentSchedule,
  getScheduleDetails,
  enrollStudentCourse,
  getStudentEvents,
  registerStudentEvent,
  getStudentResearch,
  updateStudentResearchStatus,
} from './store.js';

const app = express();
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/admin/users/admins', async (_request, response) => {
  const admins = await listAdmins();
  response.json(admins);
});

app.get('/student/discipline-records', async (request, response) => {
  const records = await getDisciplineRecords({
    studentId: request.query.studentId,
    email: request.query.email,
  });
  response.json(records);
});

app.put('/admin/faculty/:facultyId/assign-subject', async (request, response) => {
  const updated = await assignFacultySubject(request.params.facultyId, request.body.subject);
  if (!updated) {
    response.status(404).json({ message: 'Faculty not found' });
    return;
  }
  response.json(updated);
});

app.put('/admin/faculty/:facultyId/assign-event', async (request, response) => {
  const updated = await assignFacultyEvent(request.params.facultyId, request.body.event_id);
  if (!updated) {
    response.status(404).json({ message: 'Faculty not found' });
    return;
  }
  response.json(updated);
});

app.post('/admin/faculty/message-student', async (request, response) => {
  const message = await messageStudent(request.body);
  response.status(201).json(message);
});

app.put('/admin/schedules/:scheduleId/reassign', async (request, response) => {
  const updated = await reassignScheduleFaculty(request.params.scheduleId, request.body.faculty_id);
  if (!updated) {
    response.status(404).json({ message: 'Schedule not found' });
    return;
  }
  response.json(updated);
});

// Faculty Dashboard Routes
app.get('/faculty/:facultyId/dashboard', async (request, response) => {
  const dashboard = await getFacultyDashboard(request.params.facultyId);
  if (!dashboard) {
    response.status(404).json({ message: 'Faculty not found' });
    return;
  }
  response.json(dashboard);
});

// Faculty Classes Routes
app.get('/faculty/:facultyId/classes', async (request, response) => {
  const classes = await getFacultyClasses(request.params.facultyId);
  response.json(classes);
});

app.get('/faculty/:facultyId/classes/:classId', async (request, response) => {
  const classDetails = await getClassDetails(request.params.facultyId, request.params.classId);
  if (!classDetails) {
    response.status(404).json({ message: 'Class not found' });
    return;
  }
  response.json(classDetails);
});

app.get('/faculty/:facultyId/classes/:classId/students', async (request, response) => {
  const students = await getClassStudents(request.params.facultyId, request.params.classId);
  if (!students) {
    response.status(404).json({ message: 'Class not found' });
    return;
  }
  response.json(students);
});

app.post('/faculty/:facultyId/classes/:classId/materials', async (request, response) => {
  const material = await uploadClassMaterial(request.params.classId, request.body);
  if (!material) {
    response.status(404).json({ message: 'Class not found' });
    return;
  }
  response.status(201).json(material);
});

// Faculty Grade Entry Routes
app.get('/faculty/:facultyId/grades/:classId', async (request, response) => {
  const gradeEntry = await getGradeEntry(request.params.facultyId, request.params.classId);
  if (!gradeEntry) {
    response.status(404).json({ message: 'Class not found' });
    return;
  }
  response.json(gradeEntry);
});

app.post('/faculty/:facultyId/grades/:classId', async (request, response) => {
  const saved = await saveClassGrades(request.params.facultyId, request.params.classId, request.body.grades);
  if (!saved) {
    response.status(404).json({ message: 'Class not found' });
    return;
  }
  response.status(201).json({ message: 'Grades saved successfully', grades: saved });
});

// Faculty Teaching Load Routes
app.get('/faculty/:facultyId/teaching-load', async (request, response) => {
  const teachingLoad = await getTeachingLoad(request.params.facultyId);
  response.json(teachingLoad);
});

// Faculty Syllabus Routes
app.get('/faculty/:facultyId/syllabi', async (request, response) => {
  const syllabi = await getFacultySyllabi(request.params.facultyId);
  response.json(syllabi);
});

app.post('/faculty/:facultyId/syllabi', async (request, response) => {
  const syllabus = await uploadSyllabus(request.params.facultyId, request.body);
  if (!syllabus) {
    response.status(404).json({ message: 'Subject not found or not assigned to faculty' });
    return;
  }
  response.status(201).json(syllabus);
});

app.delete('/faculty/:facultyId/syllabi/:syllabusId', async (request, response) => {
  const deleted = await deleteSyllabus(request.params.facultyId, request.params.syllabusId);
  if (!deleted) {
    response.status(404).json({ message: 'Syllabus not found' });
    return;
  }
  response.status(204).send();
});

// Faculty Events Routes
app.get('/faculty/:facultyId/events', async (request, response) => {
  const events = await getAllEvents();
  response.json(events);
});

app.post('/faculty/:facultyId/events/:eventId/join', async (request, response) => {
  const updated = await joinEvent(request.params.facultyId, request.params.eventId);
  if (!updated) {
    response.status(404).json({ message: 'Event not found' });
    return;
  }
  response.json(updated);
});

app.post('/faculty/:facultyId/events/:eventId/invite-students', async (request, response) => {
  const updated = await inviteStudentsToEvent(request.params.facultyId, request.params.eventId, request.body.studentIds);
  if (!updated) {
    response.status(404).json({ message: 'Event not found' });
    return;
  }
  response.status(201).json(updated);
});

// Faculty Research Routes
app.get('/faculty/:facultyId/research', async (request, response) => {
  const research = await getFacultyResearch(request.params.facultyId);
  response.json(research);
});

app.get('/faculty/:facultyId/research/:researchId', async (request, response) => {
  const research = await getResearchDetails(request.params.facultyId, request.params.researchId);
  if (!research) {
    response.status(404).json({ message: 'Research not found' });
    return;
  }
  response.json(research);
});

// ==================== STUDENT ROUTES ====================

// Student Profile Routes
app.get('/student/:studentId/profile', async (request, response) => {
  const profile = await getStudentProfile(request.params.studentId);
  if (!profile) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(profile);
});

app.put('/student/:studentId/profile', async (request, response) => {
  const updated = await updateStudentProfile(request.params.studentId, request.body);
  if (!updated) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(updated);
});

// Student Grades Routes - GWA and transcript
app.get('/student/:studentId/grades', async (request, response) => {
  const grades = await getStudentGrades(request.params.studentId, request.query.term ?? 'all');
  if (!grades) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(grades);
});

// Student Schedule Routes
app.get('/student/:studentId/schedule', async (request, response) => {
  const schedule = await getStudentSchedule(request.params.studentId);
  if (!schedule) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(schedule);
});

app.get('/student/:studentId/schedule/:classId', async (request, response) => {
  const details = await getScheduleDetails(request.params.studentId, request.params.classId);
  if (!details) {
    response.status(404).json({ message: 'Class not found or not enrolled' });
    return;
  }
  response.json(details);
});

// Student Course Enrollment Routes (for irregular students)
app.post('/student/:studentId/schedule/enroll/:classId', async (request, response) => {
  const result = await enrollStudentCourse(request.params.studentId, request.params.classId);
  if (!result) {
    response.status(404).json({ message: 'Student or class not found' });
    return;
  }
  if (result.error) {
    response.status(409).json({ message: result.error });
    return;
  }
  response.status(201).json({ message: 'Enrollment pending approval', student: result });
});

// Student Events Routes
app.get('/student/:studentId/events', async (request, response) => {
  const events = await getStudentEvents(request.params.studentId);
  if (!events) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(events);
});

app.post('/student/:studentId/events/:eventId/register', async (request, response) => {
  const updated = await registerStudentEvent(request.params.studentId, request.params.eventId);
  if (!updated) {
    response.status(404).json({ message: 'Student or event not found' });
    return;
  }
  response.status(201).json({ message: 'Successfully registered for event', student: updated });
});

// Student Research Routes
app.get('/student/:studentId/research', async (request, response) => {
  const research = await getStudentResearch(request.params.studentId);
  if (!research) {
    response.status(404).json({ message: 'Student not found' });
    return;
  }
  response.json(research);
});

app.put('/student/:studentId/research/:researchId/status', async (request, response) => {
  const updated = await updateStudentResearchStatus(
    request.params.studentId,
    request.params.researchId,
    request.body.status
  );
  if (!updated) {
    response.status(404).json({ message: 'Research not found or student not involved' });
    return;
  }
  response.json(updated);
});

// ==================== ADMIN COLLECTION ROUTES ====================
app.get('/admin/:collectionName', async (request, response) => {
  const { collectionName } = request.params;
  const filters = request.query;
  const records = Object.keys(filters).length > 0
    ? await query(collectionName, filters)
    : await getAll(collectionName);

  if (records === null) {
    response.status(404).json({ message: 'Collection not found' });
    return;
  }

  response.json(records);
});

app.get('/admin/:collectionName/:id', async (request, response) => {
  const record = await getById(request.params.collectionName, request.params.id);
  if (!record) {
    response.status(404).json({ message: 'Record not found' });
    return;
  }
  response.json(record);
});

app.post('/admin/:collectionName', async (request, response) => {
  const record = await createRecord(request.params.collectionName, request.body);
  if (!record) {
    response.status(404).json({ message: 'Collection not found' });
    return;
  }
  response.status(201).json({ id: record.id, ...record });
});

app.put('/admin/:collectionName/:id', async (request, response) => {
  const record = await updateRecord(request.params.collectionName, request.params.id, request.body);
  if (!record) {
    response.status(404).json({ message: 'Record not found' });
    return;
  }
  response.json(record);
});

app.delete('/admin/:collectionName/:id', async (request, response) => {
  const deleted = await deleteRecord(request.params.collectionName, request.params.id);
  if (!deleted) {
    response.status(404).json({ message: 'Record not found' });
    return;
  }
  response.status(204).send();
});

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Node backend running on http://127.0.0.1:${port}`);
});