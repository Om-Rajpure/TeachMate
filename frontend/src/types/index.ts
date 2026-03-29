export interface Subject {
  id: number;
  name: string;
  code: string;
  subject_type: 'theory' | 'practical';
}

export interface Experiment {
  id: number;
  subject: number;
  subject_name: string;
  experiment_number: number;
  title: string;
  status: 'Pending' | 'Completed';
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
  room?: string;
  subject_type?: 'theory' | 'practical';
  subject_name?: string;
  lecture_status?: 'Completed' | 'Skipped' | null;
  lecture_id?: number;
}

export interface Lecture {
  id: number;
  timetable: number;
  date: string;
  topic?: number;
  experiment?: number;
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

export interface Chapter {
  id: number;
  subject: number;
  subject_name: string;
  name: string;
  co_covered: string;
  total_lectures_required: number;
}

export interface LecturePlan {
  id: number;
  subject: number;
  subject_name: string;
  chapter: number;
  chapter_name: string;
  lecture_number: number;
  topic_name: string;
  status: 'Pending' | 'Completed';
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

export interface MarkType {
  id: number;
  name: string;
  max_marks: number;
  subject: number;
  subject_name: string;
}

export interface Mark {
  id: number;
  student: number;
  student_name: string;
  roll_number: string;
  subject: number;
  mark_type: number;
  mark_type_name: string;
  marks_obtained: number;
  max_marks: number;
}

export interface StudentPerformance {
  id: number;
  name: string;
  roll_number: string;
  total_marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
  rank: number;
  subject_breakdown: {
    subject: string;
    percentage: number;
  }[];
}

export interface ClassAnalytics {
  class_average: number;
  total_students: number;
  toppers: StudentPerformance[];
  weak_students: StudentPerformance[];
  subject_performance: {
    subject: string;
    avg_percentage: number;
  }[];
  student_performances: StudentPerformance[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'Reminder' | 'Warning' | 'Info' | 'Success';
  is_read: boolean;
  created_at: string;
}

export interface ResourceFile {
  id: number;
  title: string;
  file: string;
  file_url: string;
  subject: number;
  subject_name: string;
  uploaded_at: string;
}
