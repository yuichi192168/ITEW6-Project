# Role Interconnection Guide - Admin, Faculty, Student

## Overview

This document explains how the **Admin**, **Faculty**, and **Student** accounts are interconnected through the Node.js/Express backend with Firebase as the unified database.

---

## Architecture: Admin ↔ Faculty ↔ Student

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase/Firestore                        │
│  (Central Database: users, students, faculty, courses,      │
│   grades, schedules, events, research, announcements)       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Node.js/Express Backend (REST API)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ /admin/*     │  │ /faculty/*   │  │ /student/*   │       │
│  │ Routes       │  │ Routes       │  │ Routes       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  store.js - CRUD & Business Logic                   │    │
│  │  - getAdminStudents()      (Admin views all)        │    │
│  │  - getAdminFaculty()       (Admin views all)        │    │
│  │  - getFacultyClasses()     (Faculty views own)      │    │
│  │  - getStudentProfile()     (Student views own)      │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────────┐  ┌──▼──────────┐  ┌─▼────────────┐
│Admin UI      │  │Faculty UI   │  │Student UI    │
│React pages   │  │React pages  │  │React pages   │
│/admin/*      │  │/faculty/*   │  │/student/*    │
└─────────────┘  └─────────────┘  └──────────────┘
```

---

## 1. Admin Role (Management & Oversight)

### What Admins Do

- **Manage Users**: Create/edit/delete students, faculty, admins
- **Manage Subjects**: Add subjects, assign to faculty
- **Manage Events**: Create system-wide events
- **Manage Announcements**: Post announcements visible to all
- **Manage Research**: Oversee research projects
- **Schedule**: Assign faculty to classes, manage student schedules

### Backend Endpoints (Admin)

```
GET    /admin/users              → All users
POST   /admin/users              → Create user
PUT    /admin/users/:userId      → Update user
DELETE /admin/users/:userId      → Delete user

GET    /admin/subjects           → All subjects
POST   /admin/subjects           → Create subject
PUT    /admin/subjects/:id       → Update subject

GET    /admin/events             → All events
POST   /admin/events             → Create event
PUT    /admin/events/:id         → Update event

GET    /admin/announcements      → All announcements
POST   /admin/announcements      → Create announcement

GET    /admin/research           → All research projects
POST   /admin/research           → Create research

(Legacy - Faculty assignment)
PUT    /admin/faculty/:id/assign-subject   → Assign subject to faculty
PUT    /admin/faculty/:id/assign-event     → Assign event to faculty
```

### Frontend Pages

- `/dashboard/admin/users` - Manage user accounts
- `/dashboard/admin/students` - View all students
- `/dashboard/admin/faculty` - Manage faculty members
- `/dashboard/admin/subjects` - Manage courses/subjects
- `/dashboard/admin/events` - Create/manage events
- `/dashboard/admin/announcements` - Post announcements
- `/dashboard/admin/scheduling` - Manage schedules
- `/dashboard/admin/research` - Oversee research projects

### Data Visibility

✅ Can view: all users, all students, all faculty  
✅ Can edit: all records  
✅ Cannot: access individual profile data outside their role

---

## 2. Faculty Role (Teaching & Assessment)

### What Faculty Do

- **Manage Classes**: View classes they teach
- **Enter Grades**: Grade students in classes
- **Manage Syllabi**: Upload course syllabi and materials
- **Track Teaching Load**: View assigned courses and hours
- **Join Events**: Register for school events
- **Manage Research**: Advise research projects, invite students

### Backend Endpoints (Faculty)

```
GET    /faculty/:facultyId/dashboard          → Dashboard data
GET    /faculty/:facultyId/classes            → Classes taught
GET    /faculty/:facultyId/classes/:classId   → Class details
GET    /faculty/:facultyId/classes/:classId/students → Class roster

GET    /faculty/:facultyId/grades/:classId    → Grade entry interface
POST   /faculty/:facultyId/grades/:classId    → Save grades

GET    /faculty/:facultyId/syllabi            → Syllabi uploaded
POST   /faculty/:facultyId/syllabi            → Upload syllabus
POST   /faculty/:facultyId/classes/:classId/materials → Upload material

GET    /faculty/:facultyId/teaching-load      → Teaching hours & load

GET    /faculty/:facultyId/events             → All events
POST   /faculty/:facultyId/events/:eventId/join → Join event
POST   /faculty/:facultyId/events/:eventId/invite-students → Invite students

GET    /faculty/:facultyId/research           → Research projects
GET    /faculty/:facultyId/research/:id       → Research details
```

### Frontend Pages

- `/dashboard/faculty` - Dashboard (classes summary)
- `/dashboard/faculty/classes` - List of taught classes
- `/dashboard/faculty/grades` - Grade entry interface
- `/dashboard/faculty/teaching-load` - Teaching hours
- `/dashboard/faculty/syllabus` - Manage course syllabi
- `/dashboard/faculty/events` - Event management
- `/dashboard/faculty/research` - Research supervision

### Data Visibility

✅ Can view: their classes, their grades, their events  
✅ Can edit: grades for their classes, syllabi, materials  
❌ Cannot: edit other faculty's data, delete users

### Interconnection with Student

- Faculty can **view students enrolled in their classes**
- Faculty can **enter grades** for students
- Faculty can **invite students to events**
- Faculty can **supervise student research**

---

## 3. Student Role (Learning & Progress)

### What Students Do

- **View Profile**: Personal academic information
- **Check Grades**: View grades and GWA
- **View Schedule**: Classes enrolled
- **Register Events**: Join school events
- **Research**: View research opportunities, participate
- **Access Materials**: Download course materials and lessons

### Backend Endpoints (Student)

```
GET    /student/:studentId/profile            → Student profile
PUT    /student/:studentId/profile            → Update profile

GET    /student/:studentId/grades             → Grades & GWA
GET    /student/:studentId/grades?term=all    → Grades by term

GET    /student/:studentId/schedule           → Enrolled classes
GET    /student/:studentId/schedule/:classId  → Class details
POST   /student/:studentId/schedule/enroll/:classId → Enroll (pending approval)

GET    /student/:studentId/events             → All events
POST   /student/:studentId/events/:eventId/register → Register event

GET    /student/:studentId/research           → Research involvement
POST   /student/:studentId/research/:id       → Update research status

GET    /admin/announcements                   → Read announcements
```

### Frontend Pages

- `/dashboard/student` - Dashboard (grades, schedule, events summary)
- `/dashboard/student/profile` - Personal profile
- `/dashboard/student/grades` - Grades and GWA
- `/dashboard/student/schedule` - Class schedule
- `/dashboard/student/events` - Event registration
- `/dashboard/student/research` - Research participation
- `/dashboard/student/lessons` - Course materials
- `/dashboard/student/guidance-counseling` - Support resources

### Data Visibility

✅ Can view: own profile, own grades, own schedule  
✅ Can edit: own profile  
❌ Cannot: view other students' data, edit grades

### Interconnection with Faculty

- Student can **see faculty teaching their classes**
- Faculty can **view student in their class roster**
- Faculty can **enter grades** students can see
- Faculty can **invite students to events**

- Can view announcements created by **Admin**
- Can see **events created by Admin or Faculty**

---

## 4. Cross-Role Data Connections

### Admin → Faculty → Student

| Admin Action | Affects Faculty | Affects Student |
|---|---|---|
| Create subject | Faculty can be assigned | Appears in student's course catalog |
| Create course | Faculty teaches it | Course available for enrollment |
| Assign faculty to class | Faculty sees in their dashboard | Shows faculty name on schedule |
| Enter event | Faculty can join | Student can register |
| Post announcement | Faculty sees | Student sees |

### Faculty → Student

| Faculty Action | Affects Student |
|---|---|
| Enter grades | Student sees updated GWA |
| Upload materials | Student can download |
| Invite to event | Student receives invitation |
| Create schedule | Student can see classes |

---

## 5. Implementation: Wiring the Interconnection

### Step 1: Ensure Backend has All Data

Backend `/backend/data/db.json` contains:

```json
{
  "users": [
    { "id": "1", "name": "Admin User", "email": "admin@school.com", "role": "admin" },
    { "id": "2", "name": "Faculty", "email": "faculty@school.com", "role": "faculty" },
    { "id": "3", "name": "Student", "email": "student@school.com", "role": "student" }
  ],
  "students": [...],
  "faculties": [...],
  "courses": [...],
  "schedules": [...],
  "grades": [...],
  "events": [...],
  "research": [...],
  "announcements": [...]
}
```

### Step 2: Admin Frontend Uses Backend

✅ **Done**: `/dashboard/admin/users` → `GET /admin/users`

**In Progress**: Wire other admin pages:
- `/dashboard/admin/subjects` → `GET /admin/subjects`
- `/dashboard/admin/students` → `GET /admin/students` (API_BASE constant)
- `/dashboard/admin/faculty` → `GET /admin/faculty` (API_BASE constant)

### Step 3: Faculty Frontend Uses Backend

✅ **Done**: 
- `/dashboard/faculty` → `GET /faculty/:id/dashboard`
- `/dashboard/faculty/classes` → `GET /faculty/:id/classes`

### Step 4: Student Frontend Uses Backend

✅ **Done**:
- `/dashboard/student/profile` → `GET /student/:id/profile` & `PUT /student/:id/profile`
- `/dashboard/student/grades` → `GET /student/:id/grades`

**In Progress**:
- `/dashboard/student/schedule` → `GET /student/:id/schedule`
- `/dashboard/student/events` → `GET /student/:id/events`
- All other student pages

---

## 6. Shared Resources Across Roles

### Events (Shared)

- **Admin** creates → `/admin/events` POST
- **Faculty** views → `/faculty/:id/events` GET
- **Faculty** can join → `/faculty/:id/events/:eventId/join` POST
- **Student** views → `/student/:id/events` GET
- **Student** can register → `/student/:id/events/:eventId/register` POST

**Frontend Access Point**: Fetch announcements at startup in `useAuth()`

### Announcements (Admin → All)

- **Admin** creates → `/admin/announcements` POST
- **Faculty** views → `/admin/announcements` GET (shared endpoint)
- **Student** views → `/admin/announcements` GET (shared endpoint)

### Research (Shared)

- **Admin** manages → `/admin/research` GET/POST/PUT/DELETE
- **Faculty** advises → `/faculty/:id/research` GET
- **Student** participates → `/student/:id/research` GET

---

## 7. Authentication Flow with Roles

### Login → Role Detection

```
User logs in with email/password
→ Firebase Auth creates session
→ AuthContext detects role from email:
   - Contains "admin" → role = "admin"
   - Contains "faculty" → role = "faculty"
   - Default → role = "student"
→ Redirect to role's dashboard:
   - /dashboard/admin
   - /dashboard/faculty
   - /dashboard/student
→ Frontend fetches role-specific data from backend
```

### ProtectedRoute Enforces Access

```jsx
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

Only users with `role === 'admin'` can access.

---

## 8. Security Assumptions

### Backend Should Validate Role

**IMPORTANT**: Backend should verify the user's role before returning data:

```javascript
// Example: Faculty should only see their classes
app.get('/faculty/:facultyId/classes', async (request, response) => {
  const { user } = request; // From middleware
  
  if (user.role !== 'faculty' || user.id !== request.params.facultyId) {
    return response.status(403).json({ message: 'Unauthorized' });
  }
  
  // Return only this faculty's classes
  const classes = await getFacultyClasses(facultyId);
  response.json(classes);
});
```

**Later Implementation** (when backend middleware is added):
- Add authentication middleware to verify JWT/session
- Add role checking middleware
- Audit data access per role

---

## 9. Quick Reference: API Endpoints by Role

### Admin Full Access

```
/admin/users/:id
/admin/subjects/:id
/admin/events/:id
/admin/announcements/:id
/admin/research/:id
/admin/faculty/:id/assign-subject
/admin/faculty/:id/assign-event
```

### Faculty Limited Access

```
/faculty/:facultyId/dashboard
/faculty/:facultyId/classes/:classId
/faculty/:facultyId/grades/:classId
/faculty/:facultyId/syllabi
/faculty/:facultyId/events/:eventId/join
/faculty/:facultyId/research/:researchId
```

### Student Limited Access

```
/student/:studentId/profile
/student/:studentId/grades
/student/:studentId/schedule
/student/:studentId/events/:eventId/register
/student/:studentId/research
```

### Shared Resources

```
/admin/events              (all users read)
/admin/announcements       (all users read)
/admin/research            (all users read, limited by role)
```

---

## 10. Next Steps

1. ✅ **Backend**: Generic CRUD routes working
2. ✅ **Frontend Auth**: Role detection working
3. ⏳ **Admin Pages**: Complete wiring to backend
4. ⏳ **Faculty Pages**: Complete wiring to backend
5. ⏳ **Student Pages**: Complete wiring to backend
6. ⏳ **Backend Middleware**: Add authentication & role validation

---

## Testing the Interconnection

### Test User Accounts

```
1. ADMIN:
   - Email: admin@school.com
   - Password: (from .env or demo)
   - Can: Create/edit students, faculty, all resources

2. FACULTY:
   - Email: faculty@school.com
   - Can: View assigned classes, enter grades, manage syllabus

3. STUDENT:
   - Email: student@school.com
   - Can: View own profile, grades, schedule, events
```

### Test scenario: Admin creates course → Faculty teaches → Student enrolls

1. **Admin** posts to `/admin/subjects` → Course created
2. **Admin** assigns faculty using `/admin/faculty/:id/assign-subject`
3. **Faculty** sees new course in `/faculty/:id/classes`
4. **Admin** creates schedule linking course to faculty class
5. **Student** sees class in `/student/:id/schedule`
6. **Student** can enroll with `/student/:id/schedule/enroll/:classId`
7. **Faculty** can see student in `/faculty/:id/classes/:classId/students`
8. **Faculty** enters grade using `/faculty/:id/grades/:classId`
9. **Student** sees grade in `/student/:id/grades`

---

End of Interconnection Guide
