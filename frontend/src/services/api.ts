import axios from 'axios';
import type { 
  Subject, Division, Batch, Timetable, Student, 
  Chapter, LecturePlan, DashboardStats,
  MarkType, Mark, ClassAnalytics, Notification, ResourceFile
} from '../types';

const API_BASE_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Auth service
export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
};

export const subjectService = {
  getAll: () => api.get<Subject[]>('/subjects/'),
  create: (data: Partial<Subject>) => api.post<Subject>('/subjects/', data),
  update: (id: number, data: Partial<Subject>) => api.put<Subject>(`/subjects/${id}/`, data),
  delete: (id: number) => api.delete(`/subjects/${id}/`),
};

export const divisionService = {
  getAll: () => api.get<Division[]>('/divisions/'),
};

export const batchService = {
  getAll: (divisionId?: number) => api.get<Batch[]>(`/batches/${divisionId ? `?division=${divisionId}` : ''}`),
};

export const timetableService = {
  exists: () => api.get<{exists: boolean}>('/timetable/exists/'),
  getAll: () => api.get<Timetable[]>('/timetable/'),
  getAllStructured: () => api.get<Record<string, Timetable[]>>('/timetable/all/'),
  getAllGrouped: () => api.get<Record<string, any[]>>('/timetable/all_grouped/'),
  getToday: () => api.get<any[]>('/timetable/today/'),
  getCurrent: () => api.get<any>('/timetable/current/'),
  parse: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<any[]>('/timetable/parse/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  commit: (data: any[]) => api.post('/timetable/commit/', data),
};

export const lectureService = {
  getAll: () => api.get('/lectures/'),
  getStats: () => api.get<DashboardStats>('/lectures/stats/'),
  getToday: () => api.get<(Timetable & { lecture_status: string; lecture_id: number })[]>('/lectures/today/'),
  getSubjects: () => api.get<Subject[]>('/subjects/'),
  create: (data: any) => api.post('/lectures/', data),
  update: (id: number, data: any) => api.put(`/lectures/${id}/`, data),
  markCompleted: (timetableId: number, topicTaught: string, remarks: string = '') => 
    api.post('/lectures/', { timetable: timetableId, topic_taught: topicTaught, status: 'Completed', remarks }),
  markSkipped: (timetableId: number, remarks: string = '') => 
    api.post('/lectures/', { timetable: timetableId, topic_taught: 'Skipped', status: 'Skipped', remarks }),
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
  bulkCreate: (data: { lecture_id: number; attendance: { student_id: number; status: string }[] }) => 
    api.post('/attendance/bulk/', data),
};

export const syllabusService = {
  getChapters: (subjectId?: number) => api.get<Chapter[]>(`/syllabus/chapters/${subjectId ? `?subject=${subjectId}` : ''}`),
  getLecturePlans: (subjectId?: number) => api.get<LecturePlan[]>(`/syllabus/lecture-plan/${subjectId ? `?subject=${subjectId}` : ''}`),
  getExperiments: (subjectId?: number) => api.get<any[]>(`/syllabus/experiments/${subjectId ? `?subject=${subjectId}` : ''}`),
  parse: (file: File, type: 'theory' | 'practical' = 'theory') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post<any[]>('/syllabus/lecture-plan/parse/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  commit: (subject_id: number, entries: any[]) => 
    api.post('/syllabus/lecture-plan/commit/', { subject_id, entries }),
  commitExperiments: (subject_id: number, entries: any[]) => 
    api.post('/syllabus/experiments/commit/', { subject_id, entries }),
  
  // New Manual Management Methods
  createLecture: (data: any) => api.post('/syllabus/lecture-plan/', data),
  updateLecture: (id: number, data: any) => api.put(`/syllabus/lecture-plan/${id}/`, data),
  deleteLecture: (id: number) => api.delete(`/syllabus/lecture-plan/${id}/`),
  
  createExperiment: (data: any) => api.post('/syllabus/experiments/', data),
  updateExperiment: (id: number, data: any) => api.put(`/syllabus/experiments/${id}/`, data),
  deleteExperiment: (id: number) => api.delete(`/syllabus/experiments/${id}/`),

  resetSyllabus: (subjectId: number) => api.post('/syllabus/lecture-plan/reset/', { subject_id: subjectId }),
  resetExperiments: (subjectId: number) => api.post('/syllabus/experiments/reset/', { subject_id: subjectId }),
};

export const markTypeService = {
  getAll: (subjectId?: number) => api.get<MarkType[]>(`/mark-types/${subjectId ? `?subject=${subjectId}` : ''}`),
  create: (data: Partial<MarkType>) => api.post<MarkType>('/mark-types/', data),
};

export const markService = {
  getAll: (params?: any) => api.get<Mark[]>('/marks/', { params }),
  bulkUpdate: (data: { subject_id: number; mark_type_id: number; marks: { student_id: number; marks_obtained: number }[] }) => 
    api.post('/marks/bulk/', data),
};

export const analyticsService = {
  getClassAnalytics: () => api.get<ClassAnalytics>('/analytics/class_analytics/'),
};

export const notificationService = {
  getAll: () => api.get<Notification[]>('/notifications/'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read/`),
  markAllAsRead: () => api.post('/notifications/read-all/'),
};

export const resourceFileService = {
  getAll: (subjectId?: number) => api.get<ResourceFile[]>('/files/', { params: { subject: subjectId } }),
  upload: (formData: FormData) => api.post<ResourceFile>('/files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/files/${id}/`),
};

export default api;
