import { useState, useEffect, useMemo } from 'react';
import type { Timetable, LecturePlan, Experiment } from '../types';

export const useDashboardLogic = (todayLectures: Timetable[], lecturePlans: LecturePlan[], experiments: Experiment[] = []) => {
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
    if (!targetLecture) return null;
    
    // Check subject type to suggest either Topic or Experiment
    // Type is optionally present on Subject details
    const subjectType = targetLecture.subject_details?.subject_type || 'theory';

    if (subjectType === 'practical') {
      const nextExp = experiments
        .filter(e => e.subject === targetLecture.subject && e.status === 'Pending')
        .sort((a, b) => a.experiment_number - b.experiment_number)[0];
      return nextExp?.title ? `Experiment: ${nextExp.title}` : "Next Lab Experiment";
    }

    // Theory Suggestion
    const nextPending = lecturePlans
      .filter(p => p.subject === targetLecture.subject && p.status === 'Pending')
      .sort((a, b) => a.lecture_number - b.lecture_number)[0];
    
    return nextPending?.topic_name || "Next Syllabus Topic";
  }, [activeLecture, nextLecture, lecturePlans, experiments]);


  return {
    now,
    activeLecture,
    nextLecture,
    syllabusSuggestion,
  };
};
