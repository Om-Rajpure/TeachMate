import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Upload, Search, Filter, 
  Edit2, Trash2, X, Check,
  ChevronLeft, Download, FileSpreadsheet, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentService, subjectService, divisionService } from '../services/api';
import type { Student, Subject, Division } from '../types';
import { toast } from 'react-toastify';

const ManageStudents = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectId = Number(searchParams.get('subject_id'));

  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState<string>('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    division: '',
    batch: ''
  });

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectRes, studentsRes, divisionsRes] = await Promise.all([
        subjectService.getAll().then(res => res.data.find(s => s.id === subjectId)),
        studentService.getAll(subjectId),
        divisionService.getAll()
      ]);
      
      if (subjectRes) setSubject(subjectRes);
      setStudents(studentsRes.data);
      setDivisions(divisionsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!subjectId) {
      navigate('/app/students/select-subject');
      return;
    }
    fetchData();
  }, [subjectId]);

  const handleAddEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.division) {
      toast.error('Name and Division are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, {
          name: formData.name,
          division_id: divisions.find(d => d.name === formData.division)?.id,
          // batch handled as string in my view logic currently, but models have FK. 
          // My direct create/update logic expects names for convenience in this prototype.
        } as any);
        toast.success('Student updated successfully');
      } else {
        await studentService.create({
          ...formData,
          subject_id: subjectId
        });
        toast.success('Student added successfully');
      }
      fetchData();
      closeModals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student from the subject?')) return;
    try {
      await studentService.delete(id, subjectId);
      toast.success('Student removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsSubmitting(true);
    try {
      const res = await studentService.upload(uploadFile, subjectId, uploadMode);
      toast.success(res.data.message);
      fetchData();
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowUploadModal(false);
    setEditingStudent(null);
    setFormData({ name: '', division: '', batch: '' });
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiv = !filterDivision || s.division_name === filterDivision;
    return matchesSearch && matchesDiv;
  });

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/app/students/select-subject')}
            className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            <ChevronLeft size={16} /> Back to Subjects
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-text">
              Manage Students <span className="text-primary">—</span> {subject?.name}
            </h1>
            <div className="flex items-center gap-4 text-sm font-bold text-text-muted">
              <span className="bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-widest">{subject?.code}</span>
              <span className="flex items-center gap-1.5"><Users size={16} /> {students.length} Students</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3.5 bg-white text-text border border-gray-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Upload size={18} /> Bulk Upload
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
          >
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={20} />
          <input 
            type="text" 
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/30 rounded-2xl outline-none font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-fit">
          <Filter size={18} className="text-text-muted" />
          <select 
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="flex-1 md:w-48 px-4 py-3.5 bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/30 rounded-2xl outline-none font-bold text-sm transition-all cursor-pointer"
          >
            <option value="">All Divisions</option>
            {divisions.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Division</th>
                <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Batch</th>
                <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-bold text-text">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider">
                        {s.division_name}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {s.batch_name ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black uppercase tracking-wider">
                          {s.batch_name}
                        </span>
                      ) : (
                        <span className="text-text-muted/40 text-xs font-medium italic">General</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingStudent(s);
                            setFormData({
                              name: s.name,
                              division: s.division_name,
                              batch: s.batch_name || ''
                            });
                            setShowAddModal(true);
                          }}
                          className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          title="Edit Student"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-2.5 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Remove Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center space-y-4">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-text-muted/30">
                      <Users size={40} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-lg font-bold text-text-muted">No students found</p>
                       <p className="text-sm text-text-muted/60">Try adjusting your filters or add new students.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeModals}
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-text">
                  {editingStudent ? 'Edit Student' : 'Add Student'}
                </h3>
                <button onClick={closeModals} className="p-2 hover:bg-gray-100 rounded-full text-text-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-muted ml-1 uppercase tracking-wider text-[10px]">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter student name"
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-primary outline-none font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted ml-1 uppercase tracking-wider text-[10px]">Division</label>
                    <select 
                      required
                      value={formData.division}
                      onChange={(e) => setFormData({...formData, division: e.target.value})}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-primary outline-none font-bold text-sm transition-all"
                    >
                      <option value="">Select</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted ml-1 uppercase tracking-wider text-[10px]">Batch (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.batch}
                      onChange={(e) => setFormData({...formData, batch: e.target.value})}
                      placeholder="e.g. B1"
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:border-primary outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingStudent ? 'Update Details' : 'Add to Subject'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowUploadModal(false)}
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-text">Bulk Student Upload</h3>
                <button onClick={() => !isSubmitting && setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-text-muted transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-text-muted mb-8 italic text-sm">Upload an Excel file containing: | Name | Division | Batch |</p>

              <div className="space-y-6">
                <div className="flex gap-4 p-1.5 bg-gray-100 rounded-2xl">
                  {(['append', 'replace'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setUploadMode(mode)}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                        uploadMode === mode ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {uploadMode === 'replace' && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-600">
                    <AlertTriangle size={20} className="shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                      Warning: Replace mode will delete all existing students for this subject before uploading the new list.
                    </p>
                  </div>
                )}

                {!uploadFile ? (
                   <label className="group relative block px-10 py-16 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
                     <input 
                       type="file" 
                       accept=".xlsx"
                       className="absolute inset-0 opacity-0 cursor-pointer" 
                       onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                     />
                     <div className="flex flex-col items-center gap-4 text-text-muted group-hover:text-primary">
                       <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                         <FileSpreadsheet size={32} />
                       </div>
                       <div>
                         <p className="font-bold text-lg">Click to select Excel (.xlsx)</p>
                         <p className="text-sm opacity-60 mt-1">Columns required: Name, Division</p>
                       </div>
                     </div>
                   </label>
                ) : (
                  <div className="p-8 border border-primary/20 bg-primary/5 rounded-[2rem] flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                      <Check size={32} />
                    </div>
                    <div className="text-center">
                       <p className="font-black text-text">{uploadFile.name}</p>
                       <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">{(uploadFile.size / 1024).toFixed(1)} KB READY</p>
                    </div>
                    <button 
                      onClick={() => setUploadFile(null)}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Remove and Select Another
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={!uploadFile || isSubmitting}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                       <span className="animate-spin">◌</span> Processing...
                    </span>
                  ) : (
                    <>Start Bulk Processing <Download size={20} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStudents;
