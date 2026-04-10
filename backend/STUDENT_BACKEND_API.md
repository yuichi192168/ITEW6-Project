# Student Backend API Documentation

## Base URL
`http://localhost:8080`

## Overview
The Student Backend API provides endpoints for students to access their academic information, manage their courses, view schedules, track grades, participate in events, and manage research involvement.

---

## API Endpoints

### 1. Student Profile Routes

#### Get Student Profile
- **Endpoint:** `GET /student/:studentId/profile`
- **Description:** Retrieve complete student profile information
- **Parameters:** 
  - `studentId` (path) - Unique student identifier
- **Response:**
```json
{
  "id": "qWLcft5JVze7nG3LpT5VyttUgoD2",
  "name": "Mikha Lim",
  "email": "yuichi292168@gmail.com",
  "idNumber": "2203300",
  "year": "1st",
  "program": "BSCS",
  "status": "Regular",
  "phone": "09282346158",
  "address": "BRGY 5",
  "dateOfBirth": "2026-04-06",
  "skills": "basketball, communication",
  "organizations": "wew",
  "role": "student"
}
```

#### Update Student Profile
- **Endpoint:** `PUT /student/:studentId/profile`
- **Description:** Update student profile information (editable fields)
- **Parameters:** 
  - `studentId` (path) - Unique student identifier
- **Request Body:**
```json
{
  "phone": "09123456789",
  "address": "New Address",
  "skills": "updated skills",
  "organizations": "new organizations"
}
```
- **Response:** Updated student profile object

---

### 2. Student Grades Routes

#### Get Student Grades & GWA
- **Endpoint:** `GET /student/:studentId/grades`
- **Description:** Get all student grades with GWA calculation by term
- **Parameters:**
  - `studentId` (path) - Unique student identifier
  - `term` (query, optional) - Filter by term (default: 'all')
- **Response:**
```json
{
  "studentId": "qWLcft5JVze7nG3LpT5VyttUgoD2",
  "gwa": 3.45,
  "totalCourses": 5,
  "grades": [
    {
      "gradeId": "grade-123",
      "classId": "class-456",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "term": "1st Semester",
      "attendance": 88,
      "activity": 85,
      "exam": 90,
      "totalGrade": 88.5
    }
  ]
}
```

**Grade Calculation Formula:**
```
totalGrade = (attendance × 0.1) + (activity × 0.4) + (exam × 0.5)
GWA = Average of all totalGrades
```

---

### 3. Student Schedule Routes

#### Get Student Schedule
- **Endpoint:** `GET /student/:studentId/schedule`
- **Description:** Get all enrolled courses and schedules
- **Parameters:**
  - `studentId` (path) - Unique student identifier
- **Response:**
```json
{
  "studentId": "qWLcft5JVze7nG3LpT5VyttUgoD2",
  "totalCourses": 3,
  "enrolledClasses": [
    {
      "classId": "class-123",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "section": "A",
      "schedule": "MWF 9:00-10:30",
      "room": "Room 101",
      "units": 3,
      "type": "lecture",
      "materials": [],
      "quizzes": [],
      "exams": [],
      "activities": []
    }
  ]
}
```

#### Get Schedule Details & Assessments
- **Endpoint:** `GET /student/:studentId/schedule/:classId`
- **Description:** Get detailed schedule information for a specific course including materials and upcoming assessments
- **Parameters:**
  - `studentId` (path) - Unique student identifier
  - `classId` (path) - Class/Course identifier
