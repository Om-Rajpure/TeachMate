import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  Target,
  Layers,
  Calendar
} from 'lucide-react';
import { syllabusService, subjectService } from '../services/api';
import type { Subject, Chapter, LecturePlan } from '../types';
import { toast } from 'react-toastify';

const Syllabus = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lecturePlans, setLecturePlans] = useState<LecturePlan[]>([]);
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
      const [chapRes, planRes] = await Promise.all([
        syllabusService.getChapters(subjectId),
        syllabusService.getLecturePlans(subjectId)
      ]);
      setChapters(chapRes.data);
      setLecturePlans(planRes.data);
    } catch (err) {
      console.error('Error fetching syllabus data:', err);
      toast.error('Failed to load syllabus details');
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchSyllabusData();
    }
  }, [selectedSubject]);

  // Group lecture plans by chapter
  const groupedData = useMemo(() => {
    const groups: Record<number, { chapter: Chapter; plans: LecturePlan[] }> = {};
    
    chapters.forEach(chap => {
      groups[chap.id] = { chapter: chap, plans: [] };
    });

    lecturePlans.forEach(plan => {
      if (groups[plan.chapter]) {
        groups[plan.chapter].plans.push(plan);
      }
    });

    return Object.values(groups).sort((a, b) => a.chapter.name.localeCompare(b.chapter.name));
  }, [chapters, lecturePlans]);

  const stats = useMemo(() => {
    if (lecturePlans.length === 0) return { avg: 0, total: 0, completed: 0 };
    const total = lecturePlans.length;
    const completedCount = lecturePlans.filter(p => p.status === 'Completed').length;
    const avg = (completedCount / total) * 100;
    return { avg: Math.round(avg), total, completed: completedCount };
  }, [lecturePlans]);

  // "AI" Suggestions
  const suggestion = useMemo(() => {
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
  }, [lecturePlans, stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:scale-110 transition-transform">
            <Target size={120} />
          </div>
          <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">Overall Syllabus Progress</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-text">{stats.avg}%</h3>
            <span className="text-xs text-green-500 font-bold mb-2">
              {stats.completed} / {stats.total} Lecs
            </span>
          </div>
          <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.avg}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">Syllabus Structure</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text">{chapters.length} Chapters</h3>
              <p className="text-xs text-text-muted">Distributed across subjects</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
          <div className="mt-1">{suggestion.icon}</div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Smart Planner</p>
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
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedSubject === 'all' ? "bg-primary text-white" : "hover:bg-gray-50 text-text-muted"}`}
          >
            All Subjects
          </button>
          {subjects.map(s => (
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
            onClick={() => toast.info('Please use Dashboard to upload Excel syllabus')}
            className="flex-1 md:w-auto px-6 py-3 bg-white text-text border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
            >
            <Calendar size={18} /> Plan Auto
            </button>
        </div>
      </div>

      {/* Hierarchical Progress List */}
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

        {groupedData.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 font-bold tracking-tight">No syllabus data found.</p>
            <p className="text-xs text-text-muted mt-1 uppercase font-black">Please upload a syllabus Excel file from the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Syllabus;
