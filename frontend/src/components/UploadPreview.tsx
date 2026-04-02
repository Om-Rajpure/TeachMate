import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trash2, 
  CheckCircle2, Loader2, AlertTriangle,
  Clock, MapPin, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { timetableService, syllabusService } from '../services/api';
import { toast } from 'react-hot-toast';

interface UploadPreviewProps {
  type: 'timetable' | 'syllabus';
  file: File;
  subjectId?: number | null;
  subjectType?: 'theory' | 'practical';
  onClose: () => void;
  onSave: (data: any[]) => void;
}

const UploadPreview: React.FC<UploadPreviewProps> = ({ type, file, subjectId, subjectType, onClose, onSave }) => {
  const [isParsing, setIsParsing] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [practicalMetadata, setPracticalMetadata] = useState<any>(null);

  useEffect(() => {
    const parseFile = async () => {
      try {
        setIsParsing(true);
        if (type === 'timetable') {
          const res = await timetableService.parse(file);
          const entriesWithIds = res.data.map((entry: any, index: number) => ({
            ...entry,
            id: `new-${index}`
          }));
          setData(entriesWithIds);
        } else {
          if (!subjectId) throw new Error('No subject selected');
          const res = await syllabusService.parse(file, subjectId, subjectType || 'theory');
          if (res.data && res.data.message) {
             toast.success(res.data.message);
             // Return dummy array to allow Component to render if needed, or handle success
             setData([{ id: 'mock', lecture_number: 1, topic_name: 'Successfully Uploaded', chapter_name: 'System Verified' }]);
          } else if (subjectType === 'practical') {
            const { entries, has_assignments, has_mini_project } = res.data;
            setData(entries.map((entry: any, index: number) => ({
              ...entry,
              id: `new-${index}`
            })));
            setPracticalMetadata({ has_assignments, has_mini_project });
          } else {
            setData(res.data.map((entry: any, index: number) => ({
              ...entry,
              id: `new-${index}`
            })));
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to parse file');
        onClose();
      } finally {
        setIsParsing(false);
      }
    };

    parseFile();
  }, [file, type, subjectType, onClose]);

  const warnings = useMemo(() => {
    const conflicts: Record<string, boolean> = {};
    if (type !== 'timetable') return conflicts;

    data.forEach((item) => {
      const isDuplicate = data.some((other) => 
        other.id !== item.id && 
        other.day === item.day && 
        other.start_time === item.start_time &&
        other.room === item.room &&
        item.room 
      );
      if (isDuplicate) conflicts[item.id.toString()] = true;
    });
    return conflicts;
  }, [data, type]);

  const handleRemove = (id: string | number) => {
    setData(data.filter(item => item.id !== id));
  };




  const handleCommit = async () => {
    if (data.length === 0) return;
    try {
      if (type === 'timetable') {
        const res = await timetableService.commit(data);
        if (res.data.warnings?.length > 0) {
          res.data.warnings.forEach((w: string) => toast(w));
        }
        window.dispatchEvent(new CustomEvent('timetable-updated'));
        onSave(data);
      } else {
        if (!subjectId) {
          toast.error('No subject selected');
          return;
        }
        if (subjectType === 'practical') {
          await syllabusService.commitExperiments(subjectId, data, practicalMetadata);
          toast.success('Practical experiments synced!');
        } else {
          const res = await syllabusService.commit(subjectId, data);
          if (res.data.warnings?.length > 0) {
            res.data.warnings.forEach((w: string) => toast(w));
          }
          toast.success('Theory syllabus synced!');
        }
        onSave(data);
      }
    } catch (error: any) {
      toast.error('Failed to commit data');
    }
  };


  if (isParsing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6">
        <div className="relative">
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-text">Analyzing {type === 'timetable' ? 'Timetable' : 'Syllabus'}</h3>
          <p className="text-text-muted text-sm mt-1 max-w-xs italic font-medium">
            {type === 'timetable' 
              ? 'Deep-scanning grid structure and interpreting academic codes...' 
              : 'Extracting chapters, topics, and expanding lecture ranges...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-2xl font-black text-text">Verify Extracted {type === 'timetable' ? 'Timetable' : 'Syllabus'}</h3>
          <p className="text-sm text-text-muted">Detected {data.length} entries. Please verify the structure.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-text-muted transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 sticky top-0 z-[5]">
              <tr>
                {type === 'timetable' ? (
                  <>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Day & Time</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Subject</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Type</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Room/Div</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest w-24">
                      {subjectType === 'practical' ? 'Exp No' : 'Lec No'}
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">
                      {subjectType === 'practical' ? 'Experiment Title' : 'Chapter/Unit'}
                    </th>
                    {subjectType !== 'practical' && (
                      <>
                        <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Topics</th>
                        <th className="px-5 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">CO</th>
                      </>
                    )}
                  </>
                )}
                <th className="px-5 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${warnings[item.id] ? 'bg-amber-50/30' : ''}`}>
                  {type === 'timetable' ? (
                    <>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="text-xs font-black text-text uppercase">{item.day}</div>
                          <div className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                            <Clock size={10} /> {item.start_time} - {item.end_time}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-text text-sm">{item.subject_code}</span>
                          {warnings[item.id] && (
                            <span className="flex items-center gap-1 text-[9px] text-amber-600 font-black uppercase">
                              <AlertTriangle size={10} /> Conflict
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          item.subject_type === 'Lab' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.subject_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-text italic">
                            <MapPin size={10} className="text-rose-400" /> {item.room || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-text-muted">
                            <Users size={10} /> {item.division} {item.batch ? `(${item.batch})` : ''}
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4">
                        <span className="text-xs font-black text-text">
                          {subjectType === 'practical' ? `EXP ${item.experiment_number}` : `L${item.lecture_number}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[11px] font-bold text-text truncate max-w-[400px]">
                          {subjectType === 'practical' ? item.title : item.chapter_name}
                        </div>
                      </td>
                      {subjectType !== 'practical' && (
                        <>
                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-text-muted line-clamp-2 max-w-[300px]">
                              {item.topic_name}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase">
                              {item.co || 'N/A'}
                            </span>
                          </td>
                        </>
                      )}
                    </>
                  )}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemove(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-[2.5rem] sticky bottom-0">
         <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-emerald-600">
               <CheckCircle2 size={18} />
               <span className="text-sm font-black uppercase tracking-tight">Parser Check Completed</span>
            </div>
            <p className="text-[10px] text-text-muted ml-6 font-medium">Verify data hierarchy and naming before pushing to system.</p>
         </div>
         <div className="flex gap-3">
           <button onClick={onClose} className="px-6 py-3 font-bold text-text-muted hover:bg-gray-100 rounded-2xl transition-all">
             Cancel
           </button>
           <button 
             onClick={handleCommit}
             disabled={data.length === 0}
             className="px-10 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
           >
             {type === 'timetable' ? 'Push to Timetable' : 'Push to Syllabus'}
           </button>
         </div>
      </div>
    </div>
  );
};

export default UploadPreview;
