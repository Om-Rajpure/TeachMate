import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Target,
  Lightbulb,
  Layers,
  FlaskConical,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Save,
  Plus,
  RefreshCcw,
  Upload
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { syllabusService, subjectService } from '../services/api';
import UploadPreview from '../components/UploadPreview';
import type { Subject, Chapter, LecturePlan, Experiment } from '../types';
import { toast } from 'react-hot-toast';


const Syllabus = () => {
  const [activeTab, setActiveTab] = useState<'theory' | 'practical'>('theory');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lecturePlans, setLecturePlans] = useState<LecturePlan[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Management UI States
  const [showSubjectEditModal, setShowSubjectEditModal] = useState<Subject | null>(null);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: number; type: 'lecture' | 'experiment'; value: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Upload States (Migrated from Dashboard)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: Type, 1: Subject, 2: Upload
  const [uploadType, setUploadType] = useState<'theory' | 'practical'>('theory');
  const [uploadSubjectId, setUploadSubjectId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const subRes = await subjectService.getAll();
      setSubjects(subRes.data);
      await fetchSyllabusData();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabusData = async () => {
    try {
      const subjectId = selectedSubject === 'all' ? undefined : selectedSubject;
      const [chapRes, planRes, expRes] = await Promise.all([
        syllabusService.getChapters(subjectId),
        syllabusService.getLecturePlans(subjectId),
        syllabusService.getExperiments(subjectId)
      ]);
      setChapters(chapRes.data);
      setLecturePlans(planRes.data);
      setExperiments(expRes.data);
    } catch (err) {
      console.error('Error fetching syllabus data:', err);
      toast.error('Failed to load syllabus details');
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchSyllabusData();
    }
  }, [selectedSubject, activeTab]);

  // Reset subject filter when tab changes
  useEffect(() => {
    setSelectedSubject('all');
  }, [activeTab]);

  const handleEditSubject = async (e: React.MouseEvent, subject: Subject) => {
    e.stopPropagation();
    setShowSubjectEditModal(subject);
  };

  const handleUpdateSubject = async (updatedData: Partial<Subject>) => {
    if (!showSubjectEditModal) return;
    setIsSubmitting(true);
    try {
      await subjectService.update(showSubjectEditModal.id, updatedData);
      toast.success('Subject updated');
      setShowSubjectEditModal(null);
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete subject and all its data? This includes syllabus, lectures, and experiments.')) return;
    try {
      await subjectService.delete(id);
      toast.success('Subject deleted');
      if (selectedSubject === id) setSelectedSubject('all');
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  const handleResetSyllabus = async () => {
    if (selectedSubject === 'all') return;
    if (!confirm('Are you sure you want to reset the syllabus? This will delete all topics/experiments for this subject.')) return;
    
    setIsSubmitting(true);
    try {
      if (activeTab === 'theory') {
        await syllabusService.resetSyllabus(selectedSubject);
      } else {
        await syllabusService.resetExperiments(selectedSubject);
      }
      toast.success('Syllabus reset successfully');
      fetchSyllabusData();
    } catch (err) {
      toast.error('Failed to reset syllabus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (id: number, type: 'lecture' | 'experiment', value: string) => {
    try {
      if (type === 'lecture') {
        await syllabusService.updateLecture(id, { topic_name: value });
      } else {
        await syllabusService.updateExperiment(id, { title: value });
      }
      toast.success('Updated successfully');
      setEditingItem(null);
      fetchSyllabusData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleDeleteItem = async (id: number, type: 'lecture' | 'experiment') => {
    if (!confirm('Delete this item?')) return;
    try {
      if (type === 'lecture') {
        await syllabusService.deleteLecture(id);
      } else {
        await syllabusService.deleteExperiment(id);
      }
      toast.success('Deleted');
      fetchSyllabusData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName || !newSubjectCode) {
      toast.error('Please fill all fields');
      return;
    }
    setIsSubmitting(true);
    const payload = {
      name: newSubjectName,
      code: newSubjectCode,
      subject_type: uploadType
    };
    try {
      const res = await subjectService.create(payload);
      setSubjects(prev => [...prev, res.data]);
      setUploadSubjectId(res.data.id);
      setUploadStep(2);
      setIsAddingSubject(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      toast.success('Subject created and selected!');
    } catch (error) {
      toast.error('Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveUpload = async () => {
    setIsSubmitting(true);
    try {
      toast.success('Syllabus synced successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadStep(0);
      setUploadSubjectId(null);
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || selectedSubject === 'all') return;
    setIsSubmitting(true);
    try {
      if (activeTab === 'theory') {
        // Find last lecture number
        const nextNum = lecturePlans.length > 0 ? Math.max(...lecturePlans.map(p => p.lecture_number)) + 1 : 1;
        // Find first chapter or create a default one
        const chapterId = chapters.length > 0 ? chapters[0].id : null;
        if (!chapterId) {
           toast.error('Please upload a syllabus first to establish chapters');
           return;
        }
        await syllabusService.createLecture({
          subject: selectedSubject,
          chapter: chapterId,
          lecture_number: nextNum,
          topic_name: newItemName
        });
      } else {
        const nextNum = experiments.length > 0 ? Math.max(...experiments.map(p => p.experiment_number)) + 1 : 1;
        await syllabusService.createExperiment({
          subject: selectedSubject,
          experiment_number: nextNum,
          title: newItemName
        });
      }
      setNewItemName('');
      toast.success('Added successfully');
      fetchSyllabusData();
    } catch (err) {
      toast.error('Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeBg = activeTab === 'theory' ? 'bg-primary' : 'bg-purple-600';

  // Group lecture plans by chapter in strict teaching order
  const groupedData = useMemo(() => {
    if (activeTab === 'practical') return [];

    // 1. Sort all lecture plans by lecture_number first (Primary Teaching Order)
    const sortedPlans = [...lecturePlans].sort((a, b) => a.lecture_number - b.lecture_number);
    
    const groups: Record<number, { chapter: Chapter; plans: LecturePlan[] }> = {};
    
    // 2. Initialize groups with existing chapters
    chapters.forEach(chap => {
      groups[chap.id] = { chapter: chap, plans: [] };
    });

    // 3. Distribute sorted plans into their chapters
    sortedPlans.forEach(plan => {
      if (groups[plan.chapter]) {
        groups[plan.chapter].plans.push(plan);
      }
    });

    // 4. Sort Chapters by the lecture_number of their FIRST plan
    return Object.values(groups)
      .filter(g => g.plans.length > 0)
      .sort((a, b) => {
        const aFirst = a.plans[0].lecture_number;
        const bFirst = b.plans[0].lecture_number;
        return aFirst - bFirst;
      });
  }, [chapters, lecturePlans, activeTab]);

  const stats = useMemo(() => {
    const dataItems = activeTab === 'theory' ? lecturePlans : experiments;
    if (dataItems.length === 0) return { avg: 0, total: 0, completed: 0 };
    const total = dataItems.length;
    const completedCount = dataItems.filter(p => p.status === 'Completed').length;
    const avg = (completedCount / total) * 100;
    return { avg: Math.round(avg), total, completed: completedCount };
  }, [lecturePlans, experiments, activeTab]);

  // "AI" Suggestions
  const suggestion = useMemo(() => {
    if (activeTab === 'practical') {
       const pending = experiments.filter(e => e.status === 'Pending').sort((a, b) => a.experiment_number - b.experiment_number);
       if (pending.length > 0) {
         return {
           icon: <FlaskConical className="text-purple-500" size={20} />,
           text: `Next Lab: "${pending[0].title}" (Exp ${pending[0].experiment_number}).`
         };
       }
       return { icon: <Lightbulb size={20} />, text: "Practical progress tracked via experiment completion." };
    }

    const pending = lecturePlans.filter(p => p.status === 'Pending').sort((a, b) => a.lecture_number - b.lecture_number);
    if (pending.length > 0) {
      return {
        icon: <Clock className="text-orange-500" size={20} />,
        text: `Next up: "${pending[0].topic_name}" (Lec ${pending[0].lecture_number}). You're currently at ${stats.avg}% of total syllabus.`
      };
    }
    if (stats.avg === 100 && stats.total > 0) {
      return {
        icon: <TrendingUp className="text-green-500" size={20} />,
        text: "Syllabus completed! Time to focus on revision and mock tests."
      };
    }
    return {
      icon: <Lightbulb className="text-blue-500" size={20} />,
      text: "Upload a syllabus file to get automated lecture planning and topic suggestions."
    };
  }, [lecturePlans, experiments, stats, activeTab]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredUploadSubjects = subjects.filter(s => (s as any).subject_type === uploadType);

  return (
    <div className="space-y-10 pb-12">
      {/* 1. STANDARD HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Target size={14} /> Curriculum Planner
          </div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Syllabus Tracker</h1>
          <p className="text-text-muted font-medium">Manage and track your academic progress for all subjects.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <button 
                onClick={() => setActiveTab('theory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'theory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <BookOpen size={12} /> Theory
            </button>
            <button 
                onClick={() => setActiveTab('practical')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'practical' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-text-muted hover:text-text'}`}
            >
                <FlaskConical size={12} /> Practical
            </button>
          </div>

          <button 
            onClick={() => { setShowUploadModal(true); setUploadStep(0); }}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Upload size={18} />
            <span>Upload Syllabus</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Filters & Management Actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            <button 
              onClick={() => setSelectedSubject('all')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                selectedSubject === 'all' 
                ? 'bg-text text-white border-text shadow-lg' 
                : 'bg-white text-text-muted border-gray-100 hover:border-gray-300'
              }`}
            >
              All Subjects
            </button>
            {subjects.filter(s => (s as any).subject_type === activeTab).map(subject => (
              <div key={subject.id} className="group/subject relative flex items-center">
                <button 
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`pl-5 pr-10 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-2 ${
                    selectedSubject === subject.id
                    ? `${themeBg} text-white border-transparent shadow-lg shadow-primary/20` 
                    : 'bg-white text-text-muted border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {subject.name}
                </button>
                <div className={`absolute right-2 flex items-center gap-1 opacity-0 group-hover/subject:opacity-100 transition-opacity ${selectedSubject === subject.id ? 'text-white' : 'text-text-muted'}`}>
                  <button 
                    onClick={(e) => handleEditSubject(e, subject)}
                    className="p-1 hover:bg-black/10 rounded-md transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteSubject(e, subject.id)}
                    className="p-1 hover:bg-black/10 rounded-md transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowManagePanel(!showManagePanel)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-2 ${
              showManagePanel 
              ? 'bg-rose-50 text-rose-600 border-rose-100' 
              : 'bg-white text-text-muted border-gray-100 hover:border-gray-300'
            }`}
          >
            <RefreshCcw size={14} className={showManagePanel ? 'animate-spin-slow' : ''} />
            {showManagePanel ? 'Close Management' : 'Manage Subjects'}
          </button>
        </div>

        {/* Header Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:scale-110 transition-transform">
              <Target size={120} />
            </div>
            <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">
              {activeTab === 'theory' ? 'Theory' : 'Practical'} Progress
            </p>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-text">{stats.avg}%</h3>
              <span className="text-xs text-green-500 font-bold mb-2">
                {stats.completed} / {stats.total} {activeTab === 'theory' ? 'Lecs' : 'Exps'}
              </span>
            </div>
            <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.avg}%` }}
                className={`h-full ${activeTab === 'theory' ? 'bg-primary' : 'bg-purple-600'}`}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">Structure</p>
            <div className="flex items-center gap-4 mt-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeTab === 'theory' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                {activeTab === 'theory' ? <Layers size={24} /> : <FlaskConical size={24} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text">
                  {activeTab === 'theory' ? `${chapters.length} Chapters` : `${experiments.length} Experiments`}
                </h3>
                <p className="text-xs text-text-muted">Distributed across subjects</p>
              </div>
            </div>
          </div>

          <div className={`${activeTab === 'theory' ? 'bg-primary/5 border-primary/10' : 'bg-purple-50 border-purple-100'} p-6 rounded-2xl border flex items-start gap-4`}>
            <div className="mt-1">{suggestion.icon}</div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeTab === 'theory' ? 'text-primary' : 'text-purple-600'}`}>Smart Planner</p>
              <p className="text-sm text-text font-medium leading-relaxed">
                {suggestion.text}
              </p>
            </div>
          </div>
        </section>

        {!groupedData.length && !experiments.length ? (
          <div className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mb-8">
                  <Plus size={48} />
              </div>
              <h2 className="text-3xl font-black text-text mb-4">No Syllabus Data</h2>
              <p className="text-text-muted font-medium max-w-sm mb-10 leading-relaxed">
                  Upload your syllabus document to start planning and tracking your teaching progress.
              </p>
              <button 
                onClick={() => { setShowUploadModal(true); setUploadStep(0); }}
                className="px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3"
              >
                  <Upload size={20} />
                  Upload Syllabus
              </button>
          </div>
        ) : activeTab === 'theory' ? (
          <div className="space-y-10">
            {groupedData.map((group, groupIdx) => {
              const chapterProgress = group.plans.length > 0 
                  ? (group.plans.filter(p => p.status === 'Completed').length / group.plans.length) * 100 
                  : 0;
              return (
                  <div key={group.chapter.id} className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-sm">
                                  {groupIdx + 1}
                              </div>
                              <div>
                                  <h3 className="font-black text-xl text-text leading-tight">{group.chapter.name}</h3>
                                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">
                                      CO: {group.chapter.co_covered} • {group.plans.length} Lectures
                                  </p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-sm font-black text-primary">{Math.round(chapterProgress)}% Done</span>
                          </div>
                      </div>
                      <div className="grid gap-3">
                          {group.plans.map((item, idx) => (
                              <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="text-xs font-black text-text-muted w-8">L{item.lecture_number}</div>
                                      <div className="h-4 w-[1px] bg-gray-100" />
                                      <span className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                                          {item.topic_name}
                                      </span>
                                  </div>
                                  {item.status === 'Completed' ? (
                                      <div className="flex items-center gap-2 text-emerald-500 px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-black uppercase">
                                          <CheckCircle2 size={14} /> Completed
                                      </div>
                                  ) : (
                                      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                          Pending
                                      </div>
                                  )}
                              </motion.div>
                          ))}
                      </div>
                  </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4">
            {experiments.map((exp, idx) => (
              <motion.div 
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-all shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg">
                    {exp.experiment_number}
                  </div>
                  <div>
                    <h4 className="font-black text-text text-lg">{exp.title}</h4>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">
                      Subject ID: {exp.subject} • Practical Experiment
                    </p>
                  </div>
                </div>
                {exp.status === 'Completed' ? (
                  <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 border border-emerald-100">
                    <CheckCircle2 size={16} /> Experiment Done
                  </div>
                ) : (
                  <div className="px-6 py-2 bg-gray-50 text-text-muted rounded-xl font-black text-[10px] uppercase border border-gray-100">
                    Pending
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* SUBJECT EDIT MODAL */}
      <AnimatePresence>
        {showSubjectEditModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowSubjectEditModal(null)}
               className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl"
            >
               <h3 className="text-xl font-black text-text mb-6">Edit Subject</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase ml-1">Subject Name</label>
                    <input 
                      type="text" 
                      value={showSubjectEditModal.name}
                      onChange={(e) => setShowSubjectEditModal({...showSubjectEditModal, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase ml-1">Subject Code</label>
                    <input 
                      type="text" 
                      value={showSubjectEditModal.code}
                      onChange={(e) => setShowSubjectEditModal({...showSubjectEditModal, code: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowSubjectEditModal(null)}
                      className="flex-1 py-3 bg-gray-50 text-text-muted rounded-xl font-bold hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdateSubject({ name: showSubjectEditModal.name, code: showSubjectEditModal.code })}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE SYLLABUS PANEL (Overlay) */}
      <AnimatePresence>
        {showManagePanel && (
          <div className="fixed inset-0 z-[120] overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white flex flex-col"
            >
              <div className="p-6 md:p-10 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-text">Manage {activeTab === 'theory' ? 'Syllabus' : 'Experiments'}</h2>
                  <p className="text-text-muted font-bold text-sm">
                    {subjects.find(s => s.id === selectedSubject)?.name} • {activeTab === 'theory' ? 'Academic Planning' : 'Lab Curriculum'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowManagePanel(false)}
                  className="p-4 bg-gray-50 text-text-muted rounded-2xl hover:bg-gray-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-10">
                   <div className={`p-8 ${activeTab === 'theory' ? 'bg-primary/5 border-primary/10' : 'bg-purple-50 border-purple-100'} border-2 border-dashed rounded-[2.5rem] flex flex-col md:flex-row gap-4 items-center`}>
                      <div className={`w-14 h-14 rounded-2xl ${activeTab === 'theory' ? 'bg-primary text-white' : 'bg-purple-600 text-white'} flex items-center justify-center shrink-0`}>
                        <Plus size={24} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="font-extrabold text-text">Quick Add</h4>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Manually insert a {activeTab === 'theory' ? 'lecture topic' : 'lab experiment'}</p>
                      </div>
                      <div className="flex w-full md:w-auto gap-2">
                        <input 
                          type="text" 
                          placeholder={activeTab === 'theory' ? "Topic name..." : "Experiment title..."}
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="flex-1 md:w-64 px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                        />
                        <button 
                          onClick={handleAddItem}
                          disabled={!newItemName || isSubmitting}
                          className={`px-6 py-3 ${themeBg} text-white rounded-2xl font-black text-xs uppercase hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-gray-200`}
                        >
                           Add
                        </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-black text-text-muted uppercase tracking-[0.2em]">Curriculum Overview</h4>
                        <span className="text-[10px] font-black text-primary uppercase">{activeTab === 'theory' ? lecturePlans.length : experiments.length} Items Total</span>
                      </div>

                      <div className="grid gap-3">
                        {((activeTab === 'theory' ? lecturePlans : experiments) as any[]).map((item) => (
                          <div key={item.id} className="group bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-all">
                             <div className="flex items-center gap-6 flex-1 pr-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-xs text-text-muted shrink-0 ${activeTab === 'theory' ? 'group-hover:text-primary group-hover:bg-primary/5' : 'group-hover:text-purple-600 group-hover:bg-purple-50'} transition-all`}>
                                   {activeTab === 'theory' ? `L${item.lecture_number}` : `E${item.experiment_number}`}
                                </div>
                                {editingItem && editingItem.id === item.id ? (
                                  <div className="flex flex-1 gap-2">
                                    <input 
                                      type="text" 
                                      autoFocus
                                      value={editingItem.value}
                                      onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                      className="flex-1 px-4 py-2 rounded-xl border border-primary/30 outline-none font-bold text-sm bg-primary/5"
                                    />
                                    <button onClick={() => handleUpdateItem(item.id, activeTab === 'theory' ? 'lecture' : 'experiment', editingItem.value)} className="p-2 bg-emerald-500 text-white rounded-xl"><Save size={18}/></button>
                                    <button onClick={() => setEditingItem(null)} className="p-2 bg-gray-100 text-text-muted rounded-xl"><X size={18}/></button>
                                  </div>
                                ) : (
                                  <span className="font-bold text-text truncate max-w-[500px]">{activeTab === 'theory' ? item.topic_name : item.title}</span>
                                )}
                             </div>
                             {!editingItem && (
                               <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingItem({id: item.id, type: activeTab === 'theory' ? 'lecture' : 'experiment', value: activeTab === 'theory' ? item.topic_name : item.title})} className="p-3 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit2 size={18}/></button>
                                  <button onClick={() => handleDeleteItem(item.id, activeTab === 'theory' ? 'lecture' : 'experiment')} className="p-3 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="pt-10 border-t border-gray-100">
                      <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-rose-500 text-white rounded-2xl"><RefreshCcw size={24}/></div>
                           <div>
                             <h4 className="font-black text-text">Reset {activeTab} Data</h4>
                             <p className="text-sm text-text-muted font-medium italic">Clear all current plans and start fresh with a new upload.</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleResetSyllabus}
                          disabled={isSubmitting}
                          className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                        >
                          Perform Full Reset
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYLLABUS UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowUploadModal(false)}
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-text">Upload Syllabus</h3>
                {uploadStep > 0 && !uploadFile && (
                  <button 
                    onClick={() => setUploadStep(prev => prev - 1)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Back to Step {uploadStep}
                  </button>
                )}
              </div>
              <p className="text-text-muted mb-8 italic text-sm">
                Step {uploadStep + 1}: {
                  uploadStep === 0 ? 'Select academic type' :
                  uploadStep === 1 ? 'Choose the target subject' :
                  'Upload the document'
                }
              </p>

              {uploadFile ? (
                <UploadPreview 
                  type="syllabus" 
                  file={uploadFile} 
                  subjectId={uploadSubjectId}
                  subjectType={uploadType}
                  onClose={() => {
                    setUploadFile(null);
                    setShowUploadModal(false);
                    setUploadStep(0);
                  }}
                  onSave={onSaveUpload}
                />
              ) : (
                <div className="space-y-6">
                  {uploadStep === 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setUploadType('theory'); setUploadStep(1); }}
                        className="flex flex-col items-center gap-4 p-8 border-2 border-gray-100 rounded-[2rem] hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                          <BookOpen size={32} />
                        </div>
                        <span className="font-black text-text uppercase tracking-tight">Theory</span>
                      </button>
                      <button 
                        onClick={() => { setUploadType('practical'); setUploadStep(1); }}
                        className="flex flex-col items-center gap-4 p-8 border-2 border-gray-100 rounded-[2rem] hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
                      >
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                          <FlaskConical size={32} />
                        </div>
                        <span className="font-black text-text uppercase tracking-tight">Practical</span>
                      </button>
                    </div>
                  )}

                  {uploadStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                         <h4 className="font-bold text-text-muted text-xs uppercase tracking-widest">Select Subject</h4>
                         <button 
                           onClick={() => setIsAddingSubject(!isAddingSubject)}
                           className="text-xs font-black text-primary px-3 py-1.5 bg-primary/5 rounded-lg hover:bg-primary/10 transition-all"
                         >
                           {isAddingSubject ? 'View List' : '+ Add New'}
                         </button>
                      </div>

                      {isAddingSubject ? (
                        <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="space-y-3">
                            <input 
                              type="text" 
                              placeholder="Subject Name"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                            />
                            <input 
                              type="text" 
                              placeholder="Code (e.g. CS601)"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                            />
                            <button 
                              onClick={handleCreateSubject}
                              disabled={isSubmitting}
                              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm"
                            >
                              {isSubmitting ? 'Creating...' : 'Create & Proceed'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {filteredUploadSubjects.length > 0 ? filteredUploadSubjects.map(subject => (
                            <button 
                              key={subject.id}
                              onClick={() => { setUploadSubjectId(subject.id); setUploadStep(2); }}
                              className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                            >
                              <div>
                                <p className="font-black text-text">{subject.name}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{subject.code}</p>
                              </div>
                              <Plus size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                            </button>
                          )) : (
                            <div className="p-10 text-center bg-gray-50 rounded-2xl text-sm italic text-text-muted">
                              No {uploadType} subjects found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {uploadStep === 2 && (
                    <label className="group relative block px-10 py-16 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                      <div className="flex flex-col items-center gap-4 text-text-muted group-hover:text-primary">
                        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                          <Upload size={32} />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Upload Syllabus Document</p>
                          <p className="text-sm opacity-60 mt-1">Excel formats preferred</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Syllabus;
