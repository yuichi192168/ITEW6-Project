# Faculty Frontend Integration Guide

This guide shows how to integrate the new faculty backend endpoints with the frontend pages.

## Frontend File Structure
```
frontend--/src/pages/faculty/
├── Dashboard.tsx      (uses /faculty/:id/dashboard)
├── Classes.tsx        (uses /faculty/:id/classes)
└── Grades.tsx         (uses /faculty/:id/grades/:classId)
```

---

## 1. Dashboard.tsx Integration

### What the Backend Provides
- Faculty information
- List of assigned subjects with class count
- Total classes and students count

### API Calls
```javascript
// Get dashboard data
const response = await fetch(`/faculty/${facultyId}/dashboard`);
const dashboardData = await response.json();

// dashboardData structure:
// {
//   faculty: { id, name, email, subject },
//   subjects: [{ id, name, code, classes: number }],
//   totalClasses: number,
//   totalStudents: number
// }
```

### Update Dashboard Component
The dashboard should now:
1. Display subjects assigned to faculty
2. Show number of classes per subject
3. Calculate and display total students across all classes
4. Link each subject to class details

---

## 2. Classes.tsx Integration

### What the Backend Provides
- List of all classes assigned to faculty
- Class details including students count and schedule

### API Calls
```javascript
// Get all classes for faculty
const response = await fetch(`/faculty/${facultyId}/classes`);
const classes = await response.json();

// classes array structure:
// [{
//   id: string,
//   faculty_id: string,
//   courseCode: string,
//   courseName: string,
//   section: string,
//   students: number,
//   time: string,
//   room: string
// }]
```

### Update Classes Component
The component should:
1. Display all classes in a grid or list
2. Show students count per class
3. Provide "Manage Class" button linking to class details
4. Display class schedule and room information
5. Show year level and department filters (if available in class schedules)

---

## 3. Class Details Page (New)

### What the Backend Provides
- Class information with students list
- Uploaded course materials
- Students organized by year level and department

### API Calls
```javascript
// Get class details with students
const response = await fetch(`/faculty/${facultyId}/classes/${classId}`);
const classDetails = await response.json();

// classDetails structure:
// {
//   id: string,
//   courseName: string,
//   students: [{ id, name, email, yearLevel, department }],
//   materials: [{ id, title, type, url, uploaded_at }]
// }

// OR get just students
const studentsResponse = await fetch(`/faculty/${facultyId}/classes/${classId}/students`);
const students = await studentsResponse.json();
```

### Implement Features
1. **View Class Details**
   - Course code and name
   - Class schedule and room
   - Section number

2. **List Students** (as per wireframe)
   - Student name and ID
   - Year level and department
   - Organized in a table format

3. **Upload Materials** (as per wireframe)
   - File upload button
   - Display uploaded materials with download links
   - Show upload date/time

```javascript
// Upload material
const formData = new FormData();
formData.append('title', 'Chapter 1');
formData.append('type', 'PDF');
formData.append('url', '/materials/chapter1.pdf');

const response = await fetch(
  `/faculty/${facultyId}/classes/${classId}/materials`,
  {
    method: 'POST',
    body: JSON.stringify({
      title: 'Chapter 1',
      type: 'PDF',
      url: '/materials/chapter1.pdf',
      description: 'Introduction lecture'
    }),
    headers: { 'Content-Type': 'application/json' }
  }
);
```

---

## 4. Grades.tsx Integration

### What the Backend Provides
- Students in the class with their current grades
- Pre-calculated total grades based on:
  - **Attendance: 10%**
  - **Activity (Quizzes): 40%**
  - **Exam: 50%**

### API Calls
```javascript
// Get grade entry data
const response = await fetch(`/faculty/${facultyId}/grades/${classId}`);
const gradeData = await response.json();

// gradeData structure:
// {
//   classId: string,
//   classSchedule: { id, course_id, section, semester },
//   studentGrades: [{
//     studentId: string,
//     studentName: string,
//     email: string,
//     yearLevel: number,
//     department: string,
//     attendance: number,
//     activity: number,
//     exam: number,
//     totalGrade: number
//   }]
// }
```

### Implement Features (as per wireframe)

1. **Class Selection Dropdown**
   - Populate from `/faculty/:id/classes`
   - Show course code and section

2. **Student Grade Entry Table**
   - Columns: Student Name, ID, Year Level, Department, Attendance, Activity, Exam, Total Grade
   - Input fields for: Attendance, Activity, Exam (0-100)
   - Total Grade automatically calculated and displayed (read-only)
   - Editable cells for input

3. **Grade Calculation Display**
   - Show formula: Total = (Att × 0.1) + (Act × 0.4) + (Exam × 0.5)
   - Real-time calculation as faculty enters values
   - Display total at end of each row

4. **Save Functionality**

```javascript
// Prepare grades for saving
const gradesToSave = studentGrades.map(grade => ({
  studentId: grade.studentId,
  attendance: Number(grade.attendance),
  activity: Number(grade.activity),
  exam: Number(grade.exam)
}));

// Save grades
const response = await fetch(`/faculty/${facultyId}/grades/${classId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ grades: gradesToSave })
});

const result = await response.json();
// result: { message: "Grades saved successfully", grades: [...] }
```

---

## Sample Frontend Hook Implementation

```javascript
// hooks/useFacultyGrades.ts
import { useCallback, useState } from 'react';

export const useFacultyGrades = (facultyId: string, classId: string) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/faculty/${facultyId}/grades/${classId}`
      );
      if (!response.ok) throw new Error('Failed to fetch grades');
      
      const data = await response.json();
      setGrades(data.studentGrades);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [facultyId, classId]);

  const updateGrade = useCallback((studentId: string, field: string, value: number) => {
    setGrades(prev => prev.map(grade => 
      grade.studentId === studentId 
        ? { 
            ...grade, 
            [field]: value,
            totalGrade: calculateTotal({ ...grade, [field]: value })
          }
        : grade
    ));
  }, []);

  const saveGrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/faculty/${facultyId}/grades/${classId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grades: grades.map(g => ({
              studentId: g.studentId,
              attendance: g.attendance,
              activity: g.activity,
              exam: g.exam
            }))
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save grades');
      
      const result = await response.json();
      setError(null);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [facultyId, classId, grades]);

  return { grades, loading, error, fetchGrades, updateGrade, saveGrades };
};

// Helper function
const calculateTotal = (grade: any) => {
  return (grade.attendance * 0.1 + grade.activity * 0.4 + grade.exam * 0.5);
};
```

---

## Authentication Note

All endpoints require the faculty to be authenticated. The `facultyId` should be obtained from:
- `useAuth()` context hook
- User session data
- JWT token payload

---

## Error Handling

Always handle these error cases:

```javascript
try {
  const response = await fetch(`/faculty/${facultyId}/classes`);
  
  if (response.status === 404) {
    console.error('Faculty or resource not found');
  } else if (!response.ok) {
    const error = await response.json();
    console.error(error.message);
  } else {
    const data = await response.json();
    // Process data
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Data Synchronization

- When faculty uploads materials, refresh the class details
- When grades are saved, show success toast/notification
- Consider real-time updates for student enrollment changes

---

## Performance Tips

1. Cache class list to avoid repeated API calls
2. Paginate student list if class has many students
3. Debounce grade input to reduce API requests
4. Use React Query or similar for caching and state management

---

## Next Steps

1. Update Frontend Dashboard component to use `/faculty/:id/dashboard`
2. Create Class Details page component
3. Update Grades component to use new grade endpoints
4. Add file upload handler for materials
5. Implement real-time grade calculation
6. Add success/error notifications
7. Test with sample data in database
