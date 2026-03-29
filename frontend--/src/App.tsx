import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStudents } from './pages/admin/Students';
import { AdminFaculty } from './pages/admin/Faculty';
import { AdminScheduling } from './pages/admin/Scheduling';
import { AdminSubjects } from './pages/admin/Subjects';
import { AdminEvents } from './pages/admin/Events';
import { AdminAnnouncements } from './pages/admin/Announcements';
import { AdminResearch } from './pages/admin/Research';
import { AdminUsers } from './pages/admin/Users';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentProfile } from './pages/student/Profile';
import { StudentGrades } from './pages/student/Grades';
import { StudentSchedule } from './pages/student/Schedule';
import { StudentEvents } from './pages/student/Events';
import { StudentResearch } from './pages/student/Research';
import { StudentLessons } from './pages/student/Lessons';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/Dashboard';
import { FacultyClasses } from './pages/faculty/Classes';
import { FacultyGrades } from './pages/faculty/Grades';
import { FacultyTeachingLoad } from './pages/faculty/TeachingLoad';
import { FacultySyllabus } from './pages/faculty/Syllabus';
import { FacultyEvents } from './pages/faculty/Events';
import { FacultyResearch } from './pages/faculty/Research';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Login Route */}
          <Route path="/" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/dashboard/admin"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/students"
            element={<ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/faculty"
            element={<ProtectedRoute requiredRole="admin"><AdminFaculty /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/scheduling"
            element={<ProtectedRoute requiredRole="admin"><AdminScheduling /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/subjects"
            element={<ProtectedRoute requiredRole="admin"><AdminSubjects /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/events"
            element={<ProtectedRoute requiredRole="admin"><AdminEvents /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/announcements"
            element={<ProtectedRoute requiredRole="admin"><AdminAnnouncements /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/research"
            element={<ProtectedRoute requiredRole="admin"><AdminResearch /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/users"
            element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>}
          />

          {/* Student Routes */}
          <Route
            path="/dashboard/student"
            element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/profile"
            element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/grades"
            element={<ProtectedRoute requiredRole="student"><StudentGrades /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/schedule"
            element={<ProtectedRoute requiredRole="student"><StudentSchedule /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/events"
            element={<ProtectedRoute requiredRole="student"><StudentEvents /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/research"
            element={<ProtectedRoute requiredRole="student"><StudentResearch /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/student/lessons"
            element={<ProtectedRoute requiredRole="student"><StudentLessons /></ProtectedRoute>}
          />

          {/* Faculty Routes */}
          <Route
            path="/dashboard/faculty"
            element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/classes"
            element={<ProtectedRoute requiredRole="faculty"><FacultyClasses /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/grades"
            element={<ProtectedRoute requiredRole="faculty"><FacultyGrades /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/teaching-load"
            element={<ProtectedRoute requiredRole="faculty"><FacultyTeachingLoad /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/syllabus"
            element={<ProtectedRoute requiredRole="faculty"><FacultySyllabus /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/events"
            element={<ProtectedRoute requiredRole="faculty"><FacultyEvents /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/faculty/research"
            element={<ProtectedRoute requiredRole="faculty"><FacultyResearch /></ProtectedRoute>}
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};
