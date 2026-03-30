import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, Users, BookOpen, 
  AlertCircle, Lightbulb, Upload, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lectureService, syllabusService, notificationService, subjectService } from '../services/api';
import { useDashboardLogic } from '../hooks/useDashboardLogic';
import UploadPreview from '../components/UploadPreview';
import TimetableCard from '../components/TimetableCard';
import type { Timetable, DashboardStats, LecturePlan, Notification, Subject, Experiment } from '../types';
import { toast } from 'react-toastify';


const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayLectures, setTodayLectures] = useState<Timetable[]>([]);
  const [lecturePlans, setLecturePlans] = useState<LecturePlan[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showUploadModal, setShowUploadModal] = useState<'timetable' | 'syllabus' | null>(null);
  const [uploadStep, setUploadStep] = useState(0); // 0: Type, 1: Subject, 2: Upload
  const [uploadType, setUploadType] = useState<'theory' | 'practical'>('theory');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isLectureExpanded, setIsLectureExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicTaught, setTopicTaught] = useState('');

  // New Subject Form States
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, todayRes, plansRes, expsRes, notifRes, subjectsRes] = await Promise.all([
        lectureService.getStats(),
        lectureService.getToday(),
        syllabusService.getLecturePlans(),
        syllabusService.getExperiments(),
        notificationService.getAll(),
        lectureService.getSubjects()
      ]);
      setStats(statsRes.data);
      setTodayLectures(todayRes.data);
      setLecturePlans(plansRes.data);
      setExperiments(expsRes.data);
      setNotifications(notifRes.data.slice(0, 4));
      setSubjects(subjectsRes.data);
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

  const { activeLecture, nextLecture, syllabusSuggestion } = useDashboardLogic(todayLectures, lecturePlans, experiments);

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
    console.log("Submitting subject...", payload);
    try {
      const res = await subjectService.create(payload);
      setSubjects(prev => [...prev, res.data]);
      setSelectedSubjectId(res.data.id);
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
      toast.success(`${showUploadModal === 'timetable' ? 'Timetable' : 'Syllabus'} synced successfully!`);
      setShowUploadModal(null);
      setUploadFile(null);
      setUploadStep(0);
      setUploadType('theory');
      setSelectedSubjectId(null);
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

  const filteredSubjects = subjects.filter(s => (s as any).subject_type === uploadType);

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
              {/* Only show view timetable button if it actually exists */}
              <TimetableCard onUploadClick={() => setShowUploadModal('timetable')} isCompact />
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
            <TimetableCard onUploadClick={() => setShowUploadModal('timetable')} />
            {[
              { label: 'Syllabus', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => { setShowUploadModal('syllabus'); setUploadStep(0); } },
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-text">
                  Upload {showUploadModal === 'timetable' ? 'Timetable' : 'Syllabus'}
                </h3>
                {showUploadModal === 'syllabus' && uploadStep > 0 && !uploadFile && (
                  <button 
                    onClick={() => setUploadStep(prev => prev - 1)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Back to Step {uploadStep}
                  </button>
                )}
              </div>
              {showUploadModal === 'syllabus' && (
                <p className="text-text-muted mb-8 italic text-sm">
                  Step {uploadStep + 1}: {
                    uploadStep === 0 ? 'Select academic type' :
                    uploadStep === 1 ? 'Choose the target subject' :
                    'Upload the document'
                  }
                </p>
              )}
              {showUploadModal === 'timetable' && !uploadFile && (
                <p className="text-text-muted mb-8 italic text-sm">
                  Upload your weekly schedule in Excel or PDF format
                </p>
              )}

              {uploadFile ? (
                <UploadPreview 
                  type={showUploadModal} 
                  file={uploadFile} 
                  subjectId={selectedSubjectId}
                  subjectType={uploadType}
                  onClose={() => {
                    setUploadFile(null);
                    setShowUploadModal(null);
                    setUploadStep(0);
                  }}
                  onSave={onSaveUpload}
                />
              ) : showUploadModal === 'syllabus' ? (
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
                          <Plus size={32} />
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
                           {isAddingSubject ? 'View List' : '+ Add New Subject'}
                         </button>
                      </div>

                      {isAddingSubject ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100"
                        >
                          <div className="space-y-3">
                            <input 
                              type="text" 
                              placeholder="Subject Name (e.g. Artificial Intelligence)"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                            <input 
                              type="text" 
                              placeholder="Subject Code (e.g. CS601)"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                            <div className="pt-2">
                              <button 
                                onClick={handleCreateSubject}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                              >
                                {isSubmitting ? 'Creating...' : 'Create & Proceed'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
                            <button 
                              key={subject.id}
                              onClick={() => { setSelectedSubjectId(subject.id); setUploadStep(2); }}
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
                              No {uploadType} subjects found. Add a subject to continue.
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
                        <p className="text-sm opacity-60 mt-1">Excel or PDF formats supported</p>
                      </div>
                    </div>
                  </label>
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
