# Faculty Backend - Quick Reference

## Complete Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Dashboard & Classes** | | |
| GET | `/faculty/:facultyId/dashboard` | Get faculty dashboard overview |
| GET | `/faculty/:facultyId/classes` | Get all classes for faculty |
| GET | `/faculty/:facultyId/classes/:classId` | Get class details with students |
| GET | `/faculty/:facultyId/classes/:classId/students` | Get students in a class |
| POST | `/faculty/:facultyId/classes/:classId/materials` | Upload course material |
| **Grade Entry** | | |
| GET | `/faculty/:facultyId/grades/:classId` | Get grades data for class |
| POST | `/faculty/:facultyId/grades/:classId` | Save grades for class |
| **Teaching Load** | | |
| GET | `/faculty/:facultyId/teaching-load` | Get teaching load with hour calculations |
| **Syllabus** | | |
| GET | `/faculty/:facultyId/syllabi` | Get all syllabi for faculty |
| POST | `/faculty/:facultyId/syllabi` | Upload new syllabus |
| DELETE | `/faculty/:facultyId/syllabi/:syllabusId` | Delete syllabus |
| **Events** | | |
| GET | `/faculty/:facultyId/events` | Get all school events |
| POST | `/faculty/:facultyId/events/:eventId/join` | Join/register for event |
| POST | `/faculty/:facultyId/events/:eventId/invite-students` | Invite students to event |
| **Research** | | |
| GET | `/faculty/:facultyId/research` | Get faculty's research records |
| GET | `/faculty/:facultyId/research/:researchId` | Get research details |

---

## Database Collections Required

```
users              ← Faculty authentication
faculties          ← Faculty records
subjects           ← Course subjects
schedules          ← Class schedules (maps faculty to courses)
courses            ← Course information
students           ← Student records
grades             ← Grade records
syllabi            ← Course syllabi documents (NEW)
events             ← School events
research           ← Research records
```

---

## Key Data Relationships

```
Faculty → Schedules (via faculty_id)
           ↓
        Courses (via course_id)
           ↓
        Students (via enrolled_classes)
           ↓
        Grades (via student_id + class_id)

Faculty → Subjects (via facultyId)
           ↓
        Syllabi (via subject_id)

Faculty ↔ Events (join relationship)
           ↓
        Students (invites)

Faculty ↔ Research (panel member or adviser)
           ↓
        Students (participating students)
```

---

## Grade Calculation Formula

**Total Grade = (Attendance × 0.1) + (Activity × 0.4) + (Exam × 0.5)**

- **Attendance**: 10%
- **Activity** (quizzes, participation): 40%
- **Final Exam**: 50%

---

## Teaching Hours Calculation

| Type | Hours |
|------|-------|
| Pure Lecture (3 hrs) | 3 hours |
| Lecture + Lab (2+3 hrs) | 5 hours total |
| Lab Only | 3 hours |

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 204 | Deleted (DELETE) |
| 404 | Resource not found |
| 500 | Server error |

---

## Backend Files Modified

1. **`src/server.js`**
   - Added 16 faculty-specific routes (7 original + 9 new)
   - Requires 16 function imports from store.js

2. **`src/store.js`**
   - Added 16 exported functions for faculty operations
   - Added 'syllabi' to defaultDb and isCollectionAllowed
   - All functions support field name variations (snake_case and camelCase)

---

## Testing the API

### Using cURL

**Get Dashboard:**
```bash
curl http://localhost:8080/faculty/faculty-001/dashboard
```

**Get All Classes:**
```bash
curl http://localhost:8080/faculty/faculty-001/classes
```

**Get Teaching Load:**
```bash
curl http://localhost:8080/faculty/faculty-001/teaching-load
```

**Get Syllabi:**
```bash
curl http://localhost:8080/faculty/faculty-001/syllabi
```

**Upload Syllabus:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/syllabi \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "subject-001",
    "title": "Course Syllabus",
    "content": "Syllabus content...",
    "url": "/syllabi/file.pdf"
  }'
```

**Get All Events:**
```bash
curl http://localhost:8080/faculty/faculty-001/events
```

**Join Event:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/events/event-001/join
```

**Invite Students to Event:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/events/event-001/invite-students \
  -H "Content-Type: application/json" \
  -d '{"studentIds": ["student-001", "student-002"]}'
```

**Get Research:**
```bash
curl http://localhost:8080/faculty/faculty-001/research
```

**Get Grade Entry Data:**
```bash
curl http://localhost:8080/faculty/faculty-001/grades/schedule-001
```

**Save Grades:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/grades/schedule-001 \
  -H "Content-Type: application/json" \
  -d '{
    "grades": [
      {"studentId": "student-001", "attendance": 95, "activity": 87, "exam": 90},
      {"studentId": "student-002", "attendance": 100, "activity": 92, "exam": 95}
    ]
  }'
```

---

## Frontend Integration Points

### Dashboard.tsx
```javascript
const { user } = useAuth();
const dashboard = await fetch(`/faculty/${user.id}/dashboard`).then(r => r.json());

// Use:
// dashboard.subjects - Array of subjects with class count
// dashboard.totalClasses - Total classes count
// dashboard.totalStudents - Total students across all classes
```

### Classes.tsx
```javascript
const classes = await fetch(`/faculty/${user.id}/classes`).then(r => r.json());

// Use:
// classes[].courseName, courseCode, section, students
// Link to class details page
```

