# Role Interconnection Status Report

## Current Status: **FRAMEWORK COMPLETE**

**Date**: April 8, 2026  
**Objective**: Connect Admin, Faculty, and Student accounts through Node.js/Firebase backend

---

## What's Been Accomplished

### ✅ Backend Infrastructure

1. **Generic Admin CRUD Routes** (Already in place)
   - `/admin/:collectionName` - GET/POST/PUT/DELETE
   - Works for: users, subjects, events, announcements, research
   - Gateway function enables universal CRUD

2. **Faculty Routes** (Complete)
   - Dashboard, classes, grades, teaching load
   - Syllabi management, events, research
   - All properly endpoint-mapped to store functions

3. **Student Routes** (Complete)
   - Profile, grades, schedule, events, research
   - Enrollment, event registration
   - All properly endpoint-mapped to store functions

4. **Database Collections** (Initialized in db.json)
   - users, students, faculties, courses, grades, schedules
   - events, research, announcements, syllabi, messages
   - disciplineRecords for student conduct

### ✅ Frontend Authentication

1. **AuthContext** - Role-based routing
   - Detects admin/faculty/student from email
   - Stores user in React context
   - Firebase integration ready

2. **ProtectedRoute** - Role enforcement
   - Guards pages by role
   - Redirects to "/" if unauthorized

3. **Login Page** - Works across all roles
   - Email/password authentication
   - Automatic role routing post-login

### ✅ Frontend Pages Wired to Backend

**Student Pages** (3/8 complete):
- ✅ Profile - `GET /student/:id/profile` & `PUT /student/:id/profile`
- ✅ Grades - `GET /student/:id/grades?term=...`
- ✅ Dashboard (partial) - Fetches from backend

**Faculty Pages** (2/7 complete):
- ✅ Dashboard - `GET /faculty/:id/dashboard`
- ✅ Classes - `GET /faculty/:id/classes`

**Admin Pages** (1/9 complete):
- ✅ Users - `GET /admin/users`

---

## What Remains: Interconnection Wiring

### ⏳ Short Term (1-2 hours)

**Admin Pages** - Switch from local storage to backend

```
❌ → ✅ Students    (use /admin/:collectionName/students)
❌ → ✅ Faculty     (needs /admin/faculty & student linking)
❌ → ✅ Subjects    (already correct - verify API_BASE)
❌ → ✅ Events      (already correct - verify API_BASE)
❌ → ✅ Announcements  (create as new page calling /admin/announcements)
❌ → ✅ Research    (already correct - verify API_BASE)
❌ → ✅ Scheduling  (complex - requires schedule linking)
```

**Faculty Pages** - Complete remaining pages

```
❌ → ✅ Teaching Load     (GET /faculty/:id/teaching-load)
❌ → ✅ Grades Entry      (GET/POST /faculty/:id/grades/:classId)
❌ → ✅ Syllabi           (GET/POST /faculty/:id/syllabi)
❌ → ✅ Events            (GET / POST /faculty/:id/events/:eventId/join)
❌ → ✅ Research          (GET /faculty/:id/research)
```

**Student Pages** - Complete remaining pages

```
✅ Dashboard
✅ Profile
✅ Grades
❌ → ✅ Schedule          (GET /student/:id/schedule)
❌ → ✅ Events            (GET /student/:id/events + register)
❌ → ✅ Research          (GET /student/:id/research)
❌ → ✅ Lessons           (GET /student/:id/schedule/:classId materials)
❌ → ✅ Guidance Counseling (GET /admin/announcements + resources)
```

### ⏳ Medium Term (Optional Enhancements)

**Backend Improvements**:
1. Add authentication middleware (JWT/session validation)
2. Add role-checking middleware (ensure users can only access their data)
3. Add audit logging (who accesses what, when)
4. Add data filtering per role (backend-side security)

**Frontend Improvements**:
1. Add loading states with skeletons
2. Add error retry mechanisms
3. Add optimistic updates for better UX
4. Cache commonly accessed data

**Firebase Integration**:
1. Switch backend from JSON file to Firestore
2. Add real-time subscriptions for live updates
3. Add File Storage for uploads (syllabi, materials)
4. Add indexing for better query performance

---

## Key Interconnection Points

### Admin → Faculty

**Admin creates course** → Faculty can teach it
```
1. Admin: POST /admin/subjects {name, code, credits}
2. Store: New subject created in db.json
3. Admin: PUT /admin/faculty/:id/assign-subject
4. Faculty: GET /faculty/:id/classes → sees new course
```

**Admin assigns event** → Faculty can join it
```
1. Admin: POST /admin/events {title, date, location}
2. Faculty: GET /faculty/:id/events → sees event
3. Faculty: POST /faculty/:id/events/:eventId/join
```

