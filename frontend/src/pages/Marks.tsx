import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, CheckCircle2,
  Loader2, AlertTriangle, Save, 
  Upload, Download, BarChart3, PieChart, TrendingUp,
  FileSpreadsheet, Trophy, X
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
  const [isExporting, setIsExporting] = useState(false);
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
  });

  // Dynamic Engine State
  const [marksConfig, setMarksConfig] = useState<any>(null);
  const [marksEntries, setMarksEntries] = useState<Record<number, any>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);


  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
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
      const [studentsRes, configRes, marksRes] = await Promise.all([
        studentService.getAll(
          Number(selection.subject_id), 
          Number(selection.division_id),
          selection.batch_id ? Number(selection.batch_id) : undefined
        ),
        markService.getConfig(Number(selection.subject_id)),
        markService.list(Number(selection.subject_id))
      ]);

      setStudents(studentsRes.data);
      setMarksConfig(configRes.data);

      // Map existing marks
      const initialMarks: Record<number, any> = {};
      studentsRes.data.forEach(s => {
        const existing = marksRes.data.find((m: any) => m.student === s.id);
        if (existing) {
          initialMarks[s.id] = existing.marks_data;
        } else {
          if (configRes.data.type === 'theory') {
            initialMarks[s.id] = { ia1: 0, ia2: 0, average: 0 };
          } else {
            const exps: Record<string, any> = {};
            for (let i = 1; i <= configRes.data.experiments; i++) {
              exps[`exp_${i}`] = { a: 0, b: 0, c: 0, d: 0 };
            }
            initialMarks[s.id] = { 
              experiments: exps, 
              assignments: { 
                assignment_1: { a: 0, b: 0, c: 0 }, 
                assignment_2: { a: 0, b: 0, c: 0 } 
              },
              mini_project: 0
            };
          }
        }
      });
      setMarksEntries(initialMarks);
    } catch (err) {
      toast.error('Failed to load marks configuration');
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

  const handleMarkChange = (studentId: number, block: string, field: string | null, value: string, part?: string) => {
    setMarksEntries(prev => {
      const studentMarks = JSON.parse(JSON.stringify(prev[studentId] || {}));
      const numVal = parseFloat(value) || 0;

      if (marksConfig.type === 'theory') {
        studentMarks[block] = numVal;
        studentMarks.average = ((studentMarks.ia1 || 0) + (studentMarks.ia2 || 0)) / 2;
      } else {
        if (block === 'experiments' && field && part) {
          if (!studentMarks.experiments) studentMarks.experiments = {};
          if (!studentMarks.experiments[field]) studentMarks.experiments[field] = { a: 0, b: 0, c: 0, d: 0 };
          studentMarks.experiments[field][part] = numVal;
        } else if (block === 'assignments' && field && part) {
          if (!studentMarks.assignments) studentMarks.assignments = {};
          if (!studentMarks.assignments[field]) studentMarks.assignments[field] = { a: 0, b: 0, c: 0 };
          studentMarks.assignments[field][part] = numVal;
        } else if (block === 'mini_project') {
          studentMarks.mini_project = numVal;
        }
      }
      return { ...prev, [studentId]: studentMarks };
    });
  };

  const calculateTotals = (studentId: number) => {
    const m = marksEntries[studentId];
    if (!m) return { expTotal: 0, assignAvg: 0, overall: 0, experiments: {} };

    if (marksConfig?.type === 'theory') {
      return { expTotal: 0, assignAvg: 0, overall: Number(m.average) || 0, experiments: {} };
    }

    // Calculate individual experiment totals and count
    const expTotals: Record<string, number> = {};
    let experimentsSum = 0;
    let expCount = 0;
    
    if (m.experiments) {
      Object.entries(m.experiments).forEach(([key, parts]: [string, any]) => {
        const total = (Number(parts.a) || 0) + (Number(parts.b) || 0) + 
                      (Number(parts.c) || 0) + (Number(parts.d) || 0);
        expTotals[key] = total;
        experimentsSum += total;
        expCount++;
      });
    }

    const expAvg = expCount > 0 ? experimentsSum / expCount : 0;

    const getAssignTotal = (assign: any) => {
      if (typeof assign === 'object') {
        return (Number(assign.a) || 0) + (Number(assign.b) || 0) + (Number(assign.c) || 0);
      }
      return Number(assign) || 0;
    };

    const a1 = getAssignTotal(m.assignments?.assignment_1);
    const a2 = getAssignTotal(m.assignments?.assignment_2);
    const assignAvg = (a1 + a2) / 2;
    const miniProject = Number(m.mini_project) || 0;
    
    const overall = experimentsSum + a1 + a2 + miniProject;

    return { 
      expTotal: experimentsSum,
      expAvg,
      assignAvg, 
      overall, 
      individualExps: expTotals 
    };
  };

  const handleExportTemplate = async () => {
    // ── Validation ──────────────────────────────────────────
    if (!selection.subject_id) {
      toast.error('Please select a subject first');
      return;
    }
    if (!selection.division_id) {
      toast.error('Please select a division first');
      return;
    }
    if (marksConfig?.type === 'practical' && !selection.batch_id) {
      // batch is optional for practical — proceed without it
    }

    setIsExporting(true);
    try {
      const res = await markService.exportTemplate(
        Number(selection.subject_id),
        Number(selection.division_id),
        selection.batch_id ? Number(selection.batch_id) : undefined
      );

      // ── Extract filename from Content-Disposition ────────
      const disposition = res.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"\n]+)"?/);
      const filename = match ? match[1] : 'Marks Template.xlsx';

      // ── Trigger browser download ─────────────────────────
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully! 📥');
    } catch (err: any) {
      // Blob error responses need special parsing
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.error || 'Export failed');
        } catch {
          toast.error('Failed to generate template');
        }
      } else {
        toast.error(err.response?.data?.error || 'Failed to generate template');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!selection.subject_id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        subject_id: Number(selection.subject_id),
        marks: Object.entries(marksEntries).map(([id, marks_data]) => ({
          student_id: Number(id),
          marks_data
        }))
      };
      await markService.save(payload);
      toast.success('All marks synchronized successfully!');
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sync marks');
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

        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner self-start">
          <button 
            onClick={() => setTab('enter')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'enter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            <Save size={14} /> Entry Mode
          </button>
          <button 
            onClick={() => setTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            <BarChart3 size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 rounded-l-3xl" />
        
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

        {marksConfig?.type === 'practical' && (
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
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-text-muted font-bold animate-pulse">Loading engine configuration...</p>
          </div>
        ) : tab === 'enter' ? (
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
              <button
                id="export-template-btn"
                onClick={handleExportTemplate}
                disabled={isExporting || !selection.subject_id}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating Template…</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Export Template</span>
                  </>
                )}
              </button>
            </div>

            {/* Entry Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-4 lg:px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest sticky left-0 bg-white z-20 min-w-[60px] lg:min-w-[100px]">Roll No</th>
                      <th className="px-4 lg:px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest sticky left-[60px] lg:left-[100px] bg-white z-20 min-w-[140px] lg:min-w-[200px] border-r border-gray-100">Student Name</th>
                      
                      {marksConfig?.type === 'theory' ? (
                        <>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">IA-1</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">IA-2</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-primary uppercase tracking-widest sticky right-0 bg-white z-20 border-l border-gray-100 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Average</th>
                        </>
                      ) : (
                        <>
                          {Array.from({ length: marksConfig?.experiments || 0 }).map((_, i) => (
                            <th key={i} className="px-4 py-3 text-center border-x border-gray-100 bg-gray-50/30 min-w-[200px]">
                              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">EXP-{i+1}</div>
                              <div className="flex justify-around text-[8px] font-black text-text-muted/40 px-2">
                                <span title="Part A (3)">A</span>
                                <span title="Part B (4)">B</span>
                                <span title="Part C (4)">C</span>
                                <span title="Part D (4)">D</span>
                                <span className="text-primary italic">TOTAL</span>
                              </div>
                            </th>
                          ))}
                          
                          <th className="px-8 py-5 text-center text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 border-r-4 border-gray-200 min-w-[140px]">
                            Experiments Avg
                          </th>
                          
                          {marksConfig?.has_assignments && (
                            <>
                              <th className="px-4 py-3 text-center bg-emerald-50/30 min-w-[160px]">
                                <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Assignment 1</div>
                                <div className="flex justify-around text-[8px] font-black text-emerald-600/60 px-2">
                                  <span title="Part A (2)">A</span>
                                  <span title="Part B (2)">B</span>
                                  <span title="Part C (1)">C</span>
                                  <span className="text-emerald-700 font-bold">∑</span>
                                </div>
                              </th>
                              <th className="px-4 py-3 text-center border-x border-emerald-100 bg-emerald-50/30 min-w-[160px]">
                                <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Assignment 2</div>
                                <div className="flex justify-around text-[8px] font-black text-emerald-600/60 px-2">
                                  <span title="Part A (2)">A</span>
                                  <span title="Part B (2)">B</span>
                                  <span title="Part C (1)">C</span>
                                  <span className="text-emerald-700 font-bold">∑</span>
                                </div>
                              </th>
                              <th className="px-8 py-5 text-center text-[10px] font-black text-white bg-emerald-600 uppercase tracking-widest sticky right-0 z-30 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] min-w-[150px]">
                                Assignments Avg
                              </th>
                            </>
                          )}
                          
                          {marksConfig?.has_mini_project && (
                            <th className="px-6 py-5 text-center text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50/30 border-l border-purple-100">Mini Project</th>
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student) => {
                      const totals = calculateTotals(student.id);
                      const m = marksEntries[student.id] || {};
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 lg:px-8 py-6 font-black text-primary sticky left-0 bg-white z-10 group-hover:bg-gray-50">{student.roll_number || 'N/A'}</td>
                          <td className="px-4 lg:px-8 py-6 font-bold text-text sticky left-[60px] lg:left-[100px] bg-white z-10 border-r border-gray-100 group-hover:bg-gray-50">{student.name}</td>
                          
                          {marksConfig?.type === 'theory' ? (
                            <>
                              <td className="px-8 py-6 text-center">
                                <input 
                                  type="number"
                                  value={m.ia1 || 0}
                                  onChange={(e) => handleMarkChange(student.id, 'ia1', null, e.target.value)}
                                  className="w-20 px-3 py-2 bg-gray-50 rounded-xl text-center font-black outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                              </td>
                              <td className="px-8 py-6 text-center">
                                <input 
                                  type="number"
                                  value={m.ia2 || 0}
                                  onChange={(e) => handleMarkChange(student.id, 'ia2', null, e.target.value)}
                                  className="w-20 px-3 py-2 bg-gray-50 rounded-xl text-center font-black outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                              </td>
                              <td className="px-8 py-6 text-center font-black text-primary sticky right-0 bg-white z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-gray-50">
                                {totals.overall.toFixed(1)}
                              </td>
                            </>
                          ) : (
                            <>
                              {Array.from({ length: marksConfig?.experiments || 0 }).map((_, i) => {
                                const expKey = `exp_${i+1}`;
                                const parts = m.experiments?.[expKey] || { a: 0, b: 0, c: 0, d: 0 };
                                const expTotal = (totals as any).individualExps?.[expKey] || 0;

                                return (
                                  <td key={i} className="px-2 py-6 border-x border-gray-50 bg-white group-hover:bg-gray-50/30 transition-colors">
                                    <div className="flex items-center justify-center gap-1 px-1">
                                      {[
                                        { key: 'a', max: 3, color: 'focus:ring-blue-200' },
                                        { key: 'b', max: 4, color: 'focus:ring-blue-200' },
                                        { key: 'c', max: 4, color: 'focus:ring-blue-200' },
                                        { key: 'd', max: 4, color: 'focus:ring-blue-200' }
                                      ].map(part => (
                                        <input 
                                          key={part.key}
                                          type="number"
                                          min="0"
                                          max={part.max}
                                          value={parts[part.key as keyof typeof parts]}
                                          onChange={(e) => handleMarkChange(student.id, 'experiments', expKey, e.target.value, part.key)}
                                          className={`w-8 h-9 bg-gray-50 rounded-lg text-center font-black text-[10px] outline-none focus:bg-white focus:ring-2 ${part.color} transition-all ${Number(parts[part.key as keyof typeof parts]) > part.max ? 'text-rose-500 bg-rose-50' : ''}`}
                                        />
                                      ))}
                                      <div className="w-8 h-9 flex items-center justify-center font-black text-[10px] text-primary bg-primary/5 rounded-lg border border-primary/10 ml-0.5">
                                        {expTotal}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                              
                              <td className="px-8 py-6 text-center font-black text-primary bg-primary/5 border-r-4 border-gray-100 shadow-inner">
                                {(totals as any).expAvg.toFixed(1)}
                              </td>
                              
                              {marksConfig?.has_assignments && (
                                <>
                                  {[ 'assignment_1', 'assignment_2' ].map((field, idx) => {
                                    const aParts = m.assignments?.[field] || { a: 0, b: 0, c: 0 };
                                    const aTotal = (Number(aParts.a) || 0) + (Number(aParts.b) || 0) + (Number(aParts.c) || 0);

                                    return (
                                      <td key={field} className={`px-2 py-6 text-center bg-emerald-50/10 ${idx === 0 ? '' : 'border-x border-emerald-100'}`}>
                                        <div className="flex items-center justify-center gap-1">
                                          {[
                                            { key: 'a', max: 2 },
                                            { key: 'b', max: 2 },
                                            { key: 'c', max: 1 }
                                          ].map(part => (
                                            <input 
                                              key={part.key}
                                              type="number"
                                              min="0"
                                              max={part.max}
                                              value={aParts[part.key as keyof typeof aParts]}
                                              onChange={(e) => handleMarkChange(student.id, 'assignments', field, e.target.value, part.key)}
                                              className={`w-8 h-9 bg-white border border-emerald-100 rounded-lg text-center font-black text-[10px] outline-none focus:ring-2 focus:ring-emerald-200 transition-all ${Number(aParts[part.key as keyof typeof aParts]) > part.max ? 'text-rose-500 bg-rose-50' : ''}`}
                                            />
                                          ))}
                                          <div className="w-8 h-9 flex items-center justify-center font-black text-[10px] text-emerald-700 bg-emerald-100/50 rounded-lg ml-0.5">
                                            {aTotal}
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="px-8 py-6 text-center font-black text-2xl text-emerald-700 bg-emerald-50/50 sticky right-0 z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] border-l-2 border-emerald-200">
                                    {totals.assignAvg.toFixed(1)}
                                  </td>
                                </>
                              )}

                              {marksConfig?.has_mini_project && (
                                <td className="px-6 py-6 text-center bg-purple-50/20 border-l border-purple-100">
                                  <input 
                                    type="number"
                                    value={m.mini_project || 0}
                                    onChange={(e) => handleMarkChange(student.id, 'mini_project', null, e.target.value)}
                                    className="w-16 h-14 bg-white border border-purple-100 rounded-2xl text-center font-black text-sm outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
                                  />
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 lg:p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-10"
              >
                <div className="flex items-center gap-6 px-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Engine Status</p>
                    <p className="text-white font-black">Syncing for {students.length} students</p>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting || !selection.subject_id}
                  className="w-full md:w-auto px-6 lg:px-10 py-3 lg:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>Synchronize Records</span>
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
              <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-3xl border border-dashed border-gray-200 shadow-lg">
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
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center shadow-inner`}>
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

                  <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-lg p-8 space-y-6">
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

const MarkUploadModal = ({ onClose, selection }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [examType, setExamType] = useState('IA1');

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject_id', selection.subject_id);
      formData.append('division_id', selection.division_id);
      formData.append('exam_type', examType);
      formData.append('mark_type', 'theory'); // Fallback for old bulk logic

      await markService.upload(formData);
      toast.success('File processed effectively!');
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
             <h2 className="text-3xl font-bold tracking-tight">Bulk Upload</h2>
             <p className="text-text-muted font-medium text-sm">Automate marks entry via Excel workbook.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Select Exam (For Theory)</label>
           <div className="flex gap-4">
             {['IA1', 'IA2', 'EndSem'].map(type => (
               <button 
                 key={type}
                 onClick={() => setExamType(type)}
                 className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${examType === type ? 'bg-primary border-primary text-white' : 'border-gray-100 text-text-muted'}`}
               >
                 {type}
               </button>
             ))}
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
           className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={20} />}
          Start Analysis & Upload
        </button>
      </motion.div>
    </div>
  )
}

export default Marks;
