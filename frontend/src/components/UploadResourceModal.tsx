import React, { useState, useEffect } from 'react';
import { 
  X, Upload, FileText, 
  Presentation, CheckCircle2, 
  ChevronRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { subjectService, resourceService, syllabusService } from '../services/api';
import type { Subject } from '../types';
import { toast } from 'react-hot-toast';

interface UploadResourceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UploadResourceModal: React.FC<UploadResourceModalProps> = ({ 
  onClose, onSuccess 
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await subjectService.getAll();
        setSubjects(res.data);
      } catch (err) {
        toast.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) {
        setChapters([]);
        return;
      }
      try {
        const res = await syllabusService.getChapters(parseInt(selectedSubject));
        setChapters(res.data);
      } catch (err) {
        console.error('Failed to load syllabus for topic mapping:', err);
      }
    };
    fetchTopics();
  }, [selectedSubject]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validExtensions = ['.pdf', '.ppt', '.pptx'];
    const name = f.name.toLowerCase();
    const isValid = validExtensions.some(ext => name.endsWith(ext));
    
    if (!isValid) {
      toast.error('Only PDF or PPT files are allowed');
      return;
    }
    setFile(f);
    if (!title) {
        // Auto-populate title if empty
        setTitle(f.name.split('.')[0].replace(/_/g, ' '));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedSubject || !title) {
        toast.error('Please fill all required fields');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', selectedSubject);
    formData.append('topic_name', selectedTopic);
    formData.append('file', file);
    
    try {
      setUploading(true);
      await resourceService.upload(formData);
      toast.success('Material uploaded successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.file?.[0] || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Upload size={24} />
              </div>
              <h3 className="text-3xl font-black text-text tracking-tighter">New Material</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-gray-50 text-text-muted hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                  placeholder="Material name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Subject *</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold appearance-none transition-all"
                >
                  <option value="">Select Category</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Syllabus Topic</label>
                <select 
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all disabled:opacity-50"
                  disabled={!selectedSubject}
                >
                  <option value="">Link to topic (Optional)</option>
                  {chapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold min-h-[100px] transition-all resize-none"
                  placeholder="Brief context..."
                />
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-4 border-dashed rounded-[32px] p-10 text-center transition-all duration-300
                ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-100 hover:border-blue-200'}
                ${file ? 'border-green-100 bg-green-50/10' : ''}
              `}
            >
              <input 
                type="file" 
                id="resource-file" 
                className="hidden"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
              />
              
              {!file ? (
                <label htmlFor="resource-file" className="cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} />
                  </div>
                  <p className="text-lg font-black text-text mb-1">Drag and Drop Material</p>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-widest">or browse PDF / PPT Files</p>
                </label>
              ) : (
                <div className="flex items-center gap-6 text-left">
                  <div className={`p-5 rounded-2xl ${file.name.endsWith('.pdf') ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                    {file.name.endsWith('.pdf') ? <FileText size={32} /> : <Presentation size={32} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-text truncate">{file.name}</p>
                      <CheckCircle2 className="text-green-500 shrink-0" size={16} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to dispatch
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-3 hover:bg-rose-100 text-rose-500 rounded-2xl transition-colors"
                   >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={uploading || !file || !selectedSubject}
              className="w-full flex items-center justify-center gap-3 bg-text text-white py-5 rounded-[24px] font-black text-lg transition-all hover:bg-primary shadow-xl shadow-gray-100 disabled:opacity-50 disabled:hover:bg-text"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Encrypting and Storing...
                </>
              ) : (
                <>
                  Publish Resource
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadResourceModal;
