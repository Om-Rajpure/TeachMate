import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Filter, GraduationCap, History, CheckCircle2,
  AlertCircle, ChevronRight, BookOpen, CalendarDays, 
  Loader2, AlertTriangle, Save, Trophy, Target, 
  Upload, Download, BarChart3, PieChart, TrendingUp,
  UserPlus, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  markService, subjectService, studentService, 
  divisionService, batchService, analyticsService 
} from '../services/api';
import type { Student, Subject, Division, Batch } from '../types';
import { toast } from 'react-hot-toast';

const Marks = () => {
  const [tab, setTab] = useState<'enter' | 'analytics'>('enter');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Metadata State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  // Selection State
  const [selection, setSelection] = useState({
    subject_id: '',
    division_id: '',
    batch_id: '',
    exam_type: 'IA1',
    max_marks: 20,
    pass_marks: 8,
    year: '2023-24',
    branch: 'Computer'
  });

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [theoryMarks, setTheoryMarks] = useState<Record<number, number>>({});
  const [pracMarks, setPracMarks] = useState<Record<number, any>>({});
  const [analytics, setAnalytics] = useState<any>(null);

  const selectedSubject = useMemo(() => 
    subjects.find(s => s.id === Number(selection.subject_id)),
    [subjects, selection.subject_id]
  );

  const isTheory = selectedSubject?.subject_type === 'Theory';

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [subs, divs, bats] = await Promise.all([
        subjectService.getAll(),
        divisionService.getAll(),
        batchService.getAll()
      ]);
      setSubjects(subs.data);
      setDivisions(divs.data);
      setBatches(bats.data);
    } catch (err) {
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selection.subject_id || !selection.division_id) return;
    setLoading(true);
    try {
      const res = await studentService.getAll(
        Number(selection.subject_id), 
        Number(selection.division_id),
        selection.batch_id ? Number(selection.batch_id) : undefined
      );
      setStudents(res.data);
      
      // Initialize marks maps
      if (isTheory) {
        const initialMarks: Record<number, number> = {};
        res.data.forEach(s => initialMarks[s.id] = 0);
        setTheoryMarks(initialMarks);
      } else {
        const initialMarks: Record<number, any> = {};
        res.data.forEach(s => initialMarks[s.id] = {
          part_a: 0, part_b: 0, part_c: 0, part_d: 0,
          assign1_p1: 0, assign1_p2: 0, assign1_p3: 0,
          assign2_p1: 0, assign2_p2: 0, assign2_p3: 0
        });
        setPracMarks(initialMarks);
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selection.subject_id, selection.division_id, selection.batch_id]);

  const fetchAnalytics = async () => {
    if (!selection.subject_id) return;
    try {
      const res = await analyticsService.getClassAnalytics(Number(selection.subject_id));
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    }
  };

  useEffect(() => {
    if (tab === 'analytics') fetchAnalytics();
  }, [tab, selection.subject_id]);

  const handleTheoryChange = (studentId: number, value: string) => {
    setTheoryMarks(prev => ({ ...prev, [studentId]: parseFloat(value) || 0 }));
  };

  const handlePracChange = (studentId: number, field: string, value: string) => {
    setPracMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: parseFloat(value) || 0 }
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (isTheory) {
        const marks = Object.entries(theoryMarks).map(([id, val]) => ({
          student_id: Number(id),
          marks_obtained: val
        }));
        await markService.saveTheory({
          ...selection,
          subject_id: Number(selection.subject_id),
          division_id: Number(selection.division_id),
          date: new Date().toISOString().split('T')[0],
          marks
        });
      } else {
        const marks = Object.entries(pracMarks).map(([id, val]) => ({
          student_id: Number(id),
          ...val
        }));
        await markService.savePractical({
          subject_id: Number(selection.subject_id),
          division_id: Number(selection.division_id),
          batch_id: selection.batch_id ? Number(selection.batch_id) : undefined,
          marks
        });
      }
      toast.success('Marks updated successfully!');
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
            <GraduationCap size={14} /> Academic Performance
          </div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Marks Management</h1>
          <p className="text-text-muted font-medium">Record theory and practical scores with granular tracking.</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start">
          <button 
            onClick={() => setTab('enter')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'enter' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            <Save size={14} /> Entry Mode
          </button>
          <button 
            onClick={() => setTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'analytics' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            <BarChart3 size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 rounded-l-[3rem]" />
        
        <div className="space-y-2 col-span-2">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Subject</label>
          <select 
            value={selection.subject_id}
            onChange={(e) => setSelection({...selection, subject_id: e.target.value})}
            className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-bold text-text appearance-none cursor-pointer"
          >
            <option value="">Choose Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject_type})</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Division</label>
          <select 
            value={selection.division_id}
            onChange={(e) => setSelection({...selection, division_id: e.target.value})}
            className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-bold text-text cursor-pointer"
          >
            <option value="">Select Division</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {!isTheory && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Batch</label>
            <select 
              value={selection.batch_id}
              onChange={(e) => setSelection({...selection, batch_id: e.target.value})}
              className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-bold text-text cursor-pointer"
            >
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {isTheory && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Exam</label>
              <select 
                value={selection.exam_type}
                onChange={(e) => setSelection({...selection, exam_type: e.target.value})}
                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-bold text-text cursor-pointer"
              >
                <option value="IA1">IA 1</option>
                <option value="IA2">IA 2</option>
                <option value="EndSem">End Sem</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Max Marks</label>
              <input 
                type="number"
                value={selection.max_marks}
                onChange={(e) => setSelection({...selection, max_marks: Number(e.target.value)})}
                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-black text-text"
              />
            </div>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'enter' ? (
          <motion.div 
            key="enter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="flex gap-4">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Upload size={14} /> Bulk Upload (Excel)
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-text-muted hover:bg-gray-50 transition-all shadow-sm">
                <Download size={14} /> Export Template
              </button>
            </div>

            {/* Entry Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Roll No</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Student Name</th>
                      {isTheory ? (
                        <th className="px-8 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Score Obtained</th>
                      ) : (
                        <>
                          <th className="px-4 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Exp (A-D)</th>
                          <th className="px-4 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Assign 1</th>
                          <th className="px-4 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Assign 2</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 font-black text-primary">{student.roll_number || 'N/A'}</td>
                        <td className="px-8 py-6 font-bold text-text">{student.name}</td>
                        {isTheory ? (
                          <td className="px-8 py-6 flex justify-center">
                            <div className="relative w-24">
                              <input 
                                type="number"
                                value={theoryMarks[student.id]}
                                onChange={(e) => handleTheoryChange(student.id, e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent focus:bg-white focus:border-primary/20 rounded-xl outline-none font-black text-center"
                              />
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-6">
                              <div className="flex gap-1 justify-center">
                                {['part_a', 'part_b', 'part_c', 'part_d'].map(f => (
                                  <input 
                                    key={f}
                                    type="number"
                                    placeholder={f.slice(-1).toUpperCase()}
                                    value={pracMarks[student.id]?.[f]}
                                    onChange={(e) => handlePracChange(student.id, f, e.target.value)}
                                    className="w-10 h-10 bg-gray-100 rounded-lg text-center font-black text-[10px] outline-none focus:bg-white focus:ring-1 focus:ring-primary/20"
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex gap-1 justify-center">
                                {[1, 2, 3].map(i => (
                                  <input 
                                    key={i}
                                    type="number"
                                    value={pracMarks[student.id]?.[`assign1_p${i}`]}
                                    onChange={(e) => handlePracChange(student.id, `assign1_p${i}`, e.target.value)}
                                    className="w-10 h-10 bg-gray-100 rounded-lg text-center font-black text-[10px] outline-none focus:bg-white"
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex gap-1 justify-center">
                                {[1, 2, 3].map(i => (
                                  <input 
                                    key={i}
                                    type="number"
                                    value={pracMarks[student.id]?.[`assign2_p${i}`]}
                                    onChange={(e) => handlePracChange(student.id, `assign2_p${i}`, e.target.value)}
                                    className="w-10 h-10 bg-gray-100 rounded-lg text-center font-black text-[10px] outline-none focus:bg-white"
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center font-black text-primary">
                              {Object.values(pracMarks[student.id] || {}).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) as number}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-text/95 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-10"
              >
                <div className="flex items-center gap-6 px-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Changes Pending</p>
                    <p className="text-white font-black">{Object.keys(isTheory ? theoryMarks : pracMarks).length} total records</p>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting || !selection.subject_id}
                  className="px-10 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/30 flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Commmit All Marks
                </button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {!analytics ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-[3rem] border border-dashed border-gray-200">
                <BarChart3 size={48} className="text-gray-200" />
                <p className="text-text-muted font-bold">Select a subject & division to view detailed analytics.</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Class Average', value: `${analytics.class_average}%`, icon: PieChart, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Passed Students', value: analytics.passed_count, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'At Risk Students', value: analytics.failed_count, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
                    { label: 'Total Students', value: analytics.total_students, icon: Users, color: 'bg-purple-50 text-purple-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
                        <p className="text-2xl font-black text-text">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toppers & Detailed List */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xl font-black italic flex items-center gap-2">
                       Top Performers <Trophy size={20} className="text-amber-500" />
                    </h3>
                    <div className="space-y-4">
                      {analytics.toppers.map((t: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center font-black text-text-muted">{i+1}</div>
                           <div className="flex-1">
                             <p className="font-bold text-text">{t.name}</p>
                             <p className="text-[10px] font-bold text-text-muted">Roll: {t.roll_number}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-black text-primary">{t.percentage}%</p>
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Rank #{t.rank}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black italic">Student Performance Grid</h3>
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Detailed Report</button>
                    </div>
                    <div className="space-y-3">
                      {analytics.student_performances.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-sm">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-10">
                            <div className="hidden md:block w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${p.percentage}%` }} />
                            </div>
                            <span className="font-black text-sm w-12 text-right">{p.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      {showUploadModal && (
        <MarkUploadModal 
          onClose={() => setShowUploadModal(false)}
          selection={selection}
          subjects={subjects}
          divisions={divisions}
        />
      )}
    </div>
  );
};

const MarkUploadModal = ({ onClose, selection, subjects, divisions }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [config, setConfig] = useState({
    subject_id: selection.subject_id,
    division_id: selection.division_id,
    exam_type: selection.exam_type,
    max_marks: selection.max_marks,
    mark_type: 'theory'
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject_id', config.subject_id);
      formData.append('division_id', config.division_id);
      formData.append('exam_type', config.exam_type);
      formData.append('max_marks', config.max_marks.toString());
      formData.append('mark_type', config.mark_type);

      await markService.upload(formData);
      toast.success('File processed successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-text/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-3xl font-black italic tracking-tight">Bulk Upload</h2>
             <p className="text-text-muted font-medium text-sm">Automate marks entry via Excel workbook.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all">
            <Users className="rotate-45" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Type</label>
             <select 
               value={config.mark_type}
               onChange={(e) => setConfig({...config, mark_type: e.target.value})}
               className="w-full px-5 py-3.5 bg-gray-50 rounded-xl outline-none font-bold"
             >
               <option value="theory">Theory Marks</option>
               <option value="practical">Practical Records</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Subject</label>
             <select 
               value={config.subject_id}
               className="w-full px-5 py-3.5 bg-gray-50 rounded-xl outline-none font-bold opacity-50 cursor-not-allowed"
               disabled
             >
               {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
           </div>
        </div>

        <div className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center space-y-4 hover:border-primary/20 transition-all cursor-pointer relative group">
           <input 
             type="file" 
             onChange={(e) => setFile(e.target.files?.[0] || null)}
             className="absolute inset-0 opacity-0 cursor-pointer"
           />
           <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
             <FileSpreadsheet size={40} />
           </div>
           <div>
             <p className="font-black text-text">{file ? file.name : 'Drop Excel File Here'}</p>
             <p className="text-text-muted text-xs font-medium">Click to browse or drag and drop</p>
           </div>
        </div>

        <button 
           onClick={handleUpload}
           disabled={!file || isUploading}
           className="w-full py-5 bg-text text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
          Start Analysis & Upload
        </button>
      </motion.div>
    </div>
  )
}

export default Marks;
