import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, Users, BookOpen, 
  AlertCircle, Lightbulb, Upload, CheckCircle2, XCircle,
  FileSpreadsheet, FileText, ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lectureService, syllabusService, notificationService } from '../services/api';
import { useDashboardLogic } from '../hooks/useDashboardLogic';
import UploadPreview from '../components/UploadPreview';
import type { Timetable, DashboardStats, SyllabusPlan, Notification } from '../types';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayLectures, setTodayLectures] = useState<Timetable[]>([]);
  const [syllabusPlans, setSyllabusPlans] = useState<SyllabusPlan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showUploadModal, setShowUploadModal] = useState<'timetable' | 'syllabus' | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isLectureExpanded, setIsLectureExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicTaught, setTopicTaught] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, todayRes, plansRes, , notifRes] = await Promise.all([
        lectureService.getStats(),
        lectureService.getToday(),
        syllabusService.getPlans(),
        syllabusService.getProgress(),
        notificationService.getAll()
      ]);
      setStats(statsRes.data);
      setTodayLectures(todayRes.data);
      setSyllabusPlans(plansRes.data);
      setNotifications(notifRes.data.slice(0, 4));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { activeLecture, nextLecture, syllabusSuggestion } = useDashboardLogic(todayLectures, syllabusPlans);

  // Sync suggestion to state when it changes
  useEffect(() => {
    if (syllabusSuggestion && !topicTaught) {
      setTopicTaught(syllabusSuggestion);
    }
  }, [syllabusSuggestion, topicTaught]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const onSaveUpload = async (parsedData: any[]) => {
    console.log('Parsed data to save:', parsedData);
    setIsSubmitting(true);
    try {
      // In a real app, we'd send all parsedData to the backend
      // Here we simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${showUploadModal === 'timetable' ? 'Timetable' : 'Syllabus'} synced successfully!`);
      setShowUploadModal(null);
      setUploadFile(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartLecture = async () => {
    if (!activeLecture) return;
    setIsSubmitting(true);
    try {
      await lectureService.markCompleted(activeLecture.id, topicTaught || 'General Lecture');
      toast.success('Lecture marked as completed!');
      setIsLectureExpanded(false);
      fetchData();
    } catch (error) {
       toast.error('Failed to update lecture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipLecture = async () => {
    if (!activeLecture) return;
    if (!confirm('Are you sure you want to skip this lecture?')) return;
    
    setIsSubmitting(true);
    try {
      await lectureService.markSkipped(activeLecture.id, 'Manually skipped from dashboard');
      toast.success('Lecture marked as skipped');
      fetchData();
    } catch (error) {
      toast.error('Failed to skip lecture');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Skipped': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. HERO SECTION (Ongoing Lecture Card) */}
      <section>
        <AnimatePresence mode="wait">
          {activeLecture ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-primary/5 overflow-hidden"
            >
              <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Ongoing Session
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-text capitalize">
                    {activeLecture.subject_details?.name}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-text-muted font-medium">
                    <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Clock size={16} /> {activeLecture.start_time.slice(0, 5)} - {activeLecture.end_time.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Users size={16} /> Div {activeLecture.division_name} {activeLecture.batch_name ? `(${activeLecture.batch_name})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start md:items-center">
                  <button 
                    onClick={() => setIsLectureExpanded(!isLectureExpanded)}
                    disabled={activeLecture.lecture_status === 'Completed' || isSubmitting}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
                  >
                    {activeLecture.lecture_status === 'Completed' ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                    {activeLecture.lecture_status === 'Completed' ? 'Already Done' : 'Start Lecture'}
                  </button>
                  <button 
                    onClick={handleSkipLecture}
                    disabled={activeLecture.lecture_status === 'Completed' || isSubmitting}
                    className="px-8 py-4 bg-white text-text-muted border border-gray-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <XCircle size={20} /> Skip
                  </button>
                </div>
              </div>

              {/* Inline Expansion Panel */}
              <AnimatePresence>
                {isLectureExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 bg-gray-50/50"
                  >
                    <div className="p-8 md:p-10 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-text-muted">Topic to teach</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={topicTaught}
                              onChange={(e) => setTopicTaught(e.target.value)}
                              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                              placeholder="e.g. Introduction to AI"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg uppercase">
                              <Lightbulb size={12} /> Suggestion
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end gap-3">
                           <button 
                             onClick={handleStartLecture}
                             disabled={isSubmitting}
                             className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-70"
                           >
                             {isSubmitting ? <span className="animate-spin text-xl">◌</span> : <CheckCircle2 size={20} />}
                             Mark Completed
                           </button>
                           <button 
                             onClick={() => navigate('/app/attendance')}
                             className="px-8 py-4 bg-blue-50 text-primary border border-blue-100 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-all"
                           >
                              Attendance
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="upcoming"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 p-8 flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-text">No active lecture right now</h2>
                <p className="text-text-muted mt-1">
                  {nextLecture ? `Next: ${nextLecture.subject_details?.name} at ${nextLecture.start_time.slice(0, 5)}` : 'You are all set for today!'}
                </p>
              </div>
              <button 
                onClick={() => navigate('/app/timetable')}
                className="px-6 py-3 text-primary font-bold hover:bg-primary/5 rounded-2xl transition-all"
              >
                View Timetable
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. QUICK ACTIONS & PROGRESS SUMMARY GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <section className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-text ml-2">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Add Subject', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50', action: () => {} },
              { label: 'Timetable', icon: Upload, color: 'text-purple-600', bg: 'bg-purple-50', action: () => setShowUploadModal('timetable') },
              { label: 'Syllabus', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => setShowUploadModal('syllabus') },
              { label: 'Add Students', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50', action: () => {} },
              { label: 'Attendance', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', action: () => navigate('/app/attendance') },
              { label: 'Analytics', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => navigate('/app/analytics') },
            ].map((action) => (
              <button 
                key={action.label}
                onClick={action.action}
                className="group flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <div className={`${action.bg} ${action.color} p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon size={24} />
                </div>
                <span className="text-sm font-bold text-text">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Progress Summary */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-text ml-2">Learning Progress</h3>
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text-muted uppercase tracking-wider text-[10px]">Avg Attendance</span>
                <span className="text-text">{stats?.attendance_avg}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${stats?.attendance_avg}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text-muted uppercase tracking-wider text-[10px]">Syllabus Done</span>
                <span className="text-text">{stats?.syllabus_avg}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${stats?.syllabus_avg}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
               <div>
                 <p className="text-[10px] font-black text-text-muted uppercase mb-1">Done</p>
                 <p className="text-2xl font-black text-emerald-600">{stats?.completed_today}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black text-text-muted uppercase mb-1">Pending</p>
                 <p className="text-2xl font-black text-rose-500">{stats?.pending_today}</p>
               </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. TODAY'S LECTURES & ALERTS GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Lectures */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-text">Today's Schedule</h3>
            <span className="text-xs font-bold text-text-muted">{stats?.today_day}</span>
          </div>
          <div className="space-y-3">
            {todayLectures.length === 0 ? (
              <div className="p-10 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-text-muted">
                No lectures found. Upload a timetable to get started.
              </div>
            ) : (
              todayLectures.map((l) => (
                <div key={l.id} className="group p-5 bg-white border border-gray-100 rounded-3xl flex items-center justify-between hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                      l.id === activeLecture?.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
                    }`}>
                      {l.subject_details?.code.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text">{l.subject_details?.name}</h4>
                      <p className="text-xs text-text-muted font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {l.start_time.slice(0, 5)} - {l.end_time.slice(0, 5)} • Div {l.division_name}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusColor(l.lecture_status)}`}>
                    {l.lecture_status || 'Pending'}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Latest Alerts */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-text ml-2">Latest Alerts</h3>
          <div className="space-y-3">
            {notifications.length === 0 ? (
               <p className="text-sm text-text-muted italic px-2">No new alerts.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex gap-3 hover:border-primary/20 transition-all cursor-pointer">
                  <div className={`p-2 rounded-lg h-fit ${
                    n.type === 'Warning' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-text">{n.title}</h5>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => navigate('/app/notifications')}
              className="w-full py-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              See all notifications
            </button>
          </div>
        </section>
      </div>

      {/* MOCK UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowUploadModal(null)}
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <h3 className="text-2xl font-black text-text mb-2">
                Upload {showUploadModal === 'timetable' ? 'Timetable' : 'Syllabus'}
              </h3>
              <p className="text-text-muted mb-8">
                Select a file to parse and sync with your dashboard.
              </p>

              {uploadFile ? (
                <UploadPreview 
                  type={showUploadModal || 'timetable'} 
                  file={uploadFile} 
                  onClose={() => {
                    setUploadFile(null);
                    setShowUploadModal(null);
                  }}
                  onSave={onSaveUpload}
                />
              ) : (
                <div className="space-y-6">
                  <label className="group relative block px-10 py-16 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    <div className="flex flex-col items-center gap-4 text-text-muted group-hover:text-primary">
                      <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Click or drag to upload</p>
                        <p className="text-sm opacity-60 mt-1">Excel, PDF or Image formats supported</p>
                      </div>
                    </div>
                  </label>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                       <FileSpreadsheet size={24} /> <span className="text-[10px] font-bold">Excel</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                       <FileText size={24} /> <span className="text-[10px] font-bold">PDF</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                       <ImageIcon size={24} /> <span className="text-[10px] font-bold">Image</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// BarChart3 icon component since it was missing from lucide or needed a specific import
const BarChart3 = ({ size, className }: { size? : number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
  </svg>
);

export default Dashboard;
