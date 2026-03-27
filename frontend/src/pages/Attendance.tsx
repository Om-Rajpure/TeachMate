import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Users, 
  Calendar as CalendarIcon, 
  Search, 
  Filter,
  Check,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

interface Student {
  id: number;
  name: string;
  roll_number: string;
  division_name: string;
  batch_name: string | null;
  attendance_percentage: number;
}

interface TimetableEntry {
  id: number;
  subject_details: { name: string; code: string };
  start_time: string;
  end_time: string;
  division_name: string;
  batch_name: string | null;
  lecture_status: string | null;
  lecture_id: number | null;
}

const Attendance = () => {
  const [todayLectures, setTodayLectures] = useState<TimetableEntry[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<TimetableEntry | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTodayLectures();
  }, []);

  const fetchTodayLectures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/lectures/today/`);
      setTodayLectures(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching today\'s lectures:', err);
      setLoading(false);
    }
  };

  const handleSelectLecture = async (entry: TimetableEntry) => {
    setSelectedLecture(entry);
    setLoading(true);
    try {
      // Fetch students for this division
      const divRes = await axios.get(`${API_BASE}/divisions/`);
      const targetDiv = divRes.data.find((d: any) => d.name === entry.division_name);
      
      if (targetDiv) {
        let url = `${API_BASE}/students/?division=${targetDiv.id}`;
        // If it's a batch-specific lecture, filter by batch too
        if (entry.batch_name) {
          const batchRes = await axios.get(`${API_BASE}/batches/`);
          const targetBatch = batchRes.data.find((b: any) => b.name === entry.batch_name && b.division === targetDiv.id);
          if (targetBatch) url += `&batch=${targetBatch.id}`;
        }
        
        const studentRes = await axios.get(url);
        setStudents(studentRes.data);
        
        // Default everyone to Present
        const initialMap: Record<number, string> = {};
        studentRes.data.forEach((s: Student) => {
          initialMap[s.id] = 'Present';
        });
        setAttendanceMap(initialMap);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const newMap: Record<number, string> = {};
    students.forEach(s => {
      newMap[s.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = async () => {
    if (!selectedLecture) return;
    setSubmitting(true);
    try {
      // 1. Ensure lecture is logged (Phase 1 logic compatibility)
      let lectureId = selectedLecture.lecture_id;
      if (!lectureId) {
        const lecRes = await axios.post(`${API_BASE}/lectures/`, {
          timetable: selectedLecture.id,
          date: new Date().toISOString().split('T')[0],
          status: 'Completed'
        });
        lectureId = lecRes.data.id;
      }

      // 2. Submit Bulk Attendance
      const formattedAttendance = Object.entries(attendanceMap).map(([id, status]) => ({
        student_id: parseInt(id),
        status: status
      }));

      await axios.post(`${API_BASE}/attendance/bulk/`, {
        lecture_id: lectureId,
        attendance: formattedAttendance
      });

      alert('Attendance saved successfully!');
      setSelectedLecture(null);
      fetchTodayLectures();
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: Object.values(attendanceMap).filter(v => v === 'Present').length,
    absent: Object.values(attendanceMap).filter(v => v === 'Absent').length,
    total: students.length
  };

  if (loading && !selectedLecture) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedLecture ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {todayLectures.map((lec) => (
              <button
                key={lec.id}
                onClick={() => handleSelectLecture(lec)}
                className="group relative bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CalendarIcon size={64} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                      Div {lec.division_name} {lec.batch_name ? `(${lec.batch_name})` : ''}
                    </span>
                    {lec.lecture_status === 'Completed' && (
                      <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
                        <CheckCircle2 size={14} /> Done
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text mb-1">{lec.subject_details.name}</h3>
                  <p className="text-text-muted text-sm flex items-center gap-1">
                    <CalendarIcon size={14} /> {lec.start_time} - {lec.end_time}
                  </p>
                </div>
              </button>
            ))}
            {todayLectures.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 font-medium">No lectures scheduled for today.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="marking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Header Sticky */}
            <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-md py-4 -mt-4 border-b border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <button 
                    onClick={() => setSelectedLecture(null)}
                    className="text-sm text-primary font-medium hover:underline mb-2 block"
                  >
                    ← Back to selection
                  </button>
                  <h2 className="text-2xl font-bold text-text">
                    Marking: {selectedLecture.subject_details.name}
                  </h2>
                  <p className="text-text-muted">
                    Division {selectedLecture.division_name} • {selectedLecture.start_time}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-text-muted uppercase font-bold">Total</p>
                      <p className="font-bold text-text">{stats.total}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] text-green-500 uppercase font-bold">Present</p>
                      <p className="font-bold text-green-600">{stats.present}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] text-red-500 uppercase font-bold">Absent</p>
                      <p className="font-bold text-red-600">{stats.absent}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student or roll number..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => handleMarkAll('Present')} className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors">
                  All Present
                </button>
                <button onClick={() => handleMarkAll('Absent')} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                  All Absent
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-20">
              {loading ? (
                <div className="p-12 text-center text-text-muted">Loading students...</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {student.roll_number.slice(-2)}
                        </div>
                        <div>
                          <p className="font-bold text-text group-hover:text-primary transition-colors">{student.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-text-muted">{student.roll_number}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                              student.attendance_percentage < 75 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                            )}>
                              {student.attendance_percentage}% Att.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                          <button
                            onClick={() => setAttendanceMap(prev => ({ ...prev, [student.id]: 'Present' }))}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                              attendanceMap[student.id] === 'Present' 
                                ? "bg-white text-green-600 shadow-sm" 
                                : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            <span className="flex items-center gap-1.5"><Check size={14} /> Present</span>
                          </button>
                          <button
                            onClick={() => setAttendanceMap(prev => ({ ...prev, [student.id]: 'Absent' }))}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                              attendanceMap[student.id] === 'Absent' 
                                ? "bg-white text-red-600 shadow-sm" 
                                : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            <span className="flex items-center gap-1.5"><X size={14} /> Absent</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="p-12 text-center text-text-muted">
                      No students found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Attendance;