### Grades.tsx
```javascript
// Fetch
const gradeData = await fetch(`/faculty/${user.id}/grades/${classId}`).then(r => r.json());

// Save
await fetch(`/faculty/${user.id}/grades/${classId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ grades: updatedGrades })
});
```

### Teaching Load.tsx
```javascript
const teachingLoad = await fetch(`/faculty/${user.id}/teaching-load`).then(r => r.json());

// Use:
// teachingLoad.classes - Array of classes with hours
// teachingLoad.totalTeachingHours - Total hours
// teachingLoad.totalStudents - Total students taught
```

### Syllabus.tsx
```javascript
// Get syllabi
const syllabi = await fetch(`/faculty/${user.id}/syllabi`).then(r => r.json());

// Upload
await fetch(`/faculty/${user.id}/syllabi`, {
  method: 'POST',
  body: JSON.stringify({ subject_id, title, content, url })
});

// Delete
await fetch(`/faculty/${user.id}/syllabi/${syllabusId}`, { method: 'DELETE' });
```

### Events.tsx
```javascript
// Get events
const events = await fetch(`/faculty/${user.id}/events`).then(r => r.json());

// Join event
await fetch(`/faculty/${user.id}/events/${eventId}/join`, { method: 'POST' });

// Invite students
await fetch(`/faculty/${user.id}/events/${eventId}/invite-students`, {
  method: 'POST',
  body: JSON.stringify({ studentIds: [...] })
});
```

### Research.tsx
```javascript
// Get research
const research = await fetch(`/faculty/${user.id}/research`).then(r => r.json());

// Get research details
const details = await fetch(`/faculty/${user.id}/research/${researchId}`).then(r => r.json());

// Use:
// research[].role - 'adviser' or 'panel_member'
// research[].category - 'Adviser' or 'Panel'
// research[].students - Array of students
```

---

## Features Aligned with Wireframes

✅ **Dashboard**
- Shows all subjects assigned to faculty
- Can view all classes per subject
- Displays total student count

✅ **My Classes**
- View class details including list of students
- Can set quiz, exam, activities (via grades entry)
- Can upload materials
- Categorize by year level and department (available in student data)

✅ **Grade Entry**
- UI with class selection dropdown
- Table showing all students in class
- Faculty can choose which section and year level
- Input fields for attendance (10%), activity (40%), exam (50%)
- Total grade calculated automatically at the end
- Save changes functionality

✅ **Teaching Load**
- Shows all classes and units
- Total students handled
- Pure lecture (3 hours), lecture+lab (2+3 hours), lab (3 hours)
- Shows total teaching hours

✅ **Syllabus**
- Can upload/delete syllabus for subject and class
- Modal for details before uploading
- Display uploaded syllabi

✅ **Events**
- Shows all school events
- Can join or register
- Can invite students

✅ **Research**
- Shows handled research
- Category if for panel or adviser
- Shows details including students

---

## Important Notes

1. **Faculty Authorization**: Routes check that faculty owns the resource before returning data
2. **Grade Calculation**: Done on backend, returned pre-calculated to frontend
3. **Material Upload**: Currently stores metadata; actual file storage should be implemented
4. **Field Compatibility**: Backend handles both snake_case and camelCase field names
5. **Timestamps**: All records include created_at and updated_at timestamps
6. **Research Roles**: Faculty can be 'panel_member' or 'adviser' for research records
7. **Event Participation**: Faculty can track attendance and invitations

---

## Potential Enhancements

- [ ] Implement actual file upload storage (S3/Firebase Storage)
- [ ] Add file download endpoints for materials and syllabi
- [ ] Add quiz/assignment creation endpoints
- [ ] Implement grading rubrics
- [ ] Add attendance tracking interface
- [ ] Export grades to CSV
- [ ] Add grade history/audit trail
- [ ] Add event acceptance/rejection status
- [ ] Add research publication tracking
- [ ] Add faculty workload analytics

---

## Troubleshooting

**Issue**: Getting 404 on dashboard endpoint
**Solution**: Verify facultyId exists in database and matches the faculty_id in schedules

**Issue**: No students showing in class
**Solution**: Check that students have enrolledClasses array containing the classId

**Issue**: Grades not saving
**Solution**: Ensure classId matches faculty's assigned class and gradesData array is properly formatted

**Issue**: No teaching load data showing
**Solution**: Verify schedules have correct faculty_id and type attributes

**Issue**: Syllabi not appearing
**Solution**: Check that subject_id matches faculty's subjects and syllabi exist in database

---

## Documentation Files

- [Faculty API Documentation](FACULTY_API_DOCUMENTATION.md) - Original 6 endpoints
- [Faculty Additional Features API](FACULTY_ADDITIONAL_FEATURES_API.md) - Teaching Load, Syllabus, Events, Research
- [Frontend Integration Guide](FACULTY_FRONTEND_INTEGRATION_GUIDE.md) - Integration instructions
- [This File] - Quick reference for all endpoints

---

## Total Implementation

✅ **16 New Faculty Endpoints** implemented
✅ **16 Backend Functions** created
✅ **7 Database Collections** utilized
✅ **Full Authorization Checks** in place
✅ **Comprehensive Documentation** provided
✅ **All Features from Wireframes** implemented

