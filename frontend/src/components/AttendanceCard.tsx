import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Users, 
  CheckCircle2, XCircle, Calendar,
  BookOpen, Beaker, MoreHorizontal
} from 'lucide-react';

interface StudentRecord {
  name: string;
  roll_number: number | null;
  status: 'P' | 'A';
}

interface AttendanceCardProps {
  session: {
    subject_id: number;
    subject_name: string;
    date: string;
    lecture_number: number | null;
    topic: string;
    type: 'THEORY' | 'PRACTICAL';
    total_students: number;
    present_count: number;
    absent_count: number;
    students: StudentRecord[];
  };
}

const AttendanceCard = ({ session }: AttendanceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden"
    >
      {/* Card Header (Visible Area) */}
      <div 
        className="p-8 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              session.type === 'THEORY' ? 'bg-primary text-white shadow-primary/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}>
              {session.type === 'THEORY' ? <BookOpen size={28} /> : <Beaker size={28} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  session.type === 'THEORY' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {session.type}
                </span>
                <p className="text-sm font-bold text-text-muted flex items-center gap-1.5">
                  <Calendar size={14} className="opacity-40" /> {formatDate(session.date)}
                </p>
              </div>
              <h3 className="text-2xl font-black text-text tracking-tight group-hover:text-primary transition-colors">
                {session.subject_name} 
                <span className="text-text-muted font-medium ml-2 opacity-40">
                  {session.lecture_number ? `(Lecture ${session.lecture_number})` : ''}
                </span>
              </h3>
              <p className="text-text-muted font-semibold italic flex items-center gap-2">
                <MoreHorizontal size={16} className="opacity-40" /> {session.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 md:border-l border-gray-100 md:pl-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Present</p>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={18} />
                <span className="text-2xl font-black">{session.present_count}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Absent</p>
              <div className="flex items-center gap-2 text-rose-500">
                <XCircle size={18} />
                <span className="text-2xl font-black">{session.absent_count}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isExpanded ? 'bg-primary text-white' : 'bg-gray-50 text-text-muted group-hover:bg-gray-100'
            }`}>
              {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-50 bg-gray-50/30"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-text uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-primary" /> Full Student Register
                </h4>
                <div className="text-[10px] font-bold text-text-muted bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                  {session.total_students} Total Students
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-gray-100">Roll</th>
                      <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-gray-100">Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-gray-100 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.students.map((student, idx) => (
                      <tr 
                        key={`${student.roll_number}-${idx}`}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-black text-text-muted group-hover:text-primary">{student.roll_number || '--'}</td>
                        <td className="px-6 py-4 font-bold text-text">{student.name}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            student.status === 'P' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-rose-50 text-rose-500'
                          }`}>
                            {student.status === 'P' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {student.status === 'P' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AttendanceCard;
