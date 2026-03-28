import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  Target,
  Layers,
  Calendar,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import { syllabusService, subjectService } from '../services/api';
import type { Subject, Chapter, LecturePlan, Experiment } from '../types';
import { toast } from 'react-toastify';


const Syllabus = () => {
  const [activeTab, setActiveTab] = useState<'theory' | 'practical'>('theory');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lecturePlans, setLecturePlans] = useState<LecturePlan[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

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

  const filteredSubjects = subjects.filter(s => s.subject_type === activeTab);

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

  return (
    <div className="space-y-8 pb-20">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-tight transition-all ${
              activeTab === 'theory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} /> Theory
          </button>
          <button 
            onClick={() => setActiveTab('practical')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-tight transition-all ${
              activeTab === 'practical' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-text-muted hover:bg-gray-50'
            }`}
          >
            <FlaskConical size={18} /> Practical
          </button>
        </div>
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

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 overflow-x-auto max-w-full">
          <button 
            onClick={() => setSelectedSubject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedSubject === 'all' ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-text-muted"}`}
          >
            All {activeTab === 'theory' ? 'Subjects' : 'Labs'}
          </button>
          {filteredSubjects.map(s => (
            <button 
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedSubject === s.id ? "bg-primary text-white" : "hover:bg-gray-50 text-text-muted"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
            onClick={() => toast.info(`Please use Dashboard to upload ${activeTab} syllabus`)}
            className="flex-1 md:w-auto px-6 py-3 bg-white text-text border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
            >
            <Calendar size={18} /> Manage
            </button>
        </div>
      </div>

      {/* Hierarchical Progress List */}
      <div className="space-y-10">
        {activeTab === 'theory' ? groupedData.map((group, groupIdx) => {
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
        }) : (
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

        {((activeTab === 'theory' && groupedData.length === 0) || (activeTab === 'practical' && experiments.length === 0)) && (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 font-bold tracking-tight">No {activeTab} syllabus data found.</p>
            <p className="text-xs text-text-muted mt-1 uppercase font-black">Please upload a {activeTab} syllabus Excel file from the dashboard.</p>
          </div>
        )}
      </div>
    </div>

  );
};

export default Syllabus;
