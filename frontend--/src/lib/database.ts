import { DocumentData } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message as string;
    if (payload?.errors && typeof payload.errors === 'object') {
      const firstKey = Object.keys(payload.errors)[0];
      if (firstKey && Array.isArray(payload.errors[firstKey]) && payload.errors[firstKey][0]) {
        return payload.errors[firstKey][0] as string;
      }
    }
  } catch (_error) {
    // ignore parse errors and use fallback
  }
  return fallback;
};

const normalizeCollectionResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    return Object.entries(payload as Record<string, unknown>).map(([id, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return { id, ...(value as Record<string, unknown>) } as T;
      }
      return { id, value } as T;
    });
  }
  return [];
};
/**
 * Generic function to get a single document by ID
 */
export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`);
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch document'));
    return await response.json();
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to get all documents from a collection
 */
export const getCollection = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}`);
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch collection'));
    const payload = await response.json();
    return normalizeCollectionResponse<T>(payload);
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to add a document to a collection
 */
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to add document'));
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to update a document
 */
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to update document'));
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete document'));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to query documents with conditions
 */
export const queryCollection = async <T extends DocumentData>(
  collectionName: string,
  conditions: Array<[string, string, any]>
): Promise<T[]> => {
  try {
    const params = new URLSearchParams();
    conditions.forEach(([field, operator, value]) => {
      if (operator === '==') {
        params.append(field, value);
      }
    });
    const queryString = params.toString();
    const url = `${API_BASE}/admin/${collectionName}${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to query collection'));
    const payload = await response.json();
    return normalizeCollectionResponse<T>(payload);
  } catch (error) {
    console.error(`Error querying collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add or update a document
 */
export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
  merge = true
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to set document');
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update specific fields in a document
 */
export const updateDocumentFields = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update document');
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocumentOld = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}/${docId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete document');
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add a new document with autogenerated ID
 */
export const addDocumentOld = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/admin/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add document');
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Batch write operations (simplified, not fully implemented for backend)
 */
export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: DocumentData;
  }>
): Promise<void> => {
  // For simplicity, perform operations sequentially
  for (const op of operations) {
    if (op.type === 'set' || op.type === 'update') {
      await updateDocument(op.collection, op.docId, op.data || {});
    } else if (op.type === 'delete') {
      await deleteDocument(op.collection, op.docId);
    }
  }
};

// Specific collection operations

/**
 * Student-specific operations
 */
export const studentDB = {
  getStudent: (studentId: string) =>
    getDocument(
      'students',
      studentId
    ),
  getAllStudents: () => getCollection('students'),
  addStudent: (data: any) => addDocument('students', data),
  updateStudent: (studentId: string, data: any) =>
    updateDocument('students', studentId, data),
  deleteStudent: (studentId: string) => deleteDocument('students', studentId),
};

/**
 * Faculty-specific operations
 */
export const facultyDB = {
  getFaculty: (facultyId: string) => getDocument('faculties', facultyId),
  getAllFaculty: () => getCollection('faculties'),
  addFaculty: (data: any) => addDocument('faculties', data),
  updateFaculty: (facultyId: string, data: any) =>
    updateDocument('faculties', facultyId, data),
  deleteFaculty: (facultyId: string) => deleteDocument('faculties', facultyId),
};

/**
 * Admin-specific operations
 */
export const adminDB = {
  getAdmin: (adminId: string) => getDocument('users', adminId),
  getAllAdmins: async () => {
    const response = await fetch(`${API_BASE}/admin/users/admins`);
    if (!response.ok) throw new Error('Failed to fetch admins');
    return await response.json();
  },
  updateAdmin: (adminId: string, data: any) =>
    updateDocument('users', adminId, data),
  deleteAdmin: (adminId: string) => deleteDocument('users', adminId),
};

/**
 * Courses operations
 */
export const coursesDB = {
  getCourse: (courseId: string) => getDocument('courses', courseId),
  getAllCourses: () => getCollection('courses'),
  addCourse: (data: any) => addDocument('courses', data),
  updateCourse: (courseId: string, data: any) =>
    updateDocument('courses', courseId, data),
  deleteCourse: (courseId: string) => deleteDocument('courses', courseId),
};

/**
 * Grades operations
 */
export const gradesDB = {
  getGrade: (gradeId: string) => getDocument('grades', gradeId),
  getStudentGrades: (studentId: string) =>
    queryCollection('grades', [['studentId', '==', studentId]]),
  getAllGrades: () => getCollection('grades'),
  updateGrade: (gradeId: string, data: any) =>
    updateDocument('grades', gradeId, data),
  deleteGrade: (gradeId: string) => deleteDocument('grades', gradeId),
};

export const schedulesDB = {
  getSchedule: (scheduleId: string) => getDocument('schedules', scheduleId),
  getAllSchedules: () => getCollection('schedules'),
  addSchedule: (data: any) => addDocument('schedules', data),
  updateSchedule: (scheduleId: string, data: any) => updateDocument('schedules', scheduleId, data),
  deleteSchedule: (scheduleId: string) => deleteDocument('schedules', scheduleId),
  reassignFaculty: (scheduleId: string, facultyId: string) =>
    fetch(`${API_BASE}/admin/schedules/${scheduleId}/reassign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faculty_id: facultyId }),
    }),
};

/**
 * Events operations
 */
export const eventsDB = {
  getEvent: (eventId: string) => getDocument('events', eventId),
  getAllEvents: () => getCollection('events'),
  addEvent: (data: any) => addDocument('events', data),
  updateEvent: (eventId: string, data: any) =>
    updateDocument('events', eventId, data),
  deleteEvent: (eventId: string) => deleteDocument('events', eventId),
};

/**
 * Research operations
 */
export const researchDB = {
  getResearch: (researchId: string) => getDocument('research', researchId),
  getAllResearch: () => getCollection('research'),
  addResearch: (data: any) => addDocument('research', data),
  updateResearch: (researchId: string, data: any) => updateDocument('research', researchId, data),
  deleteResearch: (researchId: string) => deleteDocument('research', researchId),
};

/** Announcements operations */
export const announcementsDB = {
  getAnnouncement: (announcementId: string) =>
    getDocument('announcements', announcementId),
  getAllAnnouncements: () => getCollection('announcements'),
  addAnnouncement: (data: any) => addDocument('announcements', data),
  updateAnnouncement: (announcementId: string, data: any) =>
    updateDocument('announcements', announcementId, data),
  deleteAnnouncement: (announcementId: string) =>
    deleteDocument('announcements', announcementId),
};

/** Guidance counseling / discipline records operations */
export const guidanceDB = {
  getStudentDisciplineRecords: async (studentId?: string, email?: string) => {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (email) params.append('email', email);

    const url = `${API_BASE}/student/discipline-records${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch discipline records');
    return await response.json();
  },
};