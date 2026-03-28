import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subjectService, resourceFileService } from '../services/api';
import type { Subject, ResourceFile } from '../types';

const Resources = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<ResourceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadData, setUploadData] = useState({ title: '', subject: '' as string | number, file: null as File | null });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await resourceFileService.getAll(selectedSubject ? Number(selectedSubject) : undefined);
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    subjectService.getAll().then(res => setSubjects(res.data));
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.subject || !uploadData.file) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('subject', uploadData.subject.toString());
    formData.append('file', uploadData.file);

    try {
       await resourceFileService.upload(formData);
       setMessage({ type: 'success', text: 'File uploaded successfully!' });
       setUploadData({ title: '', subject: '', file: null });
       fetchFiles();
    } catch (err) {
       setMessage({ type: 'error', text: 'Upload failed. Checks file size and type.' });
    } finally {
       setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourceFileService.delete(id);
      fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFiles = files.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Upload Form */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 border-b-4 border-b-primary/10">
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-text">New Resource</h3>
                 <p className="text-sm text-text-muted">Upload PDFs, PPTs or Study Materials</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider ml-1">Title</label>
                    <input 
                       type="text" 
                       value={uploadData.title}
                       onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                       placeholder="E.g. Discrete Math Notes"
                       className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider ml-1">Subject</label>
                    <select 
                       value={uploadData.subject}
                       onChange={(e) => setUploadData({...uploadData, subject: e.target.value})}
                       className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium appearance-none"
                    >
                       <option value="">Select subject...</option>
                       {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider ml-1">File</label>
                    <input 
                       type="file" 
                       onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                       className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary file:text-white hover:file:bg-primary/90 transition-all"
                    />
                 </div>

                 <button 
                    type="submit" 
                    disabled={uploading}
                    className="btn btn-primary w-full py-4 flex items-center justify-center gap-2"
                 >
                    {uploading ? 'Uploading...' : <><Upload size={20} /> Deploy File</>}
                 </button>

                 <AnimatePresence>
                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </form>
           </div>
        </div>

        {/* File Browser */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search resources..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-medium shadow-sm"
                 />
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
                 <button 
                    onClick={() => setSelectedSubject('')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedSubject === '' ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-50'
                    }`}
                 >
                    All
                 </button>
                 {subjects.map(s => (
                   <button 
                     key={s.id}
                     onClick={() => setSelectedSubject(s.id)}
                     className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                       selectedSubject === s.id ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-50'
                     }`}
                   >
                     {s.name}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                 {loading ? (
                   <div className="col-span-full flex justify-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                   </div>
                 ) : filteredFiles.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 py-24 text-center">
                       <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                          <FolderOpen size={32} />
                       </div>
                       <p className="text-text-muted font-bold">No files found for this filter.</p>
                    </div>
                 ) : filteredFiles.map((file, index) => (
                    <motion.div 
                       key={file.id}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: index * 0.05 }}
                       className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative"
                    >
                       <div className="flex items-start gap-5">
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                             <FileText size={28} />
                          </div>
                          <div className="flex-1 space-y-1">
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-lg">
                                {file.subject_name}
                             </span>
                             <h4 className="font-bold text-lg text-text truncate max-w-[180px]">{file.title}</h4>
                             <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                                {new Date(file.uploaded_at).toLocaleDateString()}
                             </p>
                          </div>
                       </div>
                       
                       <div className="mt-8 flex items-center gap-3 pt-4 border-t border-gray-50">
                          <a 
                             href={file.file_url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             download
                             className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                          >
                             <Download size={14} /> Fetch
                          </a>
                          <button 
                             onClick={() => handleDelete(file.id)}
                             className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>

                       <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