### Faculty → Student

**Faculty enters grades** → Student sees updated GWA
```
1. Faculty: POST /faculty/:id/grades/:classId {grades}
2. Store: Grades saved to db.json
3. Student: GET /student/:id/grades → sees new grades & GWA
```

**Faculty uploads materials** → Student can download
```
1. Faculty: POST /faculty/:id/classes/:classId/materials {material}
2. Store: Material added to schedule entry
3. Student: GET /student/:id/schedule/:classId → sees materials
```

**Faculty invites to event** → Student gets notification
```
1. Faculty: POST /faculty/:id/events/:id/invite-students {studentIds}
2. Store: Students added to invited_students
3. Student: GET /student/:id/events → sees invitation
```

### Admin → Student

**Admin creates announcement** → All students see it
```
1. Admin: POST /admin/announcements {title, body}
2. Store: Announcement created
3. Student: GET /admin/announcements → sees announcement
```

**Admin creates event** → Students can register
```
1. Admin: POST /admin/events {title, date}
2. Student: GET /student/:id/events → sees event option
3. Student: POST /student/:id/events/:eventId/register
```

---

## To Complete Implementation

### Quick Wins (Wire remaining pages)

1. **Update AdminStudents.tsx** - Replace `studentDB` calls with `fetch('/admin/...`)`
2. **Update AdminFaculty.tsx** - Replace `facultyDB` calls with `fetch('/admin/...`)`
3. **Create API_BASE constant** - Use`'http://localhost:8080'` everywhere
4. **Update StudentSchedule** - Wire to `GET /student/:id/schedule`
5. **Update StudentEvents** - Wire to `GET /student/:id/events`
6. **Update StudentResearch** - Wire to `GET /student/:id/research`
7. **Fill StudentLessons** - Fetch from `/student/:id/schedule/:classId`

### Validation Checklist

- [ ] All admin pages use backend API
- [ ] All faculty pages use backend API
- [ ] All student pages use backend API
- [ ] Create test accounts for each role
- [ ] Test: Admin creates course → Faculty sees it
- [ ] Test: Faculty enters grade → Student sees it
- [ ] Test: Admin posts announcement → Student sees it
- [ ] Test: Student enrolls in course → Faculty sees in roster
- [ ] Test: Role-based access control (can't access other roles' pages)

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────┐
│       Firebase Auth + Local DB (db.json)            │
│       (Center of truth for all role data)           │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │   Node.js Backend (8080)   │
        │  ├─ /admin/* routes        │
        │  ├─ /faculty/* routes      │
        │  └─ /student/* routes      │
        └─────────┬──────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ↓             ↓             ↓
┌─────────┐ ┌──────────┐ ┌──────────┐
│ Admin   │ │ Faculty  │ │ Student  │
│  UI     │ │   UI     │ │   UI     │
│ React   │ │  React   │ │  React   │
└─────────┘ └──────────┘ └──────────┘
```

All connected through:
- **Shared Events** - Visible to all roles
- **Shared Announcements** - Created by admin, read by all
- **Shared Research** - Overseen by admin, managed by faculty, participated by students
- **User Management** - Admin creates, frontend auth handles routing

---

## Code Pattern for Wiring

All frontend pages should follow this pattern:

```typescript
const API_BASE = 'http://localhost:8080';

useEffect(() => {
  if (!user?.id) return;
  
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [user?.id]);
```

---

## Next Immediate Action

1. Wire **StudentSchedule.tsx** to backend
2. Wire **StudentEvents.tsx** to backend  
3. Wire **StudentResearch.tsx** to backend
4. Update **AdminStudents.tsx** to backend
5. Verify all role routes work end-to-end

After that: Add admin/faculty remaining pages.

---

## Notes for Implementation

1. **API_BASE Constant**: Use `'http://localhost:8080'` (hardcoded for now, can move to env later)
2. **User ID**: Available in `useAuth()` as `user.id` (Firebase UID)
3. **Role Checking**: Frontend handles via ProtectedRoute, backend should validate (future enhancement)
4. **Data Schema**: Matches what's already in `backend/data/db.json`
5. **CORS**: Already enabled in backend (`app.use(cors())`)

---

## Summary

The **interconnection framework is already in place**. Backend has all endpoints. Frontend auth is built. Now it's just a matter of **wiring the remaining ~12 pages** to call the backend APIs instead of local helpers.

**Estimated completion time**: 2-3 hours for full interconnection across all three roles.

**Current bottleneck**: Frontend pages still using old `studentDB`, `facultyDB`, `coursesDB` helpers instead of REST calls.

**Solution**: Systematically update each page to use `fetch()` pattern to the backend endpoints.

