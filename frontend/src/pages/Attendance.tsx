import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Filter, 
  Clock, Save, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceService, subjectService, studentService, divisionService, batchService } from '../services/api';
import type { Student, Subject, Division, Batch } from '../types';
import { toast } from 'react-toastify';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

type AttendanceMode = 'take' | 'view';
type ViewSubTab = 'records' | 'summary';

const Attendance = () => {
  const [mode, setMode] = useState<AttendanceMode>('take');
  const [subTab, setSubTab] = useState<ViewSubTab>('records');
  const [loading, setLoading] = useState(true);

  // Take Attendance State
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'P' | 'A'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markCompleted, setMarkCompleted] = useState(true);

  // View Attendance State
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
      setStudents(res.data);
      const initialMap: Record<number, 'P' | 'A'> = {};
      res.data.forEach(s => initialMap[s.id] = 'P');
      setAttendanceMap(initialMap);
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  const handleMarkAttendance = async () => {
    if (!currentClass?.subject_id) return;
    setIsSubmitting(true);
    try {
      const data = {
        subject_id: currentClass.subject_id as number,
        lecture_id: currentClass.lecture_id as number | undefined,
        experiment_id: currentClass.experiment_id as number | undefined,
        date: formatDate(new Date()),
        attendance: Object.entries(attendanceMap).map(([id, status]) => ({
          student_id: Number(id),
          status: status as 'P' | 'A'
        })),
        mark_completed: markCompleted
      };
      await attendanceService.mark(data);
      toast.success('Attendance marked successfully!');
      setMode('view');
      setFilters((f: any) => ({ ...f, subject_id: String(currentClass.subject_id) }));
      fetchRecords();
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecords = async () => {
    if (!filters.subject_id) return;
    setLoading(true);
    try {
      const res = await attendanceService.getRecords({
        subject_id: Number(filters.subject_id),
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-text">Attendance</h1>
          <p className="text-text-muted font-medium italic">Track student presence and progress</p>
        </div>

        <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full md:w-fit">
          <button 
            onClick={() => setMode('take')}
            className={`flex-1 md:w-40 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'take' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <Users size={16} /> Take
          </button>
          <button 
            onClick={() => setMode('view')}
            className={`flex-1 md:w-40 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'view' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <History size={16} /> View
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'take' ? (
          <motion.div 
            key="take"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Ongoing Class Card */}
            {currentClass ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center">
                      <Clock size={32} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Ongoing</span>
                        <h2 className="text-2xl font-black text-text">{currentClass.subject_name}</h2>
                      </div>
                      <p className="text-text-muted font-bold flex items-center gap-2">
                        <Calendar size={14} /> {currentClass.topic_or_title || 'General Session'} 
                        <span className="opacity-20">•</span>
                        {currentClass.start_time} - {currentClass.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm font-bold text-text-muted border-l border-gray-100 pl-8 hidden md:flex">
                     <div>
                        <p className="uppercase text-[10px] tracking-widest opacity-60">Division</p>
                        <p className="text-text">{currentClass.division}</p>
                     </div>
                     {currentClass.batch && (
                       <div>
                          <p className="uppercase text-[10px] tracking-widest opacity-60">Batch</p>
                          <p className="text-text">{currentClass.batch}</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50/50 p-12 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                  <Clock size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-muted">No Ongoing Class Detected</h3>
                  <p className="text-sm text-text-muted/60 max-w-sm mx-auto italic font-medium">Please check your timetable or select a subject manually to mark attendance.</p>
                </div>
                <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm hover:border-primary/30 transition-all shadow-sm">
                  Manual Select Subject
                </button>
              </div>
            )}

            {/* Student List */}
            {students.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text flex items-center gap-2">
                    Mark Students <span className="text-primary">•</span> <span className="text-text-muted font-medium">{students.length} Total</span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const allP: Record<number, 'P' | 'A'> = {};
                        students.forEach((s: Student) => allP[s.id] = 'P');
                        setAttendanceMap(allP);
                      }}
                      className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      All Present
                    </button>
                    <button 
                      onClick={() => {
                        const allA: Record<number, 'P' | 'A'> = {};
                        students.forEach((s: Student) => allA[s.id] = 'A');
                        setAttendanceMap(allA);
                      }}
                      className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student: Student, index: number) => (
                    <motion.div 
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${
                        attendanceMap[student.id] === 'P' 
                          ? 'bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-500/5' 
                          : 'bg-rose-50 border-rose-100 shadow-sm shadow-rose-500/5'
                      }`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-colors ${
                          attendanceMap[student.id] === 'P' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {student.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-text group-hover:text-primary transition-colors">{student.name}</h4>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{student.division_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-6 rounded-full relative transition-colors ${
                           attendanceMap[student.id] === 'P' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                         }`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                              attendanceMap[student.id] === 'P' ? 'right-1 bg-emerald-500' : 'left-1 bg-rose-500'
                            }`} />
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-6 left-0 right-0 bg-white/80 backdrop-blur-xl border border-gray-100 p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex -space-x-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-black ${
                          ['bg-blue-400', 'bg-emerald-400', 'bg-purple-400'][i]
                        } text-white`}>
                          ST
                        </div>
                      ))}
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-text">Review and Submit</p>
                       <p className="text-xs text-text-muted font-bold">
                         {Object.values(attendanceMap).filter(v => v === 'P').length} Present • {Object.values(attendanceMap).filter(v => v === 'A').length} Absent
                       </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-fit">
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary/20"
                         checked={markCompleted}
                         onChange={(e) => setMarkCompleted(e.target.checked)}
                       />
                       <span className="text-xs font-bold text-text-muted group-hover:text-text transition-colors uppercase tracking-widest">Mark Lesson Complete</span>
                    </label>
                    <button 
                      onClick={handleMarkAttendance}
                      disabled={isSubmitting}
                      className="px-10 py-5 bg-primary text-white rounded-[1.5rem] font-black shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : <>Finalize Attendance <Save size={20} /></>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Filter Section */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Subject</label>
                <select 
                  value={filters.subject_id}
                  onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-bold text-sm"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-48">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Date</label>
                <input 
                  type="date" 
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-bold text-sm"
                />
              </div>

              <div className="w-full md:w-32">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Div</label>
                <select 
                  value={filters.division}
                  onChange={(e) => setFilters({...filters, division: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-bold text-sm"
                >
                  <option value="">All</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-32">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-1 block">Batch</label>
                <select 
                  value={filters.batch}
                  onChange={(e) => setFilters({...filters, batch: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/20 rounded-2xl outline-none font-bold text-sm"
                >
                  <option value="">All</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-tabs Toggle */}
            <div className="flex gap-4 border-b border-gray-100 pb-px">
              {(['records', 'summary'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`pb-4 px-2 text-sm font-black uppercase tracking-widest relative transition-all ${
                    subTab === tab ? 'text-primary' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab}
                  {subTab === tab && (
                    <motion.div layoutId="subTabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Results Section */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filters.subject_id ? (
              subTab === 'records' ? (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                          <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Student</th>
                          <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Date</th>
                          <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Activity</th>
                          <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {records.length > 0 ? records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs text-text-muted">
                                  {r.student_name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="font-bold text-text">{r.student_name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-medium text-text-muted">{r.date}</td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-text truncate max-w-[200px]">
                                {r.lecture_topic || r.experiment_title || 'General'}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                r.status === 'P' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {r.status === 'P' ? 'Present' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center text-text-muted font-bold italic">No records found for this criteria.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {summary.map((s: any, i: number) => (
                    <motion.div 
                      key={s.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-black text-text-muted">
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">{s.percentage}%</p>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cumulative</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-lg font-black text-text">{s.name}</h4>
                        <div className="flex items-center justify-between text-xs font-bold text-text-muted">
                           <span>{s.present} / {s.total_classes} Classes</span>
                           <span className={s.percentage < 75 ? 'text-rose-500' : 'text-emerald-500'}>
                             {s.percentage < 75 ? 'Low Attendance' : 'Good Progress'}
                           </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${s.percentage}%` }}
                             transition={{ duration: 1, delay: 0.5 }}
                             className={`h-full rounded-full ${
                               s.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'
                             }`}
                           />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {summary.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                       <p className="text-text-muted font-bold italic">No students linked to this subject.</p>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Filter size={32} className="text-primary/40" />
                 </div>
                 <h3 className="text-2xl font-bold text-text mb-2">Ready to Analyze</h3>
                 <p className="text-text-muted max-w-sm mx-auto font-medium">Select a subject and filters above to view detailed attendance patterns and student summaries.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;
