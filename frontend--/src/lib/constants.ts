import { UserRole } from '../context/AuthContext';

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

export const menuItems: Record<UserRole, MenuItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/dashboard/admin', icon: 'LayoutDashboard' },
    { label: 'Students', path: '/dashboard/admin/students', icon: 'Users' },
    { label: 'Faculty', path: '/dashboard/admin/faculty', icon: 'Users2' },
    { label: 'Scheduling', path: '/dashboard/admin/scheduling', icon: 'Calendar' },
    { label: 'Subjects & Curriculum', path: '/dashboard/admin/subjects', icon: 'BookOpen' },
    { label: 'Events', path: '/dashboard/admin/events', icon: 'CalendarDays' },
    { label: 'Announcements', path: '/dashboard/admin/announcements', icon: 'Bell' },
    { label: 'Research', path: '/dashboard/admin/research', icon: 'FileText' },
    { label: 'Users', path: '/dashboard/admin/users', icon: 'Settings' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard/student', icon: 'LayoutDashboard' },
    { label: 'My Profile', path: '/dashboard/student/profile', icon: 'User' },
    { label: 'My Grades', path: '/dashboard/student/grades', icon: 'BookMarked' },
    { label: 'Schedule', path: '/dashboard/student/schedule', icon: 'Calendar' },
    { label: 'Events', path: '/dashboard/student/events', icon: 'CalendarDays' },
    { label: 'Research', path: '/dashboard/student/research', icon: 'FileText' },
    { label: 'Lessons', path: '/dashboard/student/lessons', icon: 'BookOpen' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/dashboard/faculty', icon: 'LayoutDashboard' },
    { label: 'My Classes', path: '/dashboard/faculty/classes', icon: 'Users' },
    { label: 'Grade Entry', path: '/dashboard/faculty/grades', icon: 'BookMarked' },
    { label: 'Teaching Load', path: '/dashboard/faculty/teaching-load', icon: 'Briefcase' },
    { label: 'Syllabus & Lessons', path: '/dashboard/faculty/syllabus', icon: 'BookOpen' },
    { label: 'Events', path: '/dashboard/faculty/events', icon: 'CalendarDays' },
    { label: 'Research', path: '/dashboard/faculty/research', icon: 'FileText' },
  ],
};

// Mock data for students
export const mockStudents = [
  { id: '1', name: 'John Doe', email: 'john@example.com', idNumber: '2023001', year: '3rd', program: 'BSCS' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', idNumber: '2023002', year: '2nd', program: 'BSCS' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', idNumber: '2023003', year: '4th', program: 'BSIT' },
];

// Mock data for faculty
export const mockFaculty = [
  { id: '1', name: 'Dr. Maria Garcia', email: 'maria@example.com', department: 'Computer Science', specialization: 'AI' },
  { id: '2', name: 'Prof. James Wilson', email: 'james@example.com', department: 'Computer Science', specialization: 'Web Dev' },
  { id: '3', name: 'Dr. Sarah Lee', email: 'sarah@example.com', department: 'Information Technology', specialization: 'Database' },
];

// Mock data for classes
export const mockClasses = [
  { id: '1', code: 'CS101', name: 'Introduction to Programming', section: 'A', students: 45, schedule: 'MWF 8:00-9:00 AM' },
  { id: '2', code: 'CS102', name: 'Data Structures', section: 'B', students: 40, schedule: 'TTh 10:00-11:30 AM' },
  { id: '3', code: 'CS201', name: 'Database Systems', section: 'A', students: 35, schedule: 'MWF 1:00-2:00 PM' },
];

// Mock data for grades
export const mockGrades = [
  { id: '1', studentId: '1', courseCode: 'CS101', grade: 'A', semester: 'Spring 2024' },
  { id: '2', studentId: '1', courseCode: 'CS102', grade: 'B+', semester: 'Spring 2024' },
  { id: '3', studentId: '2', courseCode: 'CS101', grade: 'A-', semester: 'Spring 2024' },
];

// Mock data for events
export const mockEvents = [
  { id: '1', title: 'Midterm Exams', date: '2024-04-15', description: 'Midterm examination period', type: 'school' },
  { id: '2', title: 'Academic Seminar', date: '2024-04-20', description: 'Computing seminar by guest speaker', type: 'department' },
  { id: '3', title: 'Final Exams', date: '2024-05-20', description: 'Final examination period', type: 'school' },
  { id: '4', title: 'Department Meeting', date: '2024-04-25', description: 'Monthly department meeting', type: 'department' },
  { id: '5', title: 'School Fair', date: '2024-05-10', description: 'Annual school fair event', type: 'school' },
];

// Mock data for announcements
export const mockAnnouncements = [
  { id: '1', title: 'New Library Hours', content: 'The library will be open extended hours during exam week.', date: '2024-04-10', admin: 'Admin' },
  { id: '2', title: 'Registration Deadline', content: 'Course registration for next semester ends on April 30th.', date: '2024-04-12', admin: 'Admin' },
  { id: '3', title: 'Campus Maintenance', content: 'Building A will be under maintenance from April 15-17.', date: '2024-04-14', admin: 'Admin' },
];

// Mock data for upcoming activities
export const mockActivities = [
  { id: '1', type: 'exam', title: 'CS101 Midterm Exam', date: '2024-04-15', time: '10:00 AM', course: 'CS101' },
  { id: '2', type: 'quiz', title: 'Data Structures Quiz', date: '2024-04-18', time: '2:00 PM', course: 'CS102' },
  { id: '3', type: 'deadline', title: 'Project Submission', date: '2024-04-22', time: '11:59 PM', course: 'CS201' },
  { id: '4', type: 'exam', title: 'Database Systems Final', date: '2024-05-20', time: '9:00 AM', course: 'CS201' },
];

// Mock data for research
export const mockResearch = [
  { id: '1', title: 'AI in Education', author: 'Dr. Maria Garcia', year: 2024, status: 'Published' },
  { id: '2', title: 'Web Security Trends', author: 'Prof. James Wilson', year: 2023, status: 'In Progress' },
];

// Mock schedule
export const mockSchedule = [
  { id: '1', day: 'Monday', time: '8:00-9:00 AM', course: 'CS101', room: 'Room 101' },
  { id: '2', day: 'Monday', time: '10:00-11:30 AM', course: 'CS102', room: 'Room 201' },
  { id: '3', day: 'Wednesday', time: '8:00-9:00 AM', course: 'CS101', room: 'Room 101' },
];
