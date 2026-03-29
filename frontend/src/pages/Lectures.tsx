import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, CheckCircle, XCircle, FileText, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lectureService, timetableService, syllabusService } from '../services/api';
import type { Lecture, Timetable, SyllabusPlan } from '../types';

const Lectures = () => {
  const location = useLocation();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [syllabusPlans, setSyllabusPlans] = useState<SyllabusPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    timetable: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    topic_taught: '',
    status: 'Completed',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
    fetchSyllabus();
    if (location.state?.timetableId) {
      setFormData(prev => ({ ...prev, timetable: location.state.timetableId.toString() }));
      setIsModalOpen(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [lectRes, tableRes] = await Promise.all([
        lectureService.getAll(),
        timetableService.getAll()
      ]);
      setLectures(lectRes.data);
      setTimetable(tableRes.data);
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabus = async () => {
    try {
      const res = await syllabusService.getLecturePlans();
      setSyllabusPlans(res.data);
    } catch (error) {
      console.error('Failed to fetch syllabus plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        timetable: parseInt(formData.timetable),
        topic: formData.topic ? parseInt(formData.topic) : null
      };
      await lectureService.create(dataToSubmit);
      setIsModalOpen(false);
      fetchData();
      // Reset form
      setFormData({
        timetable: '',
        date: new Date().toISOString().split('T')[0],
        topic: '',
        topic_taught: '',
        status: 'Completed',
        remarks: ''
      });
    } catch (error) {
      alert('Error saving lecture log. Note: You might have already logged this lecture for today.');
    }
  };

  // Filter topics based on selected timetable's subject
  const getFilteredTopics = () => {
    if (!formData.timetable) return [];
    const selectedSlot = timetable.find(t => t.id === parseInt(formData.timetable));
    if (!selectedSlot) return [];
    return syllabusPlans.filter(p => p.subject === selectedSlot.subject);
  };

  const filteredTopics = getFilteredTopics();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Lecture History</h2>
          <p className="text-text-muted text-sm mt-1">Track classroom progress and syllabus coverage.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} />
          Log Manual Entry
        </button>
      </div>

      <div className="space-y-4">
        {lectures.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={32} />
            </div>
            <p className="text-text-muted font-medium">No lecture logs found.</p>
          </div>
        ) : (
          lectures.map((lecture: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={lecture.id} 
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  lecture.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {lecture.status === 'Completed' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-text group-hover:text-primary transition-colors">{lecture.timetable_details?.subject_details?.name}</h4>
                    <span className="text-[10px] font-black uppercase bg-gray-100 px-2 py-0.5 rounded-lg text-text-muted">
                      Div {lecture.timetable_details?.division_name} {lecture.timetable_details?.batch_name ? `- ${lecture.timetable_details?.batch_name}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-muted">
                    <div className="flex items-center gap-1 font-medium">
                      <CalendarIcon size={14} />
                      <span>{lecture.date}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <BookOpen size={14} className="text-primary/60" />
                      <span>{lecture.topic_name || lecture.topic_taught || 'No topic specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:text-right flex flex-col items-start md:items-end gap-1">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  lecture.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {lecture.status}
                </span>
                {lecture.remarks && (
                  <p className="text-xs text-text-muted mt-1 italic max-w-xs">{lecture.remarks}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-text/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              
              <h3 className="text-2xl font-bold mb-6 relative z-10">Log Classroom Activity</h3>
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Scheduled Slot</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                    value={formData.timetable}
                    onChange={e => setFormData({...formData, timetable: e.target.value, topic: ''})}
                  >
                    <option value="">Choose from timetable...</option>
                    {timetable.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.day}: {t.subject_details?.name} ({t.start_time.slice(0, 5)}) - Div {t.division_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Completed">Completed</option>
                      <option value="Skipped">Skipped</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Syllabus Topic</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                    value={formData.topic}
                    disabled={!formData.timetable}
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  >
                    <option value="">Select planned topic...</option>
                    {filteredTopics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.topic_name}</option>
                    ))}
                  </select>
                  {!formData.timetable && <p className="text-[10px] text-orange-500 font-medium">* Select a slot first to see topics</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Additional Topic Notes</label>
                  <input 
                    type="text" 
                    placeholder="Briefly describe what was covered..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.topic_taught}
                    onChange={e => setFormData({...formData, topic_taught: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Remarks</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                    placeholder="Any specific observations?"
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 border border-gray-100 rounded-xl font-bold text-text-muted hover:bg-gray-50 transition-colors flex-1">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex-1">Save Entry</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lectures;
