import axios from 'axios';
import type { 
  Subject, Teacher, Division, Batch, Timetable, 
  Lecture, Student, Chapter, LecturePlan 
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
});

// Add interceptor for auth if needed later

export const subjectService = {
  getAll: () => api.get<Subject[]>('/subjects/'),
  getById: (id: number) => api.get<Subject>(`/subjects/${id}/`),
  create: (data: { name: string; code: string; subject_type: string }) => api.post<Subject>('/subjects/', data),
};

export const teacherService = {
  getAll: () => api.get<Teacher[]>('/teachers/'),
};

export const divisionService = {
  getAll: () => api.get<Division[]>('/divisions/'),
};

export const batchService = {
  getAll: () => api.get<Batch[]>('/batches/'),
};

export const timetableService = {
  getAll: () => api.get<Timetable[]>('/timetable/'),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/timetable/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const lectureService = {
  getAll: () => api.get<Lecture[]>('/lectures/'),
  getStats: () => api.get('/lectures/stats/'),
  getToday: () => api.get('/lectures/today/'),
  getSubjects: () => api.get<Subject[]>('/subjects/'),
  markCompleted: (timetableId: number, topicTaught: string) =>
    api.post('/lectures/', { timetable: timetableId, date: new Date().toISOString().split('T')[0], topic_taught: topicTaught, status: 'Completed' }),
  markSkipped: (timetableId: number, remarks: string) => 
    api.post('/lectures/', { timetable: timetableId, date: new Date().toISOString().split('T')[0], topic_taught: 'Skipped', status: 'Skipped', remarks }),
};

export const studentService = {
  getAll: (subjectId?: number, divisionId?: number, batchId?: number) => {
    let url = '/students/';
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId.toString());
    if (divisionId) params.append('division', divisionId.toString());
    if (batchId) params.append('batch', batchId.toString());
    return api.get<Student[]>(`${url}${params.toString() ? '?' + params.toString() : ''}`);
  },
  create: (data: { name: string; division: string; batch?: string; subject_id: number }) => 
    api.post<Student>('/students/', data),
  update: (id: number, data: Partial<Student>) => 
    api.put<Student>(`/students/${id}/`, data),
  delete: (id: number, subjectId?: number) => 
    api.delete(`/students/${id}/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  upload: (file: File, subjectId: number, mode: 'append' | 'replace' = 'append') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId.toString());
    formData.append('mode', mode);
    return api.post('/students/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getDefaulters: () => api.get<Student[]>('/students/defaulters/'),
};

export const attendanceService = {
  getCurrentClass: () => api.get('/attendance/current-class/'),
  mark: (data: { 
    subject_id: number; 
    lecture_id?: number; 
    experiment_id?: number; 
    date: string; 
    attendance: { student_id: number; status: 'P' | 'A' }[];
    mark_completed?: boolean;
  }) => api.post('/attendance/mark/', data),
  getRecords: (params: { subject_id: number; date?: string; division?: string; batch?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/attendance/?${query}`);
  },
  getSummary: (subjectId: number) => api.get(`/attendance/summary/?subject_id=${subjectId}`),
  checkExisting: (params: { subject_id: number; date: string; lecture_id?: number; experiment_id?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/attendance/check-existing/?${query}`);
  },
  getSyllabus: (subjectId: number) => api.get(`/attendance/syllabus-all/?subject_id=${subjectId}`),
};

export const syllabusService = {
  getChapters: (subjectId?: number) => api.get<Chapter[]>(`/syllabus/chapters/${subjectId ? `?subject=${subjectId}` : ''}`),
  getLecturePlans: (subjectId?: number) => api.get<LecturePlan[]>(`/syllabus/lecture-plan/${subjectId ? `?subject=${subjectId}` : ''}`),
  getExperiments: (subjectId?: number) => api.get<any[]>(`/syllabus/experiments/${subjectId ? `?subject=${subjectId}` : ''}`),
  parse: (file: File, type: 'theory' | 'practical' = 'theory') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/syllabus/lecture-plan/upload_syllabus/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const markService = {
  getTypes: () => api.get<any[]>('/mark-types/'),
  getAll: (subjectId: number) => api.get<any[]>(`/marks/?subject=${subjectId}`),
  add: (data: any) => api.post('/marks/', data),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getSubject: (id: number) => api.get(`/analytics/subject/${id}/`),
};

export const notificationService = {
  getAll: () => api.get('/notifications/'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_as_read/'),
};

export const resourceService = {
  getAll: (subjectId?: number) => api.get(`/files/${subjectId ? `?subject=${subjectId}` : ''}`),
  upload: (data: FormData) => api.post('/files/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/files/${id}/`),
};

// Aliases used by Marks.tsx and Resources.tsx
export const markTypeService = {
  getAll: (subjectId?: number) => api.get<any[]>(`/mark-types/${subjectId ? `?subject=${subjectId}` : ''}`),
  create: (data: any) => api.post('/mark-types/', data),
};

export const resourceFileService = resourceService;

export default api;
