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
    if (!targetLecture || !syllabusPlans.length) return null;
    
    // Suggest the next pending topic for the current subject
    const subjectPlan = syllabusPlans.find(p => p.subject === targetLecture.subject);
    
    // Fallback if no specific plan found, but we have some plans
    if (!subjectPlan && syllabusPlans.length > 0) {
        return syllabusPlans[0].topic_name;
    }
    
    return subjectPlan?.topic_name || "Course Overview & Introduction";
  }, [activeLecture, nextLecture, syllabusPlans]);

  return {
    now,
    activeLecture,
    nextLecture,
    syllabusSuggestion,
  };
};
