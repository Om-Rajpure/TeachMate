import axios from 'axios';
import type { 
  Subject, Teacher, Division, Batch, Timetable, 
  Lecture, Student, Chapter, LecturePlan 
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add interceptor for auth if needed later

export const subjectService = {
  getAll: () => api.get<Subject[]>('/subjects/'),
  getById: (id: number) => api.get<Subject>(`/subjects/${id}/`),
  create: (data: { name: string; code: string; subject_type: string }) => api.post<Subject>('/subjects/', data),
  update: (id: number, data: Partial<Subject>) => api.put<Subject>(`/subjects/${id}/`, data),
  delete: (id: number) => api.delete(`/subjects/${id}/`),
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
  getAllStructured: () => api.get('/timetable/all_grouped/'),
  parse: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/timetable/parse/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  commit: (entries: any[]) => api.post('/timetable/commit/', entries),
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
  create: (data: any) => api.post<Lecture>('/lectures/', data),
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
  create: (data: { name: string; division_id: number; batch_id?: number; roll_number: number; subject_id: number }) => 
    api.post<Student>('/students/', data),
  update: (id: number, data: Partial<Student> & { division_id?: number; batch_id?: number; subject_id?: number }) => 
    api.put<Student>(`/students/${id}/`, data),
  delete: (id: number, subjectId?: number) => 
    api.delete(`/students/${id}/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  upload: (file: File, subjectId: number, divisionId: number, startingRoll: number, mode: 'append' | 'replace' = 'append') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId.toString());
    formData.append('division_id', divisionId.toString());
    formData.append('starting_roll', startingRoll.toString());
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
  },
  resetSyllabus: (subjectId: number) => api.post('/syllabus/lecture-plan/reset/', { subject_id: subjectId }),
  resetExperiments: (subjectId: number) => api.post('/syllabus/experiments/reset/', { subject_id: subjectId }),
  updateLecture: (id: number, data: any) => api.put(`/syllabus/lecture-plan/${id}/`, data),
  updateExperiment: (id: number, data: any) => api.put(`/syllabus/experiments/${id}/`, data),
  deleteLecture: (id: number) => api.delete(`/syllabus/lecture-plan/${id}/`),
  deleteExperiment: (id: number) => api.delete(`/syllabus/experiments/${id}/`),
  createLecture: (data: any) => api.post('/syllabus/lecture-plan/commit/', { subject_id: data.subject, entries: [data] }),
  createExperiment: (data: any) => api.post('/syllabus/experiments/commit/', { subject_id: data.subject, entries: [data] }),
  commit: (subjectId: number, entries: any[]) => api.post('/syllabus/lecture-plan/commit/', { subject_id: subjectId, entries }),
  commitExperiments: (subjectId: number, entries: any[], metadata?: { has_assignments?: boolean; has_mini_project?: boolean }) => 
    api.post('/syllabus/experiments/commit/', { subject_id: subjectId, entries, ...metadata }),
};

export const markService = {
  getTheory: (params: { subject?: number; exam_type?: string; student?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/marks/theory/?${query}`);
  },
  saveTheory: (data: {
    subject_id: number;
    exam_type: string;
    max_marks: number;
    pass_marks: number;
    date: string;
    marks: { student_id: number; marks_obtained: number }[];
    division_id: number;
    year?: string;
    branch?: string;
  }) => api.post('/marks/theory/save/', data),
  
  getPractical: (params: { subject?: number; division?: number; batch?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/marks/practical/?${query}`);
  },
  savePractical: (data: {
    subject_id: number;
    division_id: number;
    batch_id?: number;
    marks: any[];
  }) => api.post('/marks/practical/save/', data),

  upload: (data: FormData) => api.post('/marks/upload/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Dynamic Marks Engine
  getConfig: (subjectId: number) => api.get(`/marks/config/${subjectId}/`),
  save: (data: { subject_id: number; marks: { student_id: number; marks_data: any }[] }) => 
    api.post('/marks/save/', data),
  list: (subjectId: number) => api.get<any[]>(`/marks/list/${subjectId}/`),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getSubject: (id: number) => api.get(`/analytics/subject/${id}/`),
  getOverview: () => api.get('/analytics/overview/'),
  getSubjects: () => api.get('/analytics/subjects/'),
  getStudents: (subjectId: number) => api.get(`/analytics/students/?subject_id=${subjectId}`),
  getLowAttendance: () => api.get('/analytics/low-attendance/'),
  getTrend: (subjectId?: number) => api.get(`/analytics/trend/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  getClassAnalytics: (subjectId: number) => api.get(`/analytics/class_analytics/?subject_id=${subjectId}`),
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

export const resourceFileService = resourceService;

export default api;
