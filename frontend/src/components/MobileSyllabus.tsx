import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock,
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  FlaskConical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Subject, LecturePlan, Experiment } from '../types';

interface MobileSyllabusProps {
  activeTab: 'theory' | 'practical';
  setActiveTab: (val: 'theory' | 'practical') => void;
  subjects: Subject[];
  selectedSubject: number | 'all';
  setSelectedSubject: (val: number | 'all') => void;
  groupedData: any[];
  experiments: Experiment[];
  stats: { avg: number; total: number; completed: number };
}

const MobileSyllabus: React.FC<MobileSyllabusProps> = ({
  activeTab,
  setActiveTab,
  subjects,
  selectedSubject,
  setSelectedSubject,
  groupedData,
  experiments,
  stats,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSubjects = subjects.filter(s => (s as any).subject_type === activeTab);

  return (
    <div className="flex flex-col space-y-8 pb-20">
      {/* 1. MOBILE TABS & SUBJECT SELECTOR */}
      <section className="space-y-6">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'theory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted'}`}
          >
            <BookOpen size={14} /> Theory
          </button>
          <button 
            onClick={() => setActiveTab('practical')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'practical' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-text-muted'}`}
          >
            <FlaskConical size={14} /> Practical
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 no-scrollbar -mx-4 px-4 scroll-smooth">
          <button 
            onClick={() => setSelectedSubject('all')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
              selectedSubject === 'all' 
              ? 'bg-text text-white border-text shadow-lg' 
              : 'bg-white text-text-muted border-gray-100'
            }`}
          >
            All
          </button>
          {filteredSubjects.map(subject => (
            <button 
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                selectedSubject === subject.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-white text-text-muted border-gray-100'
              }`}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </section>

      {/* 2. PROGRESS OVERVIEW CARD */}
      <section className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/10">
        <div className="flex items-center justify-between mb-6">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
             {activeTab === 'theory' ? 'Syllabus' : 'Laboratory'} Progress
           </p>
           <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/5 rounded-full uppercase">
             {stats.completed} / {stats.total} Done
           </span>
        </div>
        <div className="flex items-end gap-3 mb-6">
           <h3 className="text-4xl font-black text-text italic tracking-tighter">{stats.avg}%</h3>
           <p className="text-[10px] font-bold text-text-muted mb-1 opacity-60 uppercase tracking-widest">Completion</p>
        </div>
        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${stats.avg}%` }}
             className={`h-full ${activeTab === 'theory' ? 'bg-primary' : 'bg-purple-600'}`}
           />
        </div>
      </section>

      {/* 3. LIST CONTENT */}
      <section className="space-y-8">
        {activeTab === 'theory' ? (
          groupedData.map((group, groupIdx) => (
            <div key={group.chapter.id} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs italic shrink-0">
                  {groupIdx + 1}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-text text-base italic tracking-tight truncate">{group.chapter.name}</h4>
                  <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-40">
                    CO: {group.chapter.co_covered} • {group.plans.length} Topics
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {group.plans.map((item: LecturePlan) => (
                  <motion.div
                    key={item.id}
                    onClick={() => toggleExpand(item.id)}
                    className={`bg-white rounded-[1.5rem] border transition-all ${
                      expandedItems[item.id] ? 'border-primary ring-4 ring-primary/5' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 ${
                          item.status === 'Completed' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-gray-50 text-text-muted border border-gray-100'
                        }`}>
                          L{item.lecture_number}
                        </div>
                        <span className={`text-[13px] font-black tracking-tight break-words leading-tight ${item.status === 'Completed' ? 'text-text opacity-60' : 'text-text'}`}>
                          {item.topic_name}
                        </span>
                      </div>
                      {expandedItems[item.id] ? <ChevronUp size={16} className="shrink-0 text-gray-300" /> : <ChevronDown size={16} className="shrink-0 text-gray-300" />}
                    </div>

                    <AnimatePresence>
                      {expandedItems[item.id] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 space-y-4">
                             <div className="h-[1px] bg-gray-50 w-full" />
                             <div className="flex items-center justify-between">
                                <div className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">Status</div>
                                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${item.status === 'Completed' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                  {item.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock className="animate-spin-slow" size={12} />}
                                  {item.status}
                                </div>
                             </div>
                             <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-semibold text-text-muted leading-relaxed italic">
                                  "Topic aligned with CO {group.chapter.co_covered} for {group.chapter.name}."
                                </p>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid gap-3">
            {experiments.map((exp) => (
              <motion.div 
                key={exp.id}
                onClick={() => toggleExpand(exp.id)}
                className={`bg-white rounded-[2rem] border p-4 transition-all ${
                  expandedItems[exp.id] ? 'border-purple-600 ring-4 ring-purple-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-base shrink-0">
                        {exp.experiment_number}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-text italic text-base tracking-tight leading-tight mb-1 truncate">{exp.title}</h4>
                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-40">Lab Experiment</p>
                      </div>
                   </div>
                   {expandedItems[exp.id] ? <ChevronUp size={18} className="shrink-0 text-gray-300" /> : <ChevronDown size={18} className="shrink-0 text-gray-300" />}
                </div>

                <AnimatePresence>
                   {expandedItems[exp.id] && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-text-muted tracking-widest opacity-40">Status</span>
                              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${exp.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-text-muted border border-gray-100'}`}>
                                 {exp.status === 'Completed' && <Check size={12} />} {exp.status}
                              </div>
                           </div>
                           <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                              <p className="text-[10px] font-bold text-purple-900 leading-relaxed italic opacity-80">
                                Focuses on practical application of current module.
                              </p>
                           </div>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 4. EMPTY DATA VIEW */}
      {(!groupedData.length && !experiments.length) && (
        <div className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <BookOpen size={24} />
            </div>
            <h2 className="text-lg font-black text-text mb-2 tracking-tight italic">Empty Path.</h2>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-60 max-w-[180px]">
                Upload a syllabus file to start your journey.
            </p>
        </div>
      )}
    </div>
  );
};

export default MobileSyllabus;