- **Response:**
```json
{
  "classId": "class-123",
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "section": "A",
  "schedule": "MWF 9:00-10:30",
  "room": "Room 101",
  "faculty": "Dr. John Smith",
  "units": 3,
  "type": "lecture",
  "description": "Course description here",
  "materials": [
    {
      "id": "mat-123",
      "title": "Lecture Slides - Chapter 1",
      "type": "document",
      "url": "https://example.com/file.pdf",
      "uploadedAt": "2026-04-06T04:26:05.493Z"
    }
  ],
  "assessments": {
    "quizzes": [
      {
        "id": "quiz-1",
        "title": "Quiz 1",
        "dueDate": "2026-04-15",
        "status": "pending"
      }
    ],
    "exams": [
      {
        "id": "exam-1",
        "title": "Midterm Exam",
        "date": "2026-04-20",
        "time": "9:00 AM",
        "status": "upcoming"
      }
    ],
    "activities": [
      {
        "id": "activity-1",
        "title": "Group Project",
        "dueDate": "2026-04-25",
        "status": "pending"
      }
    ]
  }
}
```

#### Enroll in Course (Irregular Students)
- **Endpoint:** `POST /student/:studentId/schedule/enroll/:classId`
- **Description:** Enroll in a course (for irregular students). Checks for schedule conflicts and requires approval.
- **Parameters:**
  - `studentId` (path) - Unique student identifier
  - `classId` (path) - Class/Course identifier
- **Request Body:** (empty)
- **Response:**
```json
{
  "message": "Enrollment pending approval",
  "student": {
    "id": "qWLcft5JVze7nG3LpT5VyttUgoD2",
    "name": "Mikha Lim",
    "enrolledClasses": ["class-123", "class-456", "class-789"],
    "enrollmentStatus": "pending-approval"
  }
}
```

**Features:**
- Automatically detects schedule conflicts
- Prevents enrollment if there's a time conflict
- Sets enrollment status to "pending-approval"
- Admin must approve enrollment before it becomes active

---

### 4. Student Events Routes

#### Get Student Events
- **Endpoint:** `GET /student/:studentId/events`
- **Description:** Get all available events with registration status
- **Parameters:**
  - `studentId` (path) - Unique student identifier
- **Response:**
```json
[
  {
    "id": "event-123",
    "title": "Tech Talk 2026",
    "description": "Learn about latest technologies",
    "date": "2026-04-15",
    "time": "2:00 PM",
    "endTime": "3:30 PM",
    "location": "Auditorium",
    "type": "seminar",
    "isRegistered": true
  },
  {
    "id": "event-456",
    "title": "Career Fair",
    "description": "Meet potential employers",
    "date": "2026-04-20",
    "time": "9:00 AM",
    "endTime": "5:00 PM",
    "location": "Campus Grounds",
    "type": "career",
    "isRegistered": false
  }
]
```

#### Register for Event
- **Endpoint:** `POST /student/:studentId/events/:eventId/register`
- **Description:** Register student for an event
- **Parameters:**
  - `studentId` (path) - Unique student identifier
  - `eventId` (path) - Event identifier
- **Request Body:** (empty)
- **Response:**
```json
{
  "message": "Successfully registered for event",
  "student": {
    "id": "qWLcft5JVze7nG3LpT5VyttUgoD2",
    "registeredEvents": ["event-123", "event-456", "event-789"]
  }
}
```

---

### 5. Student Research Routes

#### Get Student Research
- **Endpoint:** `GET /student/:studentId/research`
- **Description:** Get all research projects involving the student
- **Parameters:**
  - `studentId` (path) - Unique student identifier
- **Response:**
```json
[
  {
    "id": "research-123",
    "title": "AI Applications in Healthcare",
    "description": "Research on machine learning in medical diagnosis",
    "authors": ["Mikha Lim", "John Doe"],
    "year": 2026,
    "status": "in-progress",
    "adviser": "Dr. Smith",
    "panelMembers": ["Dr. Johnson", "Dr. Williams"],
    "url": "https://example.com/research"
  }
]
```

#### Update Research Status
- **Endpoint:** `PUT /student/:studentId/research/:researchId/status`
- **Description:** Update the status of a research project (student can only update if involved)
- **Parameters:**
  - `studentId` (path) - Unique student identifier
  - `researchId` (path) - Research identifier
