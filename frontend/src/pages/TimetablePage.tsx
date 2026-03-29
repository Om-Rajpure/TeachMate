import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Clock4, Users } from 'lucide-react';
import { timetableService } from '../services/api';
import { toast } from 'react-toastify';

const TimetablePage: React.FC = () => {
  const [groupedTimetable, setGroupedTimetable] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('');

  const fetchTimetable = async () => {
    try {
      const res = await timetableService.getAllGrouped();
      setGroupedTimetable(res.data);
      
      // Set active day to today
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Calendar size={14} /> Academic Session 2023-24
          </div>
          <h1 className="text-3xl font-black text-text">Weekly Schedule</h1>
          <p className="text-text-muted text-sm font-medium">Manage and view your full teaching timetable.</p>
        </div>
        
        <div className="flex p-1.5 bg-gray-50 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeDay === day 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200/50' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Day Schedule */}
      <div className="grid grid-cols-1 gap-6">
        {!groupedTimetable[activeDay] || groupedTimetable[activeDay].length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
               <Clock4 size={32} />
            </div>
            <h3 className="text-xl font-bold text-text mb-2 text-capitalize">No lectures on {activeDay}</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">
              You're all set! There are no teaching sessions scheduled for this day in your current timetable.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedTimetable[activeDay].sort((a,b) => a.start_time.localeCompare(b.start_time)).map((slot, idx) => (
              <div 
                key={slot.id} 
                className="group relative bg-white border border-gray-100 p-6 rounded-[2.5rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      slot.subject_type === 'practical' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {slot.subject_type}
                    </span>
                    <div className="text-[10px] font-black text-text-muted flex items-center gap-1">
                      <Clock size={12} className="text-primary/60" /> {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">
                      {slot.subject_details?.name}
                    </h3>
                    <p className="text-xs text-text-muted font-black uppercase tracking-wider">
                      {slot.subject_details?.code}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-text italic">
                      <MapPin size={12} className="text-rose-400" />
                      {slot.room || 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase">
                      <Users size={12} className="text-primary/60" />
                      Div {slot.division_name} {slot.batch_name ? `(${slot.batch_name})` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetablePage;
