import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { subjectService } from '../services/api';
import type { Subject } from '../types';
import { toast } from 'react-hot-toast';

const SelectSubject = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await subjectService.getAll();
        setSubjects(res.data);
      } catch (error) {
        toast.error('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <GraduationCap size={14} /> Student Roster
          </div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Student Management</h1>
          <p className="text-text-muted font-medium">Select a subject to view or manage its student list.</p>
        </div>

        <div className="relative w-full md:w-72">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-bold text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject, index) => (
          <motion.button
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/app/students/manage?subject_id=${subject.id}`)}
            className="group relative bg-white p-6 rounded-3xl border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all text-left overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${
              (subject as any).subject_type === 'practical' ? 'bg-purple-600' : 'bg-blue-600'
            }`} />
            
            <div className="relative space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                (subject as any).subject_type === 'practical' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {(subject as any).subject_type === 'practical' ? <GraduationCap size={24} /> : <BookOpen size={24} />}
              </div>

              <div>
                <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">{subject.name}</h3>
                <p className="text-xs font-black text-text-muted uppercase tracking-widest mt-1">
                  {subject.code} • {(subject as any).subject_type === 'practical' ? 'Practical' : 'Theory'}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Manage Students <ChevronRight size={14} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {filteredSubjects.length === 0 && !loading && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-text-muted font-medium">No subjects found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default SelectSubject;
