import axios from 'axios';
import type { Subject, Teacher, Division, Batch, Timetable, Student, SyllabusPlan, SyllabusProgress, Attendance, DashboardStats } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  getPlans: (subjectId?: number) => api.get<SyllabusPlan[]>(`/syllabus-plans/${subjectId ? `?subject=${subjectId}` : ''}`),
  createPlan: (data: Partial<SyllabusPlan>) => api.post<SyllabusPlan>('/syllabus-plans/', data),
  getProgress: (subjectId?: number) => api.get<SyllabusProgress[]>(`/syllabus-progress/${subjectId ? `?subject=${subjectId}` : ''}`),
};

export default api;
