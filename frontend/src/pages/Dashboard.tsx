import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { lectureService, syllabusService } from '../services/api';
import type { Timetable, DashboardStats, SyllabusProgress } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayLectures, setTodayLectures] = useState<Timetable[]>([]);
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, todayRes, progRes] = await Promise.all([
          lectureService.getStats(),
          lectureService.getToday(),
          syllabusService.getProgress()
        ]);
        setStats(statsRes.data);
        setTodayLectures(todayRes.data);
        setSyllabusProgress(progRes.data.slice(0, 3)); // Top 3 topics
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="grid gap-4 place-items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-text-muted animate-pulse font-medium">Loading your classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/20">
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Good Morning, Omkar 👋</h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl font-medium">
            It's {stats?.today_day}. You have {stats?.total_today} lectures scheduled today.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => navigate('/attendance')}
              className="px-6 py-3 bg-white text-primary rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Users size={20} /> Take Attendance
            </button>
            <button 
              onClick={() => navigate('/syllabus')}
              className="px-6 py-3 bg-primary-foreground/20 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              <BookOpen size={20} /> View Syllabus
            </button>
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
      </section>

      {/* Stats Section */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <ArrowUpRight className="text-gray-300" size={20} />
          </div>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">Today's Lectures</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-text">{stats?.completed_today}/{stats?.total_today}</h3>
            <span className="text-xs text-text-muted font-bold">Done</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <ArrowUpRight className="text-gray-300" size={20} />
          </div>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">Avg. Attendance</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-text">{stats?.attendance_avg}%</h3>
            <span className={cn("text-xs font-bold", (stats?.attendance_avg || 0) < 75 ? "text-red-500" : "text-green-500")}>
              {(stats?.attendance_avg || 0) < 75 ? 'Critical' : 'Healthy'}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className={cn("h-full transition-all duration-1000", (stats?.attendance_avg || 0) < 75 ? "bg-red-400" : "bg-green-400")} style={{ width: `${stats?.attendance_avg}%` }} />
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <ArrowUpRight className="text-gray-300" size={20} />
          </div>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">Syllabus Completion</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-text">{stats?.syllabus_avg}%</h3>
            <span className="text-xs text-text-muted font-bold">Overall</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${stats?.syllabus_avg}%` }} />
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">Pending Sync</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-text">{stats?.pending_today}</h3>
            <span className="text-xs text-text-muted font-bold">Tasks</span>
          </div>
        </motion.div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Today's Schedule */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text">Live Classroom Feed</h3>
            <button onClick={() => navigate('/timetable')} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              Full Timetable <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {todayLectures.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center py-20">
                <p className="text-text-muted font-medium">No active sessions for today.</p>
              </div>
            ) : (
              todayLectures.map((lecture) => (
                <div key={lecture.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary font-black text-lg transition-colors group-hover:bg-primary/10">
                      {lecture.subject_details?.code.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-text group-hover:text-primary transition-colors">{lecture.subject_details?.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-sm text-text-muted font-medium">
                          <Clock size={14} className="text-gray-400" />
                          {lecture.start_time.slice(0, 5)} - {lecture.end_time.slice(0, 5)}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase text-text-muted">
                          Div {lecture.division_name} {lecture.batch_name ? `- ${lecture.batch_name}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {lecture.lecture_status ? (
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                        lecture.lecture_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {lecture.lecture_status}
                      </span>
                      <button 
                        onClick={() => navigate('/attendance')}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Update Attendance
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                       <button 
                        onClick={() => navigate('/lectures', { state: { timetableId: lecture.id } })}
                        className="btn btn-primary flex items-center gap-2 text-sm shadow-lg shadow-primary/10"
                      >
                        <Plus size={16} /> Log session
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Syllabus Progress Quick View */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text">Syllabus Insights</h3>
            <button onClick={() => navigate('/syllabus')} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              Planner <ChevronRight size={16} />
            </button>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            {syllabusProgress.length === 0 ? (
              <p className="text-center text-text-muted py-8 italic">No active trackers</p>
            ) : (
              syllabusProgress.map(prog => (
                <div key={prog.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-text truncate max-w-[120px]">{prog.topic_name}</span>
                    <span className="font-black text-primary">{prog.completion_percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${prog.completion_percentage}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              ))
            )}
            <div className="pt-4 mt-4 border-t border-gray-50">
               <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl">
                  <Lightbulb className="text-blue-500 mt-1" size={18} />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    You've covered <strong>15%</strong> more topics this month compared to last semester. Keep it up!
                  </p>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
