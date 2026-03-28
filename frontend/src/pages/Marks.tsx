import { useState, useEffect } from 'react';
import { 
  Search, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  User,
  Hash,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subjectService, markTypeService, studentService, markService } from '../services/api';
import type { Subject, MarkType, Student, Mark } from '../types';

const Marks = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [markTypes, setMarkTypes] = useState<MarkType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [newMarks, setNewMarks] = useState<Record<number, string>>({});
  
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedMarkType, setSelectedMarkType] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    subjectService.getAll().then(res => setSubjects(res.data));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      markTypeService.getAll(selectedSubject).then(res => setMarkTypes(res.data));
      setSelectedMarkType('');
    } else {
      setMarkTypes([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject && selectedMarkType) {
      fetchData();
    }
  }, [selectedSubject, selectedMarkType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, marksRes] = await Promise.all([
        studentService.getAll(),
        markService.getAll({ subject: selectedSubject, mark_type: selectedMarkType })
      ]);
      
      setStudents(studentsRes.data);
      
      const marksMap: Record<number, number> = {};
      const newMarksMap: Record<number, string> = {};
      
      marksRes.data.forEach((m: Mark) => {
        marksMap[m.student] = m.marks_obtained;
        newMarksMap[m.student] = m.marks_obtained.toString();
      });
      
      setNewMarks(newMarksMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMarkType = markTypes.find(mt => mt.id === selectedMarkType);
  const maxMarks = currentMarkType?.max_marks || 0;

  const handleMarkChange = (studentId: number, value: string) => {
    // Basic validation: must be a number and <= maxMarks
    if (value === '' || (!isNaN(Number(value)) && Number(value) <= maxMarks)) {
      setNewMarks(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedMarkType) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const marksToSave = Object.entries(newMarks)
        .filter(([_, val]) => val !== '')
        .map(([id, val]) => ({
          student_id: parseInt(id),
          marks_obtained: parseFloat(val)
        }));

      await markService.bulkUpdate({
        subject_id: selectedSubject,
        mark_type_id: selectedMarkType,
        marks: marksToSave
      });
      
      setMessage({ type: 'success', text: 'Marks saved successfully!' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save marks. Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number.includes(searchQuery)
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Context Selection Wrapper */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-muted uppercase tracking-wider ml-1">Select Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(Number(e.target.value))}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium appearance-none"
            >
              <option value="">Choose a subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-muted uppercase tracking-wider ml-1">Mark Category</label>
            <select 
              value={selectedMarkType}
              onChange={(e) => setSelectedMarkType(Number(e.target.value))}
              disabled={!selectedSubject}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium appearance-none disabled:opacity-50"
            >
              <option value="">{selectedSubject ? 'Select category...' : 'Select subject first'}</option>
              {markTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.name} (Max: {mt.max_marks})</option>)}
            </select>
          </div>
        </div>

        {selectedMarkType && (
          <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search student or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium"
              />
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {saving ? 'Saving...' : <><Save size={18} /> Sync to Cloud</>}
            </button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Grid Entry List */}
      <section>
        {!selectedMarkType ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 py-24 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <ClipboardCheck size={32} />
             </div>
             <p className="text-text-muted font-medium max-w-xs mx-auto">
               Select as subject and mark category to begin entering student performance data.
             </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <User size={24} />
                    </div>
                    <div>
                       <h4 className="font-bold text-text truncate max-w-[150px]">{student.name}</h4>
                       <p className="text-xs text-text-muted font-bold flex items-center gap-1 uppercase tracking-tighter">
                         <Hash size={10} /> {student.roll_number}
                       </p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Score /{maxMarks}</span>
                     <input 
                        type="text"
                        value={newMarks[student.id] || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        placeholder="0.0"
                        className="w-16 p-2 bg-gray-50 text-center border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-black text-primary transition-all text-lg"
                     />
                  </div>
                </div>
                
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden mt-6">
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(newMarks[student.id]) || 0) / maxMarks * 100}%` }}
                      className={`h-full transition-all duration-300 ${
                        (Number(newMarks[student.id]) || 0) < maxMarks * 0.4 ? 'bg-red-400' : 'bg-primary'
                      }`}
                   />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Marks;
