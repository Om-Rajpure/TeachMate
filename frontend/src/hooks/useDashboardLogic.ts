import { useState, useEffect, useMemo } from 'react';
import type { Timetable, SyllabusPlan } from '../types';

export const useDashboardLogic = (todayLectures: Timetable[], syllabusPlans: SyllabusPlan[]) => {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { activeLecture, nextLecture } = useMemo(() => {
    if (!todayLectures.length) return { activeLecture: null, nextLecture: null };

    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    const active = todayLectures.find(l => 
      currentTimeStr >= l.start_time && currentTimeStr < l.end_time
    );

    const upcoming = todayLectures
      .filter(l => l.start_time > currentTimeStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

    return { activeLecture: active || null, nextLecture: upcoming || null };
  }, [now, todayLectures]);

  const syllabusSuggestion = useMemo(() => {
    if (!activeLecture || !syllabusPlans.length) return null;
    
    // Suggest the first topic for the current subject for now
    const subjectPlan = syllabusPlans.find(p => p.subject === activeLecture.subject);
    return subjectPlan?.topic_name || "Introduction to Course";
  }, [activeLecture, syllabusPlans]);

  return {
    now,
    activeLecture,
    nextLecture,
    syllabusSuggestion,
  };
};
