# Faculty Additional Features API Documentation

This document describes the additional faculty endpoints for Teaching Load, Syllabus, Events, and Research.

---

## Teaching Load Endpoints

### Get Teaching Load
Retrieves all classes with teaching hours calculation and total students.

**Endpoint:** `GET /faculty/:facultyId/teaching-load`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
{
  "facultyId": "faculty-001",
  "classes": [
    {
      "id": "schedule-001",
      "code": "CS101",
      "name": "Introduction to Programming",
      "section": "A",
      "type": "lecture-only",
      "units": 3,
      "lectureHours": 3,
      "labHours": 0,
      "totalHours": 3,
      "students": 25
    },
    {
      "id": "schedule-002",
      "code": "CS201",
      "name": "Data Structures",
      "section": "B",
      "type": "lecture-lab",
      "units": 4,
      "lectureHours": 2,
      "labHours": 3,
      "totalHours": 5,
      "students": 20
    }
  ],
  "totalClasses": 2,
  "totalStudents": 45,
  "totalLectureHours": 5,
  "totalLabHours": 3,
  "totalTeachingHours": 8
}
```

**Hour Calculation:**
- **Pure Lecture** (`lecture-only`): 3 hours
- **Lecture with Lab** (`lecture-lab`): 2 hours lecture + 3 hours lab
- **Lab Only** (`lab-only`): 3 hours

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/teaching-load
```

---

## Syllabus Endpoints

### Get Faculty Syllabi
Retrieves all syllabi uploaded by faculty for their subjects.

