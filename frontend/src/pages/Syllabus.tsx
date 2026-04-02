import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Target,
  Lightbulb,
  Layers,
  FlaskConical,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Upload,
  ArrowRight
} from 'lucide-react';
import { syllabusService, subjectService } from '../services/api';
import UploadPreview from '../components/UploadPreview';
import MobileSyllabus from '../components/MobileSyllabus';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showSubjectEditModal, setShowSubjectEditModal] = useState<Subject | null>(null);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); 
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
      toast.error('Failed to load syllabus');
    }
  };

  useEffect(() => {
    if (!loading) fetchSyllabusData();
  }, [selectedSubject, activeTab]);

  useEffect(() => {
    setSelectedSubject('all');
  }, [activeTab]);

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
    if (!confirm('Delete subject and all data?')) return;
    try {
      await subjectService.delete(id);
      toast.success('Subject deleted');
      if (selectedSubject === id) setSelectedSubject('all');
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  const handleDeleteItem = async (id: number, type: 'lecture' | 'experiment') => {
    if (!confirm('Delete item?')) return;
    try {
      if (type === 'lecture') await syllabusService.deleteLecture(id);
      else await syllabusService.deleteExperiment(id);
      toast.success('Deleted');
      fetchSyllabusData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName || !newSubjectCode) {
      toast.error('Required fields missing');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await subjectService.create({
        name: newSubjectName,
        code: newSubjectCode,
        subject_type: uploadType
      });
      setSubjects(prev => [...prev, res.data]);
      setUploadSubjectId(res.data.id);
      setUploadStep(2);
      setIsAddingSubject(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      toast.success('Subject created!');
    } catch (error) {
      toast.error('Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveUpload = async () => {
    setIsSubmitting(true);
    try {
      toast.success('Syllabus synced!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadStep(0);
      setUploadSubjectId(null);
      fetchInitialData();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || selectedSubject === 'all') return;
    setIsSubmitting(true);
    try {
      if (activeTab === 'theory') {
        const nextNum = lecturePlans.length > 0 ? Math.max(...lecturePlans.map(p => p.lecture_number)) + 1 : 1;
        const chapterId = chapters.length > 0 ? chapters[0].id : null;
        if (!chapterId) {
           toast.error('Upload syllabus first');
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
      toast.success('Added!');
      fetchSyllabusData();
    } catch (err) {
      toast.error('Add failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeBg = activeTab === 'theory' ? 'bg-primary' : 'bg-purple-600';

  const groupedData = useMemo(() => {
    if (activeTab === 'practical') return [];
    const sortedPlans = [...lecturePlans].sort((a, b) => a.lecture_number - b.lecture_number);
    const groups: Record<number, { chapter: Chapter; plans: LecturePlan[] }> = {};
    chapters.forEach(chap => { groups[chap.id] = { chapter: chap, plans: [] }; });
    sortedPlans.forEach(plan => {
      if (groups[plan.chapter]) groups[plan.chapter].plans.push(plan);
    });
    return Object.values(groups)
      .filter(g => g.plans.length > 0)
      .sort((a, b) => (a.plans[0]?.lecture_number || 0) - (b.plans[0]?.lecture_number || 0));
  }, [chapters, lecturePlans, activeTab]);

  const stats = useMemo(() => {
    const dataItems = activeTab === 'theory' ? lecturePlans : experiments;
    if (!dataItems.length) return { avg: 0, total: 0, completed: 0 };
    const total = dataItems.length;
    const completedCount = dataItems.filter(p => p.status === 'Completed').length;
    return { avg: Math.round((completedCount / total) * 100), total, completed: completedCount };
  }, [lecturePlans, experiments, activeTab]);

  const suggestion = useMemo(() => {
    if (activeTab === 'practical') {
       const pending = experiments.filter(e => e.status === 'Pending').sort((a, b) => a.experiment_number - b.experiment_number);
       if (pending.length > 0) return { icon: <FlaskConical size={20} />, text: `Next Lab: "${pending[0].title}" (E${pending[0].experiment_number}).` };
       return { icon: <Lightbulb size={20} />, text: "Practical progress tracked." };
    }
    const pending = lecturePlans.filter(p => p.status === 'Pending').sort((a, b) => a.lecture_number - b.lecture_number);
    if (pending.length > 0) return { icon: <Clock size={20} />, text: `Next: "${pending[0].topic_name}" (L${pending[0].lecture_number}).` };
    return { icon: <Lightbulb size={20} />, text: "Course planner active." };
  }, [lecturePlans, experiments, activeTab]);

  const filteredUploadSubjects = subjects.filter(s => (s as any).subject_type === uploadType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="px-1">
        <header className="py-10 space-y-2 px-3">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
             <Target size={14} /> Curriculum Planner
           </div>
           <h1 className="text-5xl font-black text-text italic tracking-tighter leading-tight">Syllabus.</h1>
           <div className="pt-6 flex items-center gap-3">
              <button onClick={() => { setShowUploadModal(true); setUploadStep(0); }} className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-gray-100 text-primary font-black text-xs rounded-2xl shadow-xl shadow-gray-200/20"><Upload size={18} /> Upload</button>
              <button onClick={() => setShowManagePanel(true)} className="w-14 h-14 bg-gray-900 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-gray-900/20"><Edit2 size={18} /></button>
           </div>
        </header>
        <MobileSyllabus activeTab={activeTab} setActiveTab={setActiveTab} subjects={subjects} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} groupedData={groupedData} experiments={experiments} stats={stats} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1"><Target size={14} /> Curriculum</div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Syllabus Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border">
            <button onClick={() => setActiveTab('theory')} className={`px-4 py-2 rounded-xl text-[10px] uppercase font-black transition-all ${activeTab === 'theory' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-text-muted'}`}>Theory</button>
            <button onClick={() => setActiveTab('practical')} className={`px-4 py-2 rounded-xl text-[10px] uppercase font-black transition-all ${activeTab === 'practical' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-text-muted'}`}>Practical</button>
          </div>
          <button onClick={() => { setShowUploadModal(true); setUploadStep(0); }} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-primary font-bold shadow-lg hover:bg-gray-50 flex items-center gap-2 active:scale-95 transition-all"><Upload size={18}/><span>Upload</span></button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             <button onClick={() => setSelectedSubject('all')} className={`px-5 py-2.5 rounded-xl text-xs font-bold border shrink-0 ${selectedSubject === 'all' ? 'bg-text text-white border-text' : 'bg-white'}`}>All</button>
             {subjects.filter(s => (s as any).subject_type === activeTab).map(subject => (
                <div key={subject.id} className="group/subject relative flex items-center">
                   <button onClick={() => setSelectedSubject(subject.id)} className={`pl-5 pr-10 py-2.5 rounded-xl text-xs font-bold border shrink-0 ${selectedSubject === subject.id ? `${themeBg} text-white` : 'bg-white'}`}>{subject.name}</button>
                   <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); setShowSubjectEditModal(subject); }} className="p-1 hover:bg-black/10 rounded-md"><Edit2 size={12}/></button>
                      <button onClick={(e) => handleDeleteSubject(e, subject.id)} className="p-1 hover:bg-black/10 rounded-md"><Trash2 size={12}/></button>
                   </div>
                </div>
             ))}
          </div>
          <button onClick={() => setShowManagePanel(!showManagePanel)} className="px-5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2">{showManagePanel ? 'Close' : 'Manage'}</button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border shadow-lg">
             <p className="text-sm font-bold text-text-muted mb-1">Progress</p>
             <h3 className="text-4xl font-black">{stats.avg}%</h3>
             <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.avg}%` }} className={`h-full bg-gradient-to-r from-blue-500 to-purple-500`} />
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-lg flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeTab === 'theory' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{activeTab === 'theory' ? <Layers size={24}/> : <FlaskConical size={24}/>}</div>
             <div><h3 className="text-2xl font-bold">{activeTab === 'theory' ? chapters.length : experiments.length} Items</h3></div>
          </div>
          <div className={`${activeTab === 'theory' ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-purple-50 border-purple-100 text-purple-600'} p-6 rounded-2xl border flex items-start gap-4`}>
             <div className="mt-1">{suggestion.icon}</div>
             <div><p className="text-sm font-medium text-text">{suggestion.text}</p></div>
          </div>
        </section>

        {!groupedData.length && !experiments.length ? (
           <div className="py-32 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center shadow-lg">
              <button onClick={() => { setShowUploadModal(true); setUploadStep(0); }} className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 active:scale-95">Upload Syllabus</button>
           </div>
        ) : activeTab === 'theory' ? (
           <div className="space-y-10">
              {groupedData.map((group, idx) => (
                 <div key={group.chapter.id} className="space-y-4">
                    <div className="flex gap-3 items-center">
                       <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black">{idx + 1}</div>
                       <h3 className="font-black text-xl">{group.chapter.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.plans.map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 hover:shadow-md transition-all">
                             <span className="font-bold text-sm text-text">L{p.lecture_number}: {p.topic_name}</span>
                             {p.status === 'Completed' ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Clock size={16} className="text-gray-300"/>}
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {experiments.map(e => (
                  <div key={e.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black shadow-inner">{e.experiment_number}</div>
                        <h4 className="font-bold text-text">{e.title}</h4>
                     </div>
                     {e.status === 'Completed' ? <CheckCircle2 size={24} className="text-emerald-500"/> : <Clock size={24} className="text-gray-100"/>}
                  </div>
               ))}
           </div>
        )}
      </div>

      <AnimatePresence>
         {showSubjectEditModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubjectEditModal(null)} className="absolute inset-0 bg-text/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                  <h3 className="text-xl font-black mb-6">Edit Subject</h3>
                  <div className="space-y-4">
                     <input type="text" value={showSubjectEditModal.name} onChange={e => setShowSubjectEditModal({...showSubjectEditModal, name: e.target.value})} className="w-full p-4 rounded-2xl border outline-none focus:border-primary/50 transition-colors" placeholder="Name" />
                     <input type="text" value={showSubjectEditModal.code} onChange={e => setShowSubjectEditModal({...showSubjectEditModal, code: e.target.value})} className="w-full p-4 rounded-2xl border outline-none focus:border-primary/50 transition-colors" placeholder="Code" />
                     <button 
                        disabled={isSubmitting}
                        onClick={() => handleUpdateSubject({ name: showSubjectEditModal.name, code: showSubjectEditModal.code })} 
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50"
                     >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showUploadModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUploadModal(false)} className="absolute inset-0 bg-text/50 backdrop-blur-md" />
               <motion.div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                  <div className="p-8 border-b flex justify-between items-center"><h2 className="text-2xl font-black">Sync Curriculum</h2><button onClick={() => setShowUploadModal(false)} className="p-3 bg-gray-50 rounded-2xl"><X size={24}/></button></div>
                  <div className="flex-1 overflow-y-auto p-10">
                     {uploadStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <button onClick={() => { setUploadType('theory'); setUploadStep(1); }} className="p-10 border-2 rounded-[3rem] hover:bg-primary/5 transition-all"><BookOpen size={32} className="text-primary mb-4"/> <h3 className="font-black text-xl">Theory</h3></button>
                           <button onClick={() => { setUploadType('practical'); setUploadStep(1); }} className="p-10 border-2 rounded-[3rem] hover:bg-purple-50 transition-all"><FlaskConical size={32} className="text-purple-600 mb-4"/> <h3 className="font-black text-xl">Practical</h3></button>
                        </div>
                     )}
                     {uploadStep === 1 && (
                        <div className="max-w-md mx-auto space-y-6">
                           <div className="grid gap-3">
                              {filteredUploadSubjects.map(s => (
                                 <button key={s.id} onClick={() => { setUploadSubjectId(s.id); setUploadStep(2); }} className="p-5 border rounded-2xl hover:bg-gray-50 flex justify-between font-bold"><span>{s.name}</span><ArrowRight size={18}/></button>
                              ))}
                           </div>
                           <button onClick={() => setIsAddingSubject(true)} className="w-full py-4 border-2 border-dashed rounded-2xl font-bold">+ New Subject</button>
                           {isAddingSubject && (
                              <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4">
                                 <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="w-full p-4 rounded-xl" placeholder="Name" />
                                 <input type="text" value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} className="w-full p-4 rounded-xl" placeholder="Code" />
                                 <button 
                                    disabled={isSubmitting}
                                    onClick={handleCreateSubject} 
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-black shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50"
                                 >
                                    {isSubmitting ? 'Creating...' : 'Create Subject'}
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
                     {uploadStep === 2 && (
                        <div className="max-w-md mx-auto">
                           {!uploadFile ? (
                              <label className="flex flex-col items-center justify-center h-64 border-4 border-dashed rounded-[3rem] cursor-pointer hover:bg-gray-50"><Upload size={48} className="text-primary mb-4"/><p className="font-black">Browse Excel</p><input type="file" className="hidden" accept=".xlsx" onChange={e => setUploadFile(e.target.files?.[0] || null)}/></label>
                           ) : (
                               <UploadPreview file={uploadFile} subjectId={uploadSubjectId!} type="syllabus" onClose={() => setUploadFile(null)} onSave={onSaveUpload} />
                           )}
                        </div>
                     )}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showManagePanel && (
            <div className="fixed inset-0 z-[120] bg-white flex flex-col">
               <div className="p-10 border-b flex justify-between items-center"><h2 className="text-3xl font-black text-text">Manage {activeTab === 'theory' ? 'Syllabus' : 'Experiments'}</h2><button onClick={() => setShowManagePanel(false)} className="p-4 bg-gray-100 rounded-2xl"><X size={24}/></button></div>
               <div className="flex-1 overflow-y-auto p-10">
                   <div className="max-w-4xl mx-auto space-y-10">
                    <div className="p-8 bg-gray-50 border-2 border-dashed rounded-3xl flex gap-4">
                       <input value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-4 rounded-2xl border outline-none focus:border-primary/50" placeholder="Topic..." /> 
                       <button 
                          disabled={isSubmitting}
                          onClick={handleAddItem} 
                          className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50"
                       >
                          {isSubmitting ? 'Adding...' : 'Add Item'}
                       </button>
                    </div>
                    <div className="grid gap-3">
                       {((activeTab === 'theory' ? lecturePlans : experiments) as any[]).map(item => (
                          <div key={item.id} className="p-5 bg-white border rounded-3xl flex justify-between items-center"><span className="font-bold">{activeTab === 'theory' ? item.topic_name : item.title}</span><button onClick={() => handleDeleteItem(item.id, activeTab === 'theory' ? 'lecture' : 'experiment')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={20}/></button></div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Syllabus;