- **Request Body:**
```json
{
  "status": "published"
}
```
- **Valid Status Values:**
  - `draft` - Work in progress, not yet ready
  - `in-progress` - Active research
  - `published` - Research published/completed
  - `completed` - Research project concluded

- **Response:**
```json
{
  "id": "research-123",
  "title": "AI Applications in Healthcare",
  "status": "published",
  "updatedAt": "2026-04-06T04:30:00.000Z"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "message": "Student not found"
}
```

### 409 Conflict (Schedule Conflict)
```json
{
  "message": "Schedule conflict detected"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid request parameters"
}
```

---

## Authentication Notes

⚠️ **Important:** All student endpoints require that:
1. The `studentId` in the URL matches the authenticated user's ID
2. Students can only access their own data
3. Frontend should use `useAuth()` hook to get current user's ID

---

## Frontend Integration Pattern

```typescript
const { user } = useAuth(); // Get authenticated user

// Example: Get student grades
const fetchGrades = async () => {
  const response = await fetch(`http://localhost:8080/student/${user.id}/grades`);
  const data = await response.json();
  // Use data in component
};
```

---

## Database Collections Used

- `students` - Student profile data
- `grades` - Grade records (attendance, activity, exam)
- `schedules` - Course schedules and class information
- `events` - All events in the system
- `research` - Research projects
- `courses` - Course information

---

## Grade Calculation Reference

### Total Grade Formula
```
Total Grade = (Attendance × 0.1) + (Activity × 0.4) + (Exam × 0.5)
```

### GWA (Grade Weighted Average)
```
GWA = Sum of all Total Grades / Number of Courses
```

### Example
- Attendance: 80 → 80 × 0.1 = 8.0
- Activity: 85 → 85 × 0.4 = 34.0
- Exam: 90 → 90 × 0.5 = 45.0
- **Total Grade: 87.0**

---

## Schedule Conflict Detection

When enrolling in courses (irregular students), the system checks:
1. No two courses have the same time slot
2. Example conflict: Cannot enroll in both "MWF 9:00-10:30" courses
3. If conflict detected, enrollment is rejected with error message
4. Enrollment still requires admin approval even without conflicts

---

## Data Validation

### Student Profile Update
- ✅ Phone: Any format, max 20 characters
- ✅ Address: Max 255 characters
- ✅ Skills: Comma-separated, max 500 characters
- ✅ Organizations: Comma-separated, max 500 characters
- ❌ Cannot update: ID, Email, Program, Status, Year

### Immutable Fields
The following fields cannot be changed by students:
- `id` - Student ID
- `email` - Email address
- `idNumber` - Student ID number
- `program` - Academic program
- `year` - Year level
- `status` - Enrollment status (only admin can change)

---

## Rate Limiting

No rate limiting currently implemented. Production deployment should consider:
- 100 requests/minute per student
- 1000 requests/minute per server

---

## Pagination

Endpoints returning lists (events, research, schedule) currently return all items. For large datasets, consider:
- Limiting to 20 items per page
- Adding `?page=1&limit=20` query parameters
- Implementing cursor-based pagination

---

## Testing Endpoints

### Using cURL

```bash
# Get student profile
curl http://localhost:8080/student/qWLcft5JVze7nG3LpT5VyttUgoD2/profile

# Update profile
curl -X PUT http://localhost:8080/student/qWLcft5JVze7nG3LpT5VyttUgoD2/profile \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# Get grades
curl http://localhost:8080/student/qWLcft5JVze7nG3LpT5VyttUgoD2/grades

# Get schedule
curl http://localhost:8080/student/qWLcft5JVze7nG3LpT5VyttUgoD2/schedule

# Register for event
curl -X POST http://localhost:8080/student/qWLcft5JVze7nG3LpT5VyttUgoD2/events/event-123/register
```

---

## Version
- API Version: 1.0
- Last Updated: April 2026
- Backend: Node.js Express
- Database: JSON file (Firebase compatible)