**Endpoint:** `GET /faculty/:facultyId/syllabi`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
[
  {
    "id": "syllabus-001",
    "subject_id": "subject-001",
    "subjectName": "Introduction to Programming",
    "subjectCode": "CS101",
    "faculty_id": "faculty-001",
    "title": "Course Syllabus - CS101",
    "content": "Course description and learning objectives...",
    "url": "/syllabi/cs101-syllabus.pdf",
    "grading_scale": "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/syllabi
```

---

### Upload Syllabus
Uploads or creates a new syllabus for a subject.

**Endpoint:** `POST /faculty/:facultyId/syllabi`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Request Body:**
```json
{
  "subject_id": "subject-001",
  "title": "Course Syllabus - CS101",
  "content": "Course description and learning objectives...",
  "url": "/syllabi/cs101-syllabus.pdf",
  "grading_scale": "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60"
}
```

**Response:**
```json
{
  "id": "syllabus-001",
  "subject_id": "subject-001",
  "faculty_id": "faculty-001",
  "title": "Course Syllabus - CS101",
  "content": "Course description and learning objectives...",
  "url": "/syllabi/cs101-syllabus.pdf",
  "grading_scale": "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60",
  "created_at": "2024-01-20T14:45:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/syllabi \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "subject-001",
    "title": "Course Syllabus - CS101",
    "content": "Course description...",
    "url": "/syllabi/cs101-syllabus.pdf",
    "grading_scale": "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60"
  }'
```

---

### Delete Syllabus
Deletes a syllabus (only if faculty is the owner).

**Endpoint:** `DELETE /faculty/:facultyId/syllabi/:syllabusId`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `syllabusId` (string, required) - The unique ID of the syllabus

**Response:**
- Status: `204 No Content` on success

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/faculty/faculty-001/syllabi/syllabus-001
```

---

## Events Endpoints

### Get All Events
Retrieves all school events available for faculty to join.

**Endpoint:** `GET /faculty/:facultyId/events`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
[
  {
    "id": "event-001",
    "title": "Annual Faculty Conference",
    "description": "Conference for faculty professional development",
    "date": "2024-02-15",
    "time": "09:00 AM",
    "location": "Auditorium",
    "organizer": "Admin",
    "attendees": ["faculty-001", "faculty-002"],
    "invited_students": [],
    "created_at": "2024-01-10T10:30:00Z"
  },
  {
    "id": "event-002",
    "title": "Student Seminar",
    "description": "Seminar on emerging technologies",
    "date": "2024-02-20",
    "time": "02:00 PM",
    "location": "Conference Room",
    "organizer": "Admin",
    "attendees": [],
    "invited_students": [],
    "created_at": "2024-01-12T14:00:00Z"
  }
]
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/events
```

---

### Join Event
Faculty joins (registers for) an event.

**Endpoint:** `POST /faculty/:facultyId/events/:eventId/join`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `eventId` (string, required) - The unique ID of the event

**Response:**
```json
{
  "id": "event-001",
  "title": "Annual Faculty Conference",
  "date": "2024-02-15",
  "attendees": ["faculty-001", "faculty-002", "faculty-003"],
  "updated_at": "2024-01-25T16:20:00Z"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/events/event-001/join
```

---

### Invite Students to Event
Faculty invites students to an event.

**Endpoint:** `POST /faculty/:facultyId/events/:eventId/invite-students`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `eventId` (string, required) - The unique ID of the event

**Request Body:**
```json
{
  "studentIds": ["student-001", "student-002", "student-003"]
}
```

**Response:**
```json
{
  "id": "event-001",
  "title": "Annual Faculty Conference",
  "attendees": ["faculty-001"],
  "invited_students": ["student-001", "student-002", "student-003"],
  "updated_at": "2024-01-25T16:25:00Z"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/events/event-001/invite-students \
  -H "Content-Type: application/json" \
  -d '{
    "studentIds": ["student-001", "student-002", "student-003"]
  }'
```

---

## Research Endpoints

### Get Faculty Research
Retrieves research records where faculty is a panel member or adviser.

**Endpoint:** `GET /faculty/:facultyId/research`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
[
  {
    "id": "research-001",
    "title": "Machine Learning Applications",
    "description": "Research on ML applications in education",
    "year": 2024,
    "status": "ongoing",
    "role": "adviser",
    "category": "Adviser",
    "students": [
      {
        "id": "student-001",
        "name": "John Doe",
        "email": "john@student.edu"
      },
      {
        "id": "student-002",
        "name": "Jane Smith",
        "email": "jane@student.edu"
      }
    ],
    "studentCount": 2,
    "created_at": "2024-01-10T09:00:00Z"
  },
  {
    "id": "research-002",
    "title": "Web Development Best Practices",
    "description": "Research on current web dev practices",
    "year": 2024,
    "status": "completed",
    "role": "panel_member",
    "category": "Panel",
    "students": [
      {
        "id": "student-003",
        "name": "Bob Johnson",
        "email": "bob@student.edu"
      }
    ],
    "studentCount": 1,
    "created_at": "2024-01-05T11:30:00Z"
  }
]
```

**Roles:**
- **Adviser**: Faculty supervises/advises the research
- **Panel Member**: Faculty serves on the panel for the research

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/research
```

---

### Get Research Details
Retrieves detailed information about a specific research record.

**Endpoint:** `GET /faculty/:facultyId/research/:researchId`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `researchId` (string, required) - The unique ID of the research record

**Response:**
```json
{
  "id": "research-001",
  "title": "Machine Learning Applications",
  "description": "Research on ML applications in education",
  "abstract": "Abstract of the research...",
  "year": 2024,
  "status": "ongoing",
  "category": "Adviser",
  "details": "Detailed description of the research...",
  "panel_members": ["faculty-002", "faculty-003"],
  "advisers": ["faculty-001"],
  "students": [
    {
      "id": "student-001",
      "name": "John Doe",
      "email": "john@student.edu",
      "department": "Computer Science"
    },
    {
      "id": "student-002",
      "name": "Jane Smith",
      "email": "jane@student.edu",
      "department": "Computer Science"
    }
  ],
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-25T12:00:00Z"
}
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/research/research-001
```

---

## Data Structure Requirements

### Class/Schedule Attributes
```json
{
  "id": "schedule-001",
  "faculty_id": "faculty-001",
  "course_id": "course-001",
  "type": "lecture-only | lecture-lab | lab-only",
  "units": 3,
  "students": 25
}
```

### Syllabus Collection
```json
{
  "id": "syllabus-001",
  "subject_id": "subject-001",
  "faculty_id": "faculty-001",
  "title": "Course Syllabus",
  "content": "Full syllabus content",
  "url": "/syllabi/file.pdf",
  "grading_scale": "Grading scale info",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Event Attributes
```json
{
  "id": "event-001",
  "title": "Event Title",
  "description": "Event description",
  "date": "2024-02-15",
  "time": "09:00 AM",
  "location": "Location",
  "organizer": "Admin/Faculty name",
  "attendees": ["faculty-001"],
  "invited_students": ["student-001"]
}
```

### Research Attributes
```json
{
  "id": "research-001",
  "title": "Research Title",
  "description": "Research description",
  "abstract": "Abstract content",
  "year": 2024,
  "status": "ongoing | completed | pending",
  "panel_members": ["faculty-001"],
  "advisers": ["faculty-002"],
  "students": ["student-001", "student-002"]
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "message": "Subject not found or not assigned to faculty"
}
```

```json
{
  "message": "Event not found"
}
```

```json
{
  "message": "Research not found"
}
```

---

## Feature Summary

| Feature | Endpoints | Purpose |
|---------|-----------|---------|
| Teaching Load | 1 GET | View all classes with hour calculations |
| Syllabus | 3 (1 GET, 1 POST, 1 DELETE) | Manage course syllabi |
| Events | 3 (1 GET, 2 POST) | View events and manage participation/invites |
| Research | 2 GET | View research records and details |

---

## Integration Notes

1. **Teaching Load**: Automatically calculates based on class type and shows total hours
2. **Syllabus**: Supports file URLs and full content storage
3. **Events**: Faculty can join and invite students to events
4. **Research**: Faculty can view research they advise or are panel member for

All endpoints support proper authorization checking to ensure faculty can only access their own resources.
