import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, FileText, 
  Presentation, Download, Eye, Trash2, 
  BookOpen, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resourceService, subjectService } from '../services/api';
import type { Subject } from '../types';
import { toast } from 'react-hot-toast';
import UploadResourceModal from '../components/UploadResourceModal';

export interface Resource {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: 'pdf' | 'ppt';
  subject_name: string;
  topic_name: string;
  uploaded_at: string;
}

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, subData] = await Promise.all([
        resourceService.getAll(),
        subjectService.getAll()
      ]);
      setResources(resData.data);
      setSubjects(subData.data);
    } catch (error) {
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.topic_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || res.subject_name === subjectFilter;
    const matchesType = typeFilter === 'all' || res.file_type === typeFilter;
    return matchesSearch && matchesSubject && matchesType;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourceService.delete(id);
      toast.success('Resource deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-text tracking-tighter mb-2">Resource Library</h2>
          <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Organize and share study materials</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Plus size={20} />
          Upload Material
        </button>
      </div>

      {/* Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 appearance-none font-bold text-sm shadow-sm"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-6 py-3.5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 appearance-none font-bold text-sm shadow-sm text-center"
        >
          <option value="all">Any Format</option>
          <option value="pdf">PDF Docs Only</option>
          <option value="ppt">PowerPoint Only</option>
        </select>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-black text-text-muted uppercase tracking-widest">Accessing Vault...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="text-gray-200" size={40} />
          </div>
          <h3 className="text-2xl font-black text-text mb-2">No matching resources</h3>
          <p className="text-text-muted font-medium mb-8">Try adjusting your filters or upload a new material</p>
          <button 
             onClick={() => {setSearchQuery(''); setSubjectFilter('all'); setTypeFilter('all');}}
             className="text-primary font-black hover:underline uppercase tracking-widest text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredResources.map((res, index) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-2xl ${res.file_type === 'pdf' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'} group-hover:scale-110 transition-transform duration-500`}>
                      {res.file_type === 'pdf' ? <FileText size={28} /> : <Presentation size={28} />}
                    </div>
                    <div className="flex gap-1">
                       <a 
                         href={res.file_url} 
                         target="_blank" 
                         rel="noreferrer"
                         className="p-2 hover:bg-gray-100 rounded-xl text-text-muted hover:text-primary transition-colors"
                        >
                         <Eye size={18} />
                       </a>
                       <button 
                         onClick={() => handleDelete(res.id)}
                         className="p-2 hover:bg-rose-50 rounded-xl text-text-muted hover:text-rose-500 transition-colors"
                        >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>

                  <h3 className="font-black text-xl text-text leading-tight mb-2 line-clamp-2">{res.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      {res.subject_name}
                    </span>
                    {res.topic_name && (
                      <span className="px-3 py-1 bg-gray-50 text-text-muted rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100">
                        {res.topic_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        {new Date(res.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <a 
                      href={res.file_url} 
                      download 
                      className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      Download <Download size={12} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadResourceModal 
            onClose={() => setIsUploadModalOpen(false)} 
            onSuccess={() => {
              setIsUploadModalOpen(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Resources;
