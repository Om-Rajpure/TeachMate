import React, { useState, useMemo } from 'react';
import { Clock, MapPin, Users, Coffee, CalendarCheck, ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col space-y-6">
      {/* Day Selector - Horizontal Scroll Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-4 px-4 scroll-smooth">
        {DAYS.map((day) => {
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${
                isActive 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white text-text-muted border-gray-100 hover:border-primary/30'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Lecture List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {currentDayLectures.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <CalendarCheck size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text italic">Enjoy your break 🎉</h3>
                <p className="text-text-muted text-xs font-medium">No teaching sessions scheduled for {activeDay}.</p>
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative group bg-white rounded-[2rem] p-6 border transition-all duration-300 ${
                    ongoing ? 'border-primary ring-1 ring-primary/20 shadow-xl shadow-primary/10' : 'border-gray-100 active:scale-[0.98]'
                  } ${isBreak ? 'bg-gray-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      {/* Time & Badge */}
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            ongoing ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
                        }`}>
                          <Clock size={12} /> {start} - {end}
                        </div>
                        {ongoing && (
                          <span className="flex items-center gap-1 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-pulse uppercase tracking-widest">
                            Ongoing
                          </span>
                        )}
                      </div>

                      {isBreak ? (
                        <div className="flex items-center gap-3 ml-1">
                          <Coffee size={20} className="text-gray-300" />
                          <span className="text-base font-black text-gray-400 uppercase tracking-[0.2em] italic">Interval</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                               isPractical ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-primary/5 text-primary border-primary/10'
                             }`}>
                               {slot.subject_details?.code || 'SUB'}
                             </span>
                             <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-tighter italic">
                               {isPractical ? 'Practical Lab' : 'Theory Lecture'}
                             </span>
                          </div>
                          <h3 className="text-xl font-black text-text leading-tight tracking-tight">
                            {slot.subject_details?.name}
                          </h3>
                        </div>
                      )}

                      {/* Footer Details */}
                      {!isBreak && (
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted">
                            <MapPin size={14} className="text-rose-400" />
                            <span>Room {slot.room || 'TBD'}</span>
                          </div>
                          {slot.batch_name && (
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-text-muted uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded-lg">
                              <Users size={14} className="text-primary/60" />
                              <span>{slot.batch_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center self-center text-gray-200 group-active:text-primary transition-colors">
                        <ChevronRight size={24} />
                    </div>
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
