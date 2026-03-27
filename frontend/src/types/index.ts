export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
}

export interface Division {
  id: number;
  name: string;
}

export interface Batch {
  id: number;
  name: string;
  division: number;
}

export interface Timetable {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  teacher: number;
  subject: number;
  division: number;
  batch?: number;
  subject_details?: Subject;
  teacher_name?: string;
  division_name?: string;
  batch_name?: string;
  lecture_status?: 'Completed' | 'Skipped' | null;
  lecture_id?: number;
}

export interface Lecture {
  id: number;
  timetable: number;
  date: string;
  topic?: number;
  topic_name?: string;
  topic_taught: string;
  status: 'Completed' | 'Skipped';
  remarks: string;
  timetable_details?: Timetable;
}

export interface Student {
  id: number;
  name: string;
  roll_number: string;
  division: number;
  batch?: number;
  division_name: string;
  batch_name?: string;
  attendance_percentage: number;
}

export interface SyllabusPlan {
  id: number;
  subject: number;
  subject_name: string;
  topic_name: string;
  total_lectures_required: number;
}

export interface SyllabusProgress {
  id: number;
  subject: number;
  subject_name: string;
  topic_name: string;
  lectures_completed: number;
  completion_percentage: number;
}

export interface Attendance {
  id: number;
  lecture: number;
  student: number;
  status: 'Present' | 'Absent';
}

export interface DashboardStats {
  total_today: number;
  completed_today: number;
  pending_today: number;
  today_day: string;
  attendance_avg: number;
  syllabus_avg: number;
}
