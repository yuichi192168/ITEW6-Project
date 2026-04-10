# Faculty API Documentation

This document describes all the faculty-specific endpoints available in the Education Management System backend. These endpoints allow faculty members to manage their classes, students, and grades.

## Base URL
```
http://localhost:8080
```

## Faculty Dashboard Endpoints

### Get Faculty Dashboard
Retrieves the faculty's subjects, classes, total students, and overview information.

**Endpoint:** `GET /faculty/:facultyId/dashboard`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
{
  "faculty": {
    "id": "faculty-001",
    "name": "Dr. Smith",
    "email": "smith@university.edu",
    "subject": "Computer Science"
  },
  "subjects": [
    {
      "id": "subject-001",
      "name": "Introduction to Programming",
      "code": "CS101",
      "classes": 2
    }
  ],
  "totalClasses": 2,
  "totalStudents": 45
}
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/dashboard
```

---

## Faculty Classes Endpoints

### Get All Classes for Faculty
Retrieves all classes assigned to a faculty member.

**Endpoint:** `GET /faculty/:facultyId/classes`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member

**Response:**
```json
[
  {
    "id": "schedule-001",
    "faculty_id": "faculty-001",
    "course_id": "course-001",
    "courseName": "Introduction to Programming",
    "courseCode": "CS101",
    "section": "A",
    "time": "MWF 9:00 AM - 10:30 AM",
    "room": "Room 101",
    "students": 25,
    "semester": "Spring 2024"
  }
]
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/classes
```

---

### Get Class Details
Retrieves detailed information about a specific class including students and materials.

**Endpoint:** `GET /faculty/:facultyId/classes/:classId`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `classId` (string, required) - The unique ID of the class/schedule

**Response:**
```json
{
  "id": "schedule-001",
  "faculty_id": "faculty-001",
  "course_id": "course-001",
  "courseName": "Introduction to Programming",
  "courseCode": "CS101",
  "section": "A",
  "students": [
    {
      "id": "student-001",
      "name": "John Doe",
      "email": "john@student.edu",
      "year_level": 1,
      "department": "Computer Science"
    }
  ],
  "studentCount": 25,
  "materials": [
    {
      "id": "material-001",
      "title": "Chapter 1 - Introduction",
      "type": "PDF",
      "url": "/materials/chapter1.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/classes/schedule-001
```

---

### Get Class Students
Retrieves the list of students enrolled in a specific class.

**Endpoint:** `GET /faculty/:facultyId/classes/:classId/students`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `classId` (string, required) - The unique ID of the class/schedule

**Response:**
```json
[
  {
    "id": "student-001",
    "name": "John Doe",
    "email": "john@student.edu",
    "yearLevel": 1,
    "department": "Computer Science",
    "enrolled_classes": ["schedule-001", "schedule-002"]
  },
  {
    "id": "student-002",
    "name": "Jane Smith",
    "email": "jane@student.edu",
    "yearLevel": 2,
    "department": "Computer Science",
    "enrolled_classes": ["schedule-001"]
  }
]
```

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/classes/schedule-001/students
```

---

### Upload Class Material
Uploads or adds course materials to a class.

**Endpoint:** `POST /faculty/:facultyId/classes/:classId/materials`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `classId` (string, required) - The unique ID of the class/schedule

**Request Body:**
```json
{
  "title": "Chapter 2 - Variables",
  "type": "PDF",
  "url": "/materials/chapter2.pdf",
  "description": "Lecture notes on variables and data types"
}
```

**Response:**
```json
{
  "id": "material-002",
  "title": "Chapter 2 - Variables",
  "type": "PDF",
  "url": "/materials/chapter2.pdf",
  "description": "Lecture notes on variables and data types",
  "uploaded_at": "2024-01-20T14:45:00Z"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/classes/schedule-001/materials \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chapter 2 - Variables",
    "type": "PDF",
    "url": "/materials/chapter2.pdf",
    "description": "Lecture notes on variables and data types"
  }'
```

---

## Faculty Grade Entry Endpoints

### Get Grade Entry Data
Retrieves students in a class with their current grades for entry/editing.

**Endpoint:** `GET /faculty/:facultyId/grades/:classId`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `classId` (string, required) - The unique ID of the class/schedule

**Response:**
```json
{
  "classId": "schedule-001",
  "classSchedule": {
    "id": "schedule-001",
    "course_id": "course-001",
    "section": "A",
    "semester": "Spring 2024"
  },
  "studentGrades": [
    {
      "studentId": "student-001",
      "studentName": "John Doe",
      "email": "john@student.edu",
      "yearLevel": 1,
      "department": "Computer Science",
      "attendance": 95,
      "activity": 85,
      "exam": 88,
      "totalGrade": 88.35
    },
    {
      "studentId": "student-002",
      "studentName": "Jane Smith",
      "email": "jane@student.edu",
      "yearLevel": 2,
      "department": "Computer Science",
      "attendance": 100,
      "activity": 92,
      "exam": 95,
      "totalGrade": 94.3
    }
  ]
}
```

**Grade Calculation Formula:**
- **Total Grade = (Attendance × 0.1) + (Activity × 0.4) + (Exam × 0.5)**
  - Attendance: 10%
  - Activity (including quizzes): 40%
  - Exam: 50%

**Example Request:**
```bash
curl http://localhost:8080/faculty/faculty-001/grades/schedule-001
```

---

### Save Class Grades
Saves or updates grades for all students in a class.

**Endpoint:** `POST /faculty/:facultyId/grades/:classId`

**Parameters:**
- `facultyId` (string, required) - The unique ID of the faculty member
- `classId` (string, required) - The unique ID of the class/schedule

**Request Body:**
```json
{
  "grades": [
    {
      "studentId": "student-001",
      "attendance": 95,
      "activity": 87,
      "exam": 90
    },
    {
      "studentId": "student-002",
      "attendance": 100,
      "activity": 92,
      "exam": 95
    }
  ]
}
```

**Response:**
```json
{
  "message": "Grades saved successfully",
  "grades": [
    {
      "id": "grade-001",
      "student_id": "student-001",
      "class_id": "schedule-001",
      "attendance": 95,
      "activity": 87,
      "exam": 90,
      "updated_at": "2024-01-25T16:20:00Z"
    },
    {
      "id": "grade-002",
      "student_id": "student-002",
      "class_id": "schedule-001",
      "attendance": 100,
      "activity": 92,
      "exam": 95,
      "updated_at": "2024-01-25T16:20:00Z"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/faculty/faculty-001/grades/schedule-001 \
  -H "Content-Type: application/json" \
  -d '{
    "grades": [
      {
        "studentId": "student-001",
        "attendance": 95,
        "activity": 87,
        "exam": 90
      },
      {
        "studentId": "student-002",
        "attendance": 100,
        "activity": 92,
        "exam": 95
      }
    ]
  }'
```

---

## Error Responses

### 404 Not Found
```json
{
  "message": "Faculty not found"
}
```

```json
{
  "message": "Class not found"
}
```

---

## Implementation Notes

### Data Structure Requirements

**Subjects Collection:**
```json
{
  "id": "subject-001",
  "name": "Introduction to Programming",
  "code": "CS101",
  "facultyId": "faculty-001"
}
```

**Schedules Collection:**
```json
{
  "id": "schedule-001",
  "faculty_id": "faculty-001",
  "course_id": "course-001",
  "section": "A",
  "time": "MWF 9:00 AM - 10:30 AM",
  "room": "Room 101",
  "students": 25,
  "semester": "Spring 2024",
  "materials": []
}
```

**Students Collection:**
```json
{
  "id": "student-001",
  "name": "John Doe",
  "email": "john@student.edu",
  "year_level": 1,
  "department": "Computer Science",
  "enrolled_classes": ["schedule-001"]
}
```

**Grades Collection:**
```json
{
  "id": "grade-001",
  "student_id": "student-001",
  "class_id": "schedule-001",
  "attendance": 95,
  "activity": 87,
  "exam": 90,
  "created_at": "2024-01-25T16:20:00Z",
  "updated_at": "2024-01-25T16:20:00Z"
}
```

---

## Notes for Frontend Integration

1. **Dashboard Page**: Uses `/faculty/:facultyId/dashboard` to show subjects and overview
2. **My Classes Page**: Uses `/faculty/:facultyId/classes` to list all classes
3. **Class Details Page**: Uses `/faculty/:facultyId/classes/:classId` to show students and materials
4. **Grade Entry Page**: Uses `/faculty/:facultyId/grades/:classId` to fetch data and POST to save
5. **Total Grade Calculation**: Done on backend; frontend receives calculated values

---

## Testing

### Sample Faculty ID
For testing, use: `faculty-001`

### Sample Class ID
For testing, use: `schedule-001`

### Sample Student ID
For testing, use: `student-001`

Make sure your database has sample data in the appropriate collections before testing these endpoints.
