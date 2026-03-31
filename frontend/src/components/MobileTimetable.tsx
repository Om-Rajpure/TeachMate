import React, { useState, useMemo } from 'react';
import { Clock, MapPin, Users, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Timetable } from '../types';

interface MobileTimetableProps {
  data: Record<string, Timetable[]>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MobileTimetable: React.FC<MobileTimetableProps> = ({ data }) => {
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return today === 'Sunday' ? 'Monday' : today;
  });

  const normalizedData = useMemo(() => {
    const norm: Record<string, Timetable[]> = {};
    Object.entries(data).forEach(([key, value]) => {
      norm[key.toLowerCase()] = value.sort((a, b) => {
          const getMins = (t: string) => {
              let [h, m] = t.split(':').map(Number);
              if (h >= 1 && h <= 7) h += 12;
              return h * 60 + m;
          };
          return getMins(a.start_time) - getMins(b.start_time);
      });
    });
    return norm;
  }, [data]);

  const currentDayLectures = normalizedData[activeDay.toLowerCase()] || [];

  const getMinutes = (timeStr: string) => {
    let [h, m] = timeStr.split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12;
    return h * 60 + m;
  };

  const currentTime = new Date();
  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = currentTime.toLocaleDateString('en-US', { weekday: 'long' }) === activeDay;

  const isCurrentSlot = (startTime: string, endTime: string) => {
    if (!isToday) return false;
    return nowMin >= getMinutes(startTime) && nowMin <= getMinutes(endTime);
  };

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* Day Selector - Horizontal Scroll Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-4 px-4 scroll-smooth">
        {DAYS.map((day) => {
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                isActive 
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' 
                  : 'bg-white text-text-muted border-gray-100 hover:border-primary/30'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Lecture List */}
      <div className="space-y-5">
        <AnimatePresence mode="wait">
          {currentDayLectures.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-14 rounded-[3rem] border border-gray-100 text-center flex flex-col items-center justify-center space-y-6 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 shadow-inner">
                <Coffee size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text italic">Relax... No sessions.</h3>
                <p className="text-text-muted text-xs font-semibold uppercase tracking-widest opacity-60">Nothing scheduled for {activeDay}</p>
              </div>
            </motion.div>
          ) : (
            currentDayLectures.map((slot, idx) => {
              const start = slot.start_time.slice(0, 5);
              const end = slot.end_time.slice(0, 5);
              const isPractical = slot.subject_details?.subject_type === 'practical' || slot.subject_type === 'practical';
              const isBreak = slot.subject_details?.name.toUpperCase() === 'BREAK' || 
                              slot.subject_name?.toUpperCase() === 'BREAK' ||
                              (slot as any).name?.toUpperCase() === 'BREAK';
              const ongoing = isCurrentSlot(start, end);

              return (
                <motion.div
                  key={slot.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group bg-white rounded-[2rem] p-4 border-2 transition-all duration-300 overflow-hidden relative ${
                    ongoing ? 'border-primary shadow-2xl shadow-primary/10' : 'border-gray-100 active:scale-[0.98]'
                  } ${isBreak ? 'bg-gray-50/50' : ''}`}
                >
                  {ongoing && (
                    <div className="absolute top-0 right-0 p-4">
                      <div className="flex items-center gap-2 bg-rose-500 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30 animate-pulse uppercase tracking-[0.2em]">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Ongoing
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Time Header */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <Clock size={16} className={ongoing ? 'text-primary' : 'text-gray-300'} />
                        <span className={`text-sm font-black italic tracking-tight ${ongoing ? 'text-primary' : ''}`}>
                          {start} – {end}
                        </span>
                    </div>

                    {isBreak ? (
                      <div className="flex items-center gap-4 py-2 opacity-40">
                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Coffee size={24} />
                         </div>
                         <h3 className="text-2xl font-black text-gray-400 uppercase tracking-[0.3em] italic">BREAK</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <div className="space-y-2">
                             <h3 className="text-xl font-black text-text leading-tight italic tracking-tighter group-hover:text-primary transition-colors">
                               {slot.subject_details?.name}
                             </h3>
                            <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                                 isPractical ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-primary/5 text-primary border-primary/10'
                               }`}>
                                 {isPractical ? 'Practical' : 'Theory'}
                               </span>
                               <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40 italic">
                                 {slot.subject_details?.code || 'SUB'}
                               </span>
                            </div>
                         </div>

                         <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-text-muted uppercase tracking-widest shrink-0">
                               <MapPin size={12} className="text-rose-400" />
                               <span>Room: {slot.room || 'TBD'}</span>
                             </div>
                            
                            {slot.batch_name && (
                               <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                  <Users size={14} className="text-primary/60" />
                                  <span>Batch {slot.batch_name}</span>
                               </div>
                            )}
                         </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileTimetable;
