import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Clock4, Users, ArrowLeft, Upload } from 'lucide-react';
import { timetableService } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Timetable: React.FC = () => {
  const navigate = useNavigate();
  const [groupedTimetable, setGroupedTimetable] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await timetableService.getAllGrouped();
      setGroupedTimetable(res.data);
      
      // Set active day to today's day (normalized to lowercase)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      setActiveDay(today);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      toast.error('Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Card */}
      <div className="relative bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:gap-3 transition-all mb-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Calendar size={14} /> Full Weekly Schedule
            </div>
            <h1 className="text-4xl font-black text-text">Academic Timetable</h1>
            <p className="text-text-muted text-sm font-medium max-w-md">
              View your structured teaching slots for the current semester. Highlights practical labs and theory lectures.
            </p>
          </div>
          
          <div className="flex flex-wrap p-2 bg-gray-50/50 backdrop-blur-sm rounded-[2rem] border border-gray-100 shadow-inner">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeDay === day 
                    ? 'bg-white text-primary shadow-lg shadow-primary/10 ring-1 ring-gray-100' 
                    : 'text-text-muted hover:text-text hover:bg-white/50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 gap-6 min-h-[400px]"
      >
        <AnimatePresence mode="wait">
          {Object.keys(groupedTimetable).length === 0 ? (
            <motion.div 
                key="global-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center"
            >
                <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mb-8">
                    <Upload size={48} />
                </div>
                <h2 className="text-3xl font-black text-text mb-4">No Timetable Uploaded</h2>
                <p className="text-text-muted font-medium max-w-sm mb-10 leading-relaxed">
                    Set up your weekly schedule by uploading an Excel file. This drives your dashboard suggestions and attendance.
                </p>
                <button 
                    onClick={() => navigate('/app/dashboard')}
                    className="px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                >
                    Back to Upload
                </button>
            </motion.div>
          ) : !groupedTimetable[activeDay] || groupedTimetable[activeDay].length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-24 text-center bg-white rounded-[3.5rem] border border-dashed border-gray-100 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 text-gray-200">
                 <Clock4 size={40} />
              </div>
              <h3 className="text-2xl font-black text-text mb-2 capitalize">No classes on {activeDay}</h3>
              <p className="text-text-muted font-medium max-w-xs leading-relaxed">
                Enjoy your break! There are no teaching sessions scheduled for this day.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {groupedTimetable[activeDay].sort((a,b) => a.start_time.localeCompare(b.start_time)).map((slot) => (
                <div 
                  key={slot.id} 
                  className="group relative bg-white border border-gray-100 p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="flex flex-col h-full space-y-6">
                    <div className="flex items-center justify-between">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        slot.subject_type === 'practical' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {slot.subject_type}
                      </span>
                      <div className="text-[11px] font-black text-text-muted flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                        <Clock size={14} className="text-primary" /> {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                        {slot.subject_details?.code}
                      </p>
                      <h3 className="text-2xl font-black text-text leading-tight group-hover:text-primary transition-colors">
                        {slot.subject_details?.name}
                      </h3>
                    </div>

                    <div className="pt-6 border-t border-gray-50 mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                        <MapPin size={14} className="text-rose-400" />
                        <span className="text-text font-black">{slot.room || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-wider">
                        <Users size={14} className="text-primary/60" />
                        Div {slot.division_name} {slot.batch_name ? `(${slot.batch_name})` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Timetable;
