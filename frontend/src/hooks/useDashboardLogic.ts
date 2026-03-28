import { useState, useEffect, useMemo } from 'react';
import type { Timetable, LecturePlan } from '../types';

export const useDashboardLogic = (todayLectures: Timetable[], lecturePlans: LecturePlan[]) => {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { activeLecture, nextLecture } = useMemo(() => {
    if (!todayLectures.length) return { activeLecture: null, nextLecture: null };

    // Format current time as HH:MM:SS for robust string comparison with '12:00:00' format
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    // 1. Find ANY lecture that is currently ongoing
    const active = todayLectures.find(l => 
      currentTimeStr >= l.start_time && currentTimeStr < l.end_time
    );

    // 2. Find the VERY NEXT lecture today
    const upcoming = todayLectures
      .filter(l => l.start_time > currentTimeStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

    return { activeLecture: active || null, nextLecture: upcoming || null };
  }, [now, todayLectures]);

  const syllabusSuggestion = useMemo(() => {
    const targetLecture = activeLecture || nextLecture;
    if (!targetLecture || !lecturePlans.length) return null;
    
    // Suggest the next pending topic for the current subject
    // We filter by subject and find the first 'Pending' lecture
    const nextPending = lecturePlans
      .filter(p => p.subject === targetLecture.subject && p.status === 'Pending')
      .sort((a, b) => a.lecture_number - b.lecture_number)[0];
    
    return nextPending?.topic_name || "Next Syllabus Topic";
  }, [activeLecture, nextLecture, lecturePlans]);

  return {
    now,
    activeLecture,
    nextLecture,
    syllabusSuggestion,
  };
};
