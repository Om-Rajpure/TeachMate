import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Filter, 
  Clock, History, CheckCircle2,
  AlertCircle, ChevronRight, BookOpen,
  CalendarDays, Loader2, AlertTriangle, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceService, subjectService, studentService, divisionService, batchService } from '../services/api';
import type { Student, Subject, Division, Batch } from '../types';
import { toast } from 'react-hot-toast';
import AttendanceRecords from '../components/AttendanceRecords';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

type AttendanceMode = 'take' | 'view';
type InputMode = 'auto' | 'manual';
type ViewSubTab = 'records' | 'summary';

const Attendance = () => {
  const [mode, setMode] = useState<AttendanceMode>('take');
  const [inputMode, setInputMode] = useState<InputMode>('auto');
  const [subTab, setSubTab] = useState<ViewSubTab>('records');
  const [loading, setLoading] = useState(true);

  // Take Attendance State
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'P' | 'A'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markCompleted, setMarkCompleted] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [syllabusLoaded, setSyllabusLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Manual Mode Selection State
  const [manualForm, setManualForm] = useState({
    subject_id: '',
    lesson_id: '',
    date: formatDate(new Date())
  });
  const [syllabus, setSyllabus] = useState<any[]>([]);

  // View/Initial Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filters, setFilters] = useState({
    subject_id: '',
    date: formatDate(new Date()),
    division: '',
    batch: ''
  });
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, divisionsRes, batchesRes] = await Promise.all([
        subjectService.getAll(),
        divisionService.getAll(),
        batchService.getAll()
      ]);
      setSubjects(subjectsRes.data);
      setDivisions(divisionsRes.data);
      setBatches(batchesRes.data);

      // Auto-detect current class
      try {
        const classRes = await attendanceService.getCurrentClass();
        setCurrentClass(classRes.data);
        if (classRes.data.subject_id) {
          fetchStudentsForClass(classRes.data.subject_id);
          // Check if attendance already exists for this auto-detected slot
          checkExistingAttendance(classRes.data.subject_id, formatDate(new Date()), classRes.data.lecture_id, classRes.data.experiment_id);
        }
      } catch (err) {
        // 404 is normal if no lecture
      }
    } catch (err) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClass = async (subjectId: number) => {
    try {
      const res = await studentService.getAll(subjectId);
      const sorted = [...res.data].sort((a, b) => {
        // Null roll_numbers go to the end
        if (a.roll_number == null && b.roll_number == null) return 0;
        if (a.roll_number == null) return 1;
        if (b.roll_number == null) return -1;
        return a.roll_number - b.roll_number;
      });
      setStudents(sorted);
      // Default to all present unless overridden by checkExistingAttendance
      const initialMap: Record<number, 'P' | 'A'> = {};
      res.data.forEach(s => initialMap[s.id] = 'P');
      setAttendanceMap(initialMap);
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  const checkExistingAttendance = async (subjectId: number, date: string, lectureId?: number, expId?: number) => {
    try {
      const res = await attendanceService.checkExisting({
        subject_id: subjectId,
        date: date,
        lecture_id: lectureId,
        experiment_id: expId
      });
      if (res.data.exists) {
        setIsEditMode(true);
        const existingMap: Record<number, 'P' | 'A'> = {};
        res.data.data.forEach((rec: any) => {
          existingMap[rec.student] = rec.status;
        });
        setAttendanceMap(prev => ({ ...prev, ...existingMap }));
        toast('Attendance already exists. Switch to Edit Mode.');
      } else {
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Failed to check existing attendance', err);
    }
  };

  // Computed helpers for manual mode
  const isFutureDate = useMemo(() => {
    if (!manualForm.date) return false;
    return manualForm.date > formatDate(new Date());
  }, [manualForm.date]);

  const canSubmitManual = useMemo(() => {
    return !!manualForm.subject_id && !!manualForm.lesson_id && !!manualForm.date && students.length > 0;
  }, [manualForm.subject_id, manualForm.lesson_id, manualForm.date, students.length]);

  // Handle Manual Mode Changes
  const handleSubjectSelect = async (subjectId: string) => {
    setManualForm(prev => ({ ...prev, subject_id: subjectId, lesson_id: '' }));
    setIsEditMode(false);
    setSyllabusLoaded(false);
    if (!subjectId) {
      setSyllabus([]);
      setStudents([]);
      return;
    }
    setManualLoading(true);
    try {
      const syllabusRes = await attendanceService.getSyllabus(Number(subjectId));
      setSyllabus(syllabusRes.data);
      setSyllabusLoaded(true);
      fetchStudentsForClass(Number(subjectId));
    } catch (err) {
      toast.error('Failed to load syllabus');
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    if (inputMode === 'manual' && manualForm.subject_id && manualForm.lesson_id && manualForm.date) {
      const selectedLesson = syllabus.find(s => s.id === Number(manualForm.lesson_id));
      checkExistingAttendance(
        Number(manualForm.subject_id), 
        manualForm.date, 
        selectedLesson?.type === 'theory' ? selectedLesson.id : undefined,
        selectedLesson?.type === 'practical' ? selectedLesson.id : undefined
      );
    }
  }, [manualForm.lesson_id, manualForm.date]);

  const handleMarkAttendance = async () => {
    let subject_id, lecture_id, experiment_id, date_val;

    if (inputMode === 'auto') {
      if (!currentClass?.subject_id) return;
      subject_id = currentClass.subject_id;
      lecture_id = currentClass.lecture_id;
      experiment_id = currentClass.experiment_id;
      date_val = formatDate(new Date());
    } else {
      if (!manualForm.subject_id || !manualForm.lesson_id) {
        toast.error('Please select subject and lesson');
        return;
      }
      subject_id = Number(manualForm.subject_id);
      const selectedLesson = syllabus.find(s => s.id === Number(manualForm.lesson_id));
      lecture_id = selectedLesson?.type === 'theory' ? selectedLesson.id : undefined;
      experiment_id = selectedLesson?.type === 'practical' ? selectedLesson.id : undefined;
      date_val = manualForm.date;
    }

    setIsSubmitting(true);
    try {
      const data = {
        subject_id,
        lecture_id,
        experiment_id,
        date: date_val,
        attendance: Object.entries(attendanceMap).map(([id, status]) => ({
          student_id: Number(id),
          status: status as 'P' | 'A'
        })),
        mark_completed: markCompleted
      };
      
      console.log("Attendance Payload:", data);
      
      if (!data.attendance.length) {
        toast.error('No students in list to mark');
        setIsSubmitting(false);
        return;
      }

      await attendanceService.mark(data);
      toast.success(isEditMode ? 'Attendance updated successfully!' : 'Attendance saved successfully!');
      
      // Reset after success if needed or navigate
      setMode('view');
      setFilters(f => ({ ...f, subject_id: String(subject_id), date: date_val }));
    } catch (err: any) {
      console.error("Mark Attendance Error:", err);
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecords = async () => {
    // We can fetch all records if subject_id is not selected, 
    // but the backend refactor focuses on grouped per-session data.
    setLoading(true);
    try {
      const res = await attendanceService.getRecords({
        subject_id: filters.subject_id ? Number(filters.subject_id) : null as any,
        date: filters.date,
        division: filters.division,
        batch: filters.batch
      });
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!filters.subject_id) return;
    setLoading(true);
    try {
      const res = await attendanceService.getSummary(Number(filters.subject_id));
      setSummary(res.data.students);
    } catch (err) {
      toast.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'view') {
      if (subTab === 'records') fetchRecords();
      else fetchSummary();
    }
  }, [mode, subTab, filters]);

  const toggleStudent = (id: number) => {
    setAttendanceMap((prev: Record<number, 'P' | 'A'>) => ({
      ...prev,
      [id]: prev[id] === 'P' ? 'A' : 'P'
    }));
  };

  return (
    <div className="space-y-10 pb-12">
      {/* 1. STANDARD HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <CheckCircle2 size={14} /> Attendance Tracking
          </div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Attendance Hub</h1>
          <p className="text-text-muted font-medium">Capture real-time attendance or browse historical academic records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Mode Toggle */}
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
            <button 
                onClick={() => setMode('take')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'take' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <Users size={14} /> Take
            </button>
            <button 
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'view' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <History size={14} /> Records
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'take' ? (
          <motion.div 
            key="take"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Take Mode Sub-Toggle: Auto vs Manual */}
            <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm">
                <button 
                  onClick={() => setInputMode('auto')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    inputMode === 'auto' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  Auto Detect
                </button>
                <button 
                  onClick={() => setInputMode('manual')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    inputMode === 'manual' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  Manual Select
                </button>
            </div>

            {inputMode === 'auto' ? (
              /* Ongoing Class Card (Existing Auto UI) */
              currentClass ? (
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-primary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-primary/10 transition-colors" />
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                        <Clock size={40} className="drop-shadow-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">Active Slot</span>
                          <h2 className="text-3xl font-black text-text tracking-tight">{currentClass.subject_name}</h2>
                        </div>
                        <p className="text-text-muted font-bold text-lg flex items-center gap-2 italic">
                          <BookOpen size={18} className="text-primary/40" /> {currentClass.topic_or_title || 'Unplanned Activity'} 
                          <span className="opacity-20 mx-1">•</span>
                          <span className="text-text">{currentClass.start_time} - {currentClass.end_time}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12 border-l border-gray-100 pl-12 hidden lg:flex">
                       <div className="text-center">
                          <p className="uppercase text-[10px] font-black tracking-widest opacity-40 mb-1">Division</p>
                          <p className="text-2xl font-black text-text">{currentClass.division}</p>
                       </div>
                       {currentClass.batch && (
                         <div className="text-center">
                            <p className="uppercase text-[10px] font-black tracking-widest opacity-40 mb-1">Batch</p>
                            <p className="text-2xl font-black text-text">{currentClass.batch}</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/50 p-20 rounded-[3rem] border-2 border-dashed border-gray-200 text-center space-y-6">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-text-muted/20 border border-gray-100">
                     <AlertCircle size={48} />
                   </div>
                   <div className="max-w-md mx-auto space-y-2">
                     <h3 className="text-2xl font-black text-text italic">Quiet on the front...</h3>
                     <p className="text-text-muted font-semibold leading-relaxed">No lesson is currently scheduled on your timetable. Switch to <span className="text-primary cursor-pointer hover:underline" onClick={() => setInputMode('manual')}>Manual Mode</span> to record past sessions.</p>
                   </div>
                </div>
              )
            ) : (
              /* Manual Selection Form (New Feature) */
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-primary/5 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-full bg-primary/20 rounded-l-full opacity-5" />
                <div className="grid md:grid-cols-3 gap-8 relative">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">1. Select Subject</label>
                      <div className="relative group">
                          <select 
                            value={manualForm.subject_id}
                            onChange={(e) => handleSubjectSelect(e.target.value)}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/30 rounded-2xl outline-none font-black text-text transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Choose Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-hover:translate-x-1 transition-transform pointer-events-none" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">2. Target Session</label>
                      <div className="relative group">
                          <select 
                            disabled={!manualForm.subject_id}
                            value={manualForm.lesson_id}
                            onChange={(e) => setManualForm({...manualForm, lesson_id: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/30 rounded-2xl outline-none font-black text-text transition-all appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">{manualForm.subject_id ? '-- Select Lecture/Exp --' : 'Select subject first'}</option>
                            {syllabus.map(s => <option key={s.id} value={s.id}>{s.display}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-hover:translate-x-1 transition-transform pointer-events-none" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">3. Class Date</label>
                      <div className="relative">
                          <input 
                            type="date" 
                            value={manualForm.date}
                            onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                            className={`w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/30 rounded-2xl outline-none font-black text-text transition-all cursor-pointer ${isFutureDate ? 'ring-2 ring-amber-400/50' : ''}`}
                          />
                          <CalendarDays size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted opacity-40 pointer-events-none" />
                      </div>
                   </div>
                </div>

                {/* Future Date Warning */}
                {isFutureDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl"
                  >
                    <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-amber-700">You are marking attendance for a <span className="font-black">future date</span>. Proceed with caution.</p>
                  </motion.div>
                )}

                {/* Loading Spinner for Syllabus Fetch */}
                {manualLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <span className="ml-4 text-sm font-black text-text-muted uppercase tracking-widest">Loading syllabus...</span>
                  </div>
                )}

                {/* No Syllabus Uploaded Edge Case */}
                {!manualLoading && manualForm.subject_id && syllabusLoaded && syllabus.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-12 bg-gray-50/80 rounded-[2.5rem] border-2 border-dashed border-gray-200"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-text-muted/30">
                      <Upload size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-black text-text italic">No Syllabus Found</h4>
                      <p className="text-sm font-semibold text-text-muted">Upload a syllabus for this subject first to select lectures/experiments.</p>
                    </div>
                  </motion.div>
                )}

                {/* No Students Edge Case */}
                {!manualLoading && manualForm.subject_id && syllabusLoaded && syllabus.length > 0 && students.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-12 bg-gray-50/80 rounded-[2.5rem] border-2 border-dashed border-gray-200"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-text-muted/30">
                      <Users size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-black text-text italic">No Students Found</h4>
                      <p className="text-sm font-semibold text-text-muted">No students are linked to this subject yet. Add students first.</p>
                    </div>
                  </motion.div>
                )}

                {manualForm.lesson_id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isEditMode 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-primary/5 border-primary/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                         isEditMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-primary text-white shadow-primary/20'
                       }`}>
                          <BookOpen size={24} />
                       </div>
                       <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                            isEditMode ? 'text-amber-600' : 'text-primary'
                          }`}>
                            {isEditMode ? 'Editing Existing Attendance' : 'Syllabus Topic Detected'}
                          </p>
                          <h4 className="text-xl font-black text-text tracking-tight">
                            {syllabus.find(s => s.id === Number(manualForm.lesson_id))?.topic}
                          </h4>
                       </div>
                    </div>
                    {isEditMode && (
                      <div className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 whitespace-nowrap">
                         <History size={16} /> Edit Mode — {manualForm.date}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Student List Section */}
            {(students.length > 0) && (
              <div className="space-y-8 pb-32">
                {/* Edit Mode Banner for Manual Mode */}
                {inputMode === 'manual' && isEditMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm"
                  >
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Editing Existing Attendance</p>
                      <p className="text-sm font-semibold text-amber-600">Attendance records for <span className="font-black">{manualForm.date}</span> already exist. Your changes will update them.</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-text italic flex items-center gap-3">
                      Register Entry <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-text-muted font-bold tracking-tight text-lg not-italic opacity-40 ml-2">{students.length} on roster</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <button 
                      onClick={() => {
                        const allP: Record<number, 'P' | 'A'> = {};
                        students.forEach((s: Student) => allP[s.id] = 'P');
                        setAttendanceMap(allP);
                      }}
                      className="px-6 py-2.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      All Present
                    </button>
                    <div className="w-px h-6 bg-gray-100" />
                    <button 
                      onClick={() => {
                        const allA: Record<number, 'P' | 'A'> = {};
                        students.forEach((s: Student) => allA[s.id] = 'A');
                        setAttendanceMap(allA);
                      }}
                      className="px-6 py-2.5 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {students.map((student: Student, index: number) => (
                    <motion.div 
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                        attendanceMap[student.id] === 'P' 
                          ? 'bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/5' 
                          : 'bg-rose-50 border-rose-100 shadow-xl shadow-rose-500/5'
                      }`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <div className={`absolute top-0 right-0 p-4 transition-all ${
                         attendanceMap[student.id] === 'P' ? 'text-emerald-500 opacity-10' : 'text-rose-500 opacity-10'
                      }`}>
                         <CheckCircle2 size={64} />
                      </div>
                      <div className="relative flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shadow-lg transition-transform group-active:scale-95 ${
                             attendanceMap[student.id] === 'P' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                           }`}>
                             {student.roll_number != null ? student.roll_number : student.name.slice(0, 1).toUpperCase()}
                           </div>
                           <div className="space-y-0.5">
                             <h4 className="font-black text-text tracking-tight group-hover:text-primary transition-colors">{student.name}</h4>
                             <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{student.division_name} {student.batch_name ? `• ${student.batch_name}` : ''}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                           <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                              attendanceMap[student.id] === 'P' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                           }`}>
                              {attendanceMap[student.id] === 'P' ? 'Present' : 'Absent'}
                           </div>
                           <div className={`w-12 h-7 rounded-full relative transition-colors ${
                             attendanceMap[student.id] === 'P' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                           }`}>
                              <div className={`absolute top-1 w-5 h-5 rounded-full shadow-md transition-all duration-300 ease-out ${
                                attendanceMap[student.id] === 'P' ? 'right-1 bg-emerald-500' : 'left-1 bg-rose-500'
                              }`} />
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Floating Submission Bar */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-50">
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-text/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
                  >
                    <div className="flex items-center gap-8">
                       <div className="hidden lg:flex -space-x-4">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-text bg-gray-100 flex items-center justify-center">
                               <Users size={20} className="text-text/20" />
                            </div>
                          ))}
                       </div>
                       <div className="text-center md:text-left space-y-1">
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Ready for Commitment</p>
                          <div className="flex items-center gap-4">
                             <span className="text-emerald-400 text-2xl font-black">{Object.values(attendanceMap).filter(v => v === 'P').length} P</span>
                             <span className="text-white/20 text-2xl font-light italic">/</span>
                             <span className="text-rose-400 text-2xl font-black">{Object.values(attendanceMap).filter(v => v === 'A').length} A</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                       <label className="flex items-center gap-4 cursor-pointer group">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="peer sr-only"
                              checked={markCompleted}
                              onChange={(e) => setMarkCompleted(e.target.checked)}
                            />
                            <div className="w-10 h-6 bg-white/10 rounded-full transition-all peer-checked:bg-primary/30" />
                            <div className="absolute top-1 left-1 w-4 h-4 bg-white/40 rounded-full transition-all peer-checked:left-5 peer-checked:bg-white" />
                          </div>
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/80 transition-colors">Finish Syllabus Step</span>
                       </label>

                       <button 
                         onClick={handleMarkAttendance}
                         disabled={isSubmitting || (inputMode === 'manual' && !canSubmitManual)}
                         className="w-full md:w-64 px-10 py-5 bg-primary text-white rounded-[1.8rem] font-black shadow-2xl shadow-primary/40 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isSubmitting ? (
                           <><Loader2 size={20} className="animate-spin" /> Syncing...</>
                         ) : (
                           <>
                             {isEditMode ? 'Update' : 'Finalize'} <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                           </>
                         )}
                       </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* View Records / Summary Mode (Existing Logic Integrated) */
          <motion.div 
            key="view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Extended Filter Section */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-wrap items-center gap-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10" />
              <div className="flex-1 min-w-[240px] space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Subject Hub</label>
                <select 
                  value={filters.subject_id}
                  onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-black text-text shadow-inner transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Archive Date</label>
                <input 
                  type="date" 
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-black text-text shadow-inner transition-all cursor-pointer"
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="w-32 space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Div</label>
                  <select 
                    value={filters.division}
                    onChange={(e) => setFilters({...filters, division: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-black text-text shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">All</option>
                    {divisions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Batch</label>
                  <select 
                    value={filters.batch}
                    onChange={(e) => setFilters({...filters, batch: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-black text-text shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">All</option>
                    {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sub-tabs Selection */}
            <div className="flex gap-10 border-b border-gray-100 px-4">
              {(['records', 'summary'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] relative transition-all ${
                    subTab === tab ? 'text-primary' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab === 'records' ? 'Detailed Logs' : 'Analytics Grid'}
                  {subTab === tab && (
                    <motion.div layoutId="subTabLine" className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-t-full shadow-lg shadow-primary/40" />
                  )}
                </button>
              ))}
            </div>

            {/* Results Content */}
            {filters.subject_id ? (
              subTab === 'records' ? (
                <AttendanceRecords records={records} loading={loading} />
              ) : (
                /* Summary Grid UI (Existing Analytics) */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {summary.map((s: any, i: number) => (
                    <motion.div 
                      key={s.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-primary/5 group hover:-translate-y-2 transition-all"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center font-black text-2xl text-text-muted shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <p className={`text-4xl font-black italic tracking-tighter ${
                            s.percentage < 75 ? 'text-rose-500' : 'text-emerald-500'
                          }`}>{s.percentage}%</p>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">Attendance</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50/50 rounded-2xl space-y-3 border border-gray-100/50">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-text-muted italic opacity-60">{s.present} / {s.total_classes} Ses</span>
                              <span className={s.percentage < 75 ? 'text-rose-500' : 'text-emerald-500'}>
                                {s.percentage < 75 ? 'At Risk' : 'Healthy'}
                              </span>
                           </div>
                           <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${s.percentage}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full rounded-full shadow-sm ${
                                  s.percentage < 75 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                }`}
                              />
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              /* Empty Filter State */
              <div className="py-40 text-center bg-gray-50 rounded-[4rem] border border-gray-200 border-dashed relative">
                 <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl text-primary/10">
                    <Filter size={64} />
                 </div>
                 <h3 className="text-3xl font-black text-text italic mb-4 uppercase tracking-widest opacity-20">Awaiting Search</h3>
                 <p className="text-text-muted max-w-sm mx-auto font-black text-[10px] uppercase tracking-[0.4em] opacity-60">Pick a subject to unlock the vault</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;
