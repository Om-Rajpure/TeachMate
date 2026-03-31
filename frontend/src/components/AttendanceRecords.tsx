import { motion } from 'framer-motion';
import AttendanceCard from './AttendanceCard';
import { Ghost, Loader2, Search } from 'lucide-react';

interface StudentRecord {
  name: string;
  roll_number: number | null;
  status: 'P' | 'A';
}

interface Session {
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
}

interface AttendanceRecordsProps {
  records: Session[];
  loading: boolean;
}

const AttendanceRecords = ({ records, loading }: AttendanceRecordsProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={48} className="text-primary animate-spin" />
        <p className="text-sm font-black text-text-muted uppercase tracking-[0.2em] animate-pulse">Fetching Grouped Records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center space-y-6"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-text-muted/20 border border-gray-100">
          <Ghost size={48} />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-2xl font-black text-text italic">Silence in the Hallways...</h3>
          <p className="text-text-muted font-semibold leading-relaxed">
            No attendance records found for the selected criteria. Try adjusting your filters or <span className="text-primary cursor-pointer hover:underline">mark new attendance</span>.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Search size={14} className="opacity-40" /> Showing {records.length} Academic Sessions
        </h4>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {records.map((session, index) => (
          <AttendanceCard 
            key={`${session.subject_id}-${session.date}-${index}`} 
            session={session} 
          />
        ))}
      </div>
    </div>
  );
};

export default AttendanceRecords;
