import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Target
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

interface SyllabusPlan {
  id: number;
  subject: number;
  subject_name: string;
  topic_name: string;
  total_lectures_required: number;
}

interface SyllabusProgress {
  id: number;
  subject: number;
  subject_name: string;
  topic_name: string;
  lectures_completed: number;
  completion_percentage: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

const Syllabus = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plans, setPlans] = useState<SyllabusPlan[]>([]);
  const [progress, setProgress] = useState<SyllabusProgress[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ subject: '', topic_name: '', total_lectures: 5 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, planRes, progRes] = await Promise.all([
        axios.get(`${API_BASE}/subjects/`),
        axios.get(`${API_BASE}/syllabus-plans/`),
        axios.get(`${API_BASE}/syllabus-progress/`)
      ]);
      setSubjects(subRes.data);
      setPlans(planRes.data);
      setProgress(progRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching syllabus data:', err);
      setLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/syllabus-plans/`, {
        subject: parseInt(newTopic.subject),
        topic_name: newTopic.topic_name,
        total_lectures_required: newTopic.total_lectures
      });
      setShowAddModal(false);
      setNewTopic({ subject: '', topic_name: '', total_lectures: 5 });
      fetchData();
    } catch (err) {
      console.error('Error adding topic:', err);
      alert('Failed to add topic.');
    }
  };

  const getFilteredProgress = () => {
    if (selectedSubject === 'all') return progress;
    return progress.filter(p => p.subject === selectedSubject);
  };

  const getOverallStats = () => {
    const data = getFilteredProgress();
    if (data.length === 0) return { avg: 0, total: 0, completed: 0 };
    const total = data.length;
    const completed = data.filter(p => p.completion_percentage === 100).length;
    const avg = data.reduce((acc, curr) => acc + curr.completion_percentage, 0) / total;
    return { avg: Math.round(avg), total, completed };
  };

  const stats = getOverallStats();

  // "AI" Suggestions
  const getSuggestion = () => {
    const slowTopics = getFilteredProgress().filter(p => p.completion_percentage > 0 && p.completion_percentage < 40);
    if (slowTopics.length > 0) {
      return {
        icon: <Clock className="text-orange-500" size={20} />,
        text: `Topic "${slowTopics[0].topic_name}" is progressing slower than expected. Consider scheduling extra sessions.`
      };
    }
    if (stats.avg > 80) {
      return {
        icon: <TrendingUp className="text-green-500" size={20} />,
        text: "Course pacing is excellent. You're on track to finish 2 weeks early!"
      };
    }
    return {
      icon: <Lightbulb className="text-blue-500" size={20} />,
      text: "Based on current trends, try to cover 'Database Systems' in the next 3 days."
    };
  };

  const suggestion = getSuggestion();

  return (
    <div className="space-y-8 pb-20">
      {/* Header Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:scale-110 transition-transform">
            <Target size={120} />
          </div>
          <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">Overall Progress</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-text">{stats.avg}%</h3>
            <span className="text-xs text-green-500 font-bold mb-2">+5% vs last week</span>
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
          <p className="text-sm font-bold text-text-muted mb-1 uppercase tracking-wider">Topics Covered</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text">{stats.completed} / {stats.total}</h3>
              <p className="text-xs text-text-muted">Managed successfully</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
          <div className="mt-1">{suggestion.icon}</div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Smart Suggestion</p>
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
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", selectedSubject === 'all' ? "bg-primary text-white" : "hover:bg-gray-50 text-text-muted")}
          >
            All Subjects
          </button>
          {subjects.map(s => (
            <button 
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", selectedSubject === s.id ? "bg-primary text-white" : "hover:bg-gray-50 text-text-muted")}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> New Topic
        </button>
      </div>

      {/* Progress List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          Syllabus Mastery <ChevronRight className="text-gray-300" size={20} />
        </h2>
        {getFilteredProgress().map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 group hover:shadow-lg hover:shadow-gray-100/50 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] uppercase font-black">{item.subject_name}</span>
                  {item.completion_percentage === 100 && (
                    <span className="flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase">
                      <CheckCircle2 size={12} /> Mastery
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-text group-hover:text-primary transition-colors">{item.topic_name}</h4>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-text-muted uppercase font-bold">Progress</p>
                  <p className="text-lg font-black text-text">{item.completion_percentage}%</p>
                </div>
                <div className="w-24 md:w-48 h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.completion_percentage}%` }}
                    className={cn(
                      "h-full transition-all duration-1000",
                      item.completion_percentage < 30 ? "bg-red-400" : 
                      item.completion_percentage < 70 ? "bg-orange-400" : "bg-green-400"
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {getFilteredProgress().length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 font-medium tracking-tight">No topics planned for this subject yet.</p>
          </div>
        )}
      </div>

      {/* Add Modal (Simple overlay for now) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-text/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Plan New Topic</h3>
              <form onSubmit={handleAddTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2 uppercase">Subject</label>
                  <select 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={newTopic.subject}
                    onChange={e => setNewTopic({...newTopic, subject: e.target.value})}
                  >
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2 uppercase">Topic Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Organic Chemistry"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={newTopic.topic_name}
                    onChange={e => setNewTopic({...newTopic, topic_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2 uppercase">Estimated Lectures</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={newTopic.total_lectures}
                    onChange={e => setNewTopic({...newTopic, total_lectures: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 border border-gray-100 rounded-xl font-bold text-text-muted hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Create Plan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Syllabus;
