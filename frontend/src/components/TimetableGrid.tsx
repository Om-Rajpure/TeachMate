import React, { useMemo } from 'react';
import { MapPin, Coffee } from 'lucide-react';
import type { Timetable } from '../types';

interface TimetableGridProps {
  data: Record<string, Timetable[]>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableGrid: React.FC<TimetableGridProps> = ({ data }) => {
  // Use normalized lowercase keys for data mapping
  const normalizedData: Record<string, Timetable[]> = useMemo(() => {
    const norm: Record<string, Timetable[]> = {};
    Object.entries(data).forEach(([key, value]) => {
      norm[key.toLowerCase()] = value;
    });
    return norm;
  }, [data]);

  // 1. Generate unique sorted time slots (start times)
  const timeSlots = useMemo(() => {
    const slotsSet = new Set<string>();
    Object.values(normalizedData).forEach(daySlots => {
      daySlots.forEach(slot => {
        slotsSet.add(slot.start_time.slice(0, 5));
      });
    });

    const getMinutes = (timeStr: string) => {
      let [h, m] = timeStr.split(':').map(Number);
      // Academic hours logic: if hour is 1-6, it's likely PM (13-18)
      if (h >= 1 && h <= 7) h += 12;
      return h * 60 + m;
    };

    return Array.from(slotsSet).sort((a, b) => getMinutes(a) - getMinutes(b));
  }, [normalizedData]);

  // 2. Map of "current time" to highlight
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();

  const getMinutes = (timeStr: string) => {
    let [h, m] = timeStr.split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12;
    return h * 60 + m;
  };

  const isCurrentSlot = (startTime: string, endTime: string) => {
    const nowMin = currentHour * 60 + currentMin;
    return nowMin >= getMinutes(startTime) && nowMin <= getMinutes(endTime);
  };

  if (timeSlots.length === 0) return (
    <div className="p-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
        <p className="text-text-muted font-medium">No valid time slots found to render the grid.</p>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-primary/5 bg-white p-2">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr>
            <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-text-muted bg-gray-50/50 rounded-tl-[2rem] border-b border-gray-100">
              Day / Time
            </th>
            {timeSlots.map((time) => (
              <th key={time} className="p-6 text-center text-xs font-black uppercase tracking-widest text-text-muted bg-gray-50/50 border-b border-gray-100 border-l border-gray-50">
                {time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((dayLabel, dayIdx) => {
            const dayKey = dayLabel.toLowerCase();
            const dayData = normalizedData[dayKey] || [];
            
            // Track skipped columns for colSpan
            const skippedCols = new Set<string>();

            return (
              <tr key={dayKey} className="group hover:bg-gray-50/30 transition-colors">
                <td className={`p-6 text-xs font-black uppercase tracking-widest border-b border-gray-100 bg-gray-50/20 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 ${dayIdx === DAYS.length - 1 ? 'rounded-bl-[2rem]' : ''}`}>
                  {dayLabel}
                </td>
                
                {timeSlots.map((timeSlot) => {
                  if (skippedCols.has(timeSlot)) return null;

                  const slot = dayData.find(s => s.start_time.slice(0, 5) === timeSlot);
                  
                  if (!slot) {
                    return <td key={timeSlot} className="p-4 border border-gray-50 bg-gray-50/5 text-center text-[10px] text-gray-200">
                      <div className="flex flex-col items-center justify-center min-h-[4rem]">
                         <span className="opacity-10">-</span>
                      </div>
                    </td>;
                  }

                  // Detect Practical duration (spanning 2 slots)
                  const startMins = getMinutes(slot.start_time.slice(0, 5));
                  const endMins = getMinutes(slot.end_time.slice(0, 5));
                  const durationMins = endMins - startMins;
                  
                  const isPractical = slot.subject_details?.subject_type === 'practical' || slot.subject_type === 'practical';
                  const isBreak = slot.subject_details?.name.toUpperCase() === 'BREAK' || 
                                  slot.subject_name?.toUpperCase() === 'BREAK' || 
                                  slot.subject?.toString().toUpperCase() === 'BREAK' ||
                                  (slot as any).name?.toUpperCase() === 'BREAK';

                  // colSpan logic: if duration is significantly more than 1 hour (e.g. 100+ mins)
                  let colSpan = 1;
                  if (durationMins >= 100) {
                    // Check if there is actually a next time slot in our grid to span into
                    const currentIdx = timeSlots.indexOf(timeSlot);
                    if (currentIdx !== -1 && currentIdx + 1 < timeSlots.length) {
                        colSpan = 2;
                        skippedCols.add(timeSlots[currentIdx + 1]);
                    }
                  }

                  const isActive = isCurrentSlot(slot.start_time.slice(0, 5), slot.end_time.slice(0, 5)) && 
                                   currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === dayKey;

                  return (
                    <td 
                      key={timeSlot} 
                      colSpan={colSpan}
                      className={`p-4 border border-gray-100 transition-all duration-500 relative min-w-[150px] ${
                        isBreak ? 'bg-gray-50/50' : 
                        isPractical ? 'bg-blue-50/30 hover:bg-blue-50/60' : 
                        'bg-white hover:bg-primary/[0.02]'
                      } ${isActive ? 'ring-2 ring-primary ring-inset z-10 shadow-lg shadow-primary/20 bg-primary/[0.02]' : ''}`}
                    >
                      {isBreak ? (
                        <div className="flex flex-col items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity min-h-[4rem]">
                          <Coffee size={24} className="text-gray-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Interval</span>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full gap-2 min-h-[4rem]">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex flex-col gap-0.5">
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                                 isPractical ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-primary/5 text-primary border-primary/10'
                               }`}>
                                 {slot.subject_details?.code || 'SUB'}
                               </span>
                               {slot.batch_name && (
                                <span className="text-[8px] font-black text-primary/60 px-2 uppercase tracking-tight">Batch: {slot.batch_name}</span>
                               )}
                             </div>
                             {isActive && (
                               <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                                  <span className="text-[7px] font-black text-primary uppercase animate-pulse">Live</span>
                               </div>
                             )}
                          </div>
                          
                          <div className="text-[13px] font-black text-text leading-tight line-clamp-2 py-1 pr-4">
                            {slot.subject_details?.name}
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50/50">
                             <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted bg-gray-50/50 px-2 py-1 rounded-lg border border-gray-100">
                               <MapPin size={10} className="text-rose-400" />
                               <span className="text-text tracking-tighter">{slot.room || 'TBD'}</span>
                             </div>
                             <div className="text-[8px] font-black text-text-muted/60 uppercase tracking-tighter">
                               {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                             </div>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
