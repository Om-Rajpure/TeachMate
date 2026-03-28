import axios from 'axios';
import type { 
  Subject, Teacher, Division, Batch, Timetable, Student, 
  SyllabusPlan, SyllabusProgress, Attendance, DashboardStats,
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
};

export const divisionService = {
  getAll: () => api.get<Division[]>('/divisions/'),
};

export const batchService = {
  getAll: (divisionId?: number) => api.get<Batch[]>(`/batches/${divisionId ? `?division=${divisionId}` : ''}`),
};

export const timetableService = {
  getAll: (day?: string) => api.get<Timetable[]>(`/timetable/${day ? `?day=${day}` : ''}`),
  create: (data: Partial<Timetable>) => api.post<Timetable>('/timetable/', data),
  update: (id: number, data: Partial<Timetable>) => api.put<Timetable>(`/timetable/${id}/`, data),
  delete: (id: number) => api.delete(`/timetable/${id}/`),
};

export const lectureService = {
  getAll: () => api.get('/lectures/'),
  getStats: () => api.get<DashboardStats>('/lectures/stats/'),
  getToday: () => api.get<(Timetable & { lecture_status: string; lecture_id: number })[]>('/lectures/today/'),
  create: (data: any) => api.post('/lectures/', data),
  update: (id: number, data: any) => api.put(`/lectures/${id}/`, data),
  markCompleted: (timetableId: number, topicTaught: string, remarks: string = '') => 
    api.post('/lectures/', { timetable: timetableId, topic_taught: topicTaught, status: 'Completed', remarks }),
  markSkipped: (timetableId: number, remarks: string = '') => 
    api.post('/lectures/', { timetable: timetableId, topic_taught: 'Skipped', status: 'Skipped', remarks }),
};

export const studentService = {
  getAll: (divisionId?: number, batchId?: number) => {
    let url = '/students/';
    const params = new URLSearchParams();
    if (divisionId) params.append('division', divisionId.toString());
    if (batchId) params.append('batch', batchId.toString());
    return api.get<Student[]>(`${url}${params.toString() ? '?' + params.toString() : ''}`);
  },
  getDefaulters: () => api.get<Student[]>('/students/defaulters/'),
};

export const attendanceService = {
  bulkCreate: (data: { lecture_id: number; attendance: { student_id: number; status: string }[] }) => 
    api.post('/attendance/bulk/', data),
};

export const syllabusService = {
  getPlans: (subjectId?: number) => api.get<SyllabusPlan[]>(`/syllabus/plan/${subjectId ? `?subject=${subjectId}` : ''}`),
  createPlan: (data: Partial<SyllabusPlan>) => api.post<SyllabusPlan>('/syllabus/plan/', data),
  getProgress: (subjectId?: number) => api.get<SyllabusProgress[]>(`/syllabus/progress/${subjectId ? `?subject=${subjectId}` : ''}`),
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
