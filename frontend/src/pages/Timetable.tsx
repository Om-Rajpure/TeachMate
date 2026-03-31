import React, { useState, useEffect } from 'react';
import { Calendar, Upload, Grid3X3, Table as TableIcon } from 'lucide-react';
import { timetableService } from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import TimetableGrid from '../components/TimetableGrid';
import MobileTimetable from '../components/MobileTimetable';
import UploadPreview from '../components/UploadPreview';
import type { Timetable as TimetableType } from '../types';

const Timetable: React.FC = () => {
  const [structuredTimetable, setStructuredTimetable] = useState<Record<string, TimetableType[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const onSaveUpload = async () => {
    setIsSubmitting(true);
    try {
      toast.success('Timetable synced successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      fetchTimetable();
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await timetableService.getAllStructured();
      setStructuredTimetable(res.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      toast.error('Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasData = Object.keys(structuredTimetable).length > 0;

  return (
    <div className="space-y-10 pb-12">
      {/* 1. STANDARD HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Calendar size={14} /> Full Weekly Schedule
          </div>
          <h1 className="text-4xl font-black text-text italic tracking-tighter">Academic Grid</h1>
          <p className="text-text-muted font-medium">A structured view of your weekly teaching sessions and practicals.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <Grid3X3 size={12} /> Grid
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <TableIcon size={12} /> List
            </button>
          </div>

          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Upload size={18} />
            <span>{hasData ? 'Update Timetable' : 'Upload Timetable'}</span>
          </button>
        </div>
      </div>

      <motion.div layout>
        <AnimatePresence mode="wait">
          {!hasData ? (
            <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center"
            >
                <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mb-8">
                    <Upload size={48} />
                </div>
                <h2 className="text-3xl font-black text-text mb-4">No Timetable Detected</h2>
                <p className="text-text-muted font-medium max-w-sm mb-10 leading-relaxed">
                    Personalize your academic grid by uploading your timetable Excel or PDF document.
                </p>
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3"
                >
                    <Upload size={20} />
                    Upload Excelfile
                </button>
            </motion.div>
          ) : isMobile ? (
            <motion.div 
                key="mobile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <MobileTimetable data={structuredTimetable} />
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div 
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <TimetableGrid data={structuredTimetable} />
            </motion.div>
          ) : (
            <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
            >
                {/* Fallback to simple list view if needed, or keeping it as a legacy view */}
                <div className="p-8 bg-white border border-gray-100 rounded-[3rem] text-center italic text-text-muted font-medium">
                   The list view is optimized for mobile single-day tracking. Switch back to Grid for the full academic layout.
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* UPLOAD MODAL */}
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
                <h3 className="text-2xl font-black text-text">Upload Timetable</h3>
              </div>
              {!uploadFile && (
                <p className="text-text-muted mb-8 italic text-sm">
                  Upload your weekly schedule in Excel or PDF format
                </p>
              )}

              {uploadFile ? (
                <UploadPreview 
                  type="timetable" 
                  file={uploadFile} 
                  onClose={() => {
                    setUploadFile(null);
                    setShowUploadModal(false);
                  }}
                  onSave={onSaveUpload}
                />
              ) : (
                <div className="space-y-6">
                  <label className="group relative block px-10 py-16 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    <div className="flex flex-col items-center gap-4 text-text-muted group-hover:text-primary">
                      <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Click or drag to upload</p>
                        <p className="text-sm opacity-60 mt-1">Excel or PDF formats supported</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timetable;
