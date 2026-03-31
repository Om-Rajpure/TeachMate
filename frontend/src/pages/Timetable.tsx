import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Upload, Grid3X3, Table as TableIcon } from 'lucide-react';
import { timetableService } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TimetableGrid from '../components/TimetableGrid';
import MobileTimetable from '../components/MobileTimetable';
import type { Timetable as TimetableType } from '../types';

const Timetable: React.FC = () => {
  const navigate = useNavigate();
  const [structuredTimetable, setStructuredTimetable] = useState<Record<string, TimetableType[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Card */}
      <div className="relative bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:gap-3 transition-all mb-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Calendar size={14} /> Full Weekly Schedule
            </div>
            <h1 className="text-4xl font-black text-text italic tracking-tighter">Academic Grid</h1>
            <p className="text-text-muted text-sm font-medium max-w-md">
              A structured view of your weekly teaching sessions, practicals, and intervals.
            </p>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner self-start md:self-center">
            <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <Grid3X3 size={14} /> Grid
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text'}`}
            >
                <TableIcon size={14} /> List
            </button>
          </div>
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
                    The academic grid will populate once you sync your timetable Excel file from the dashboard.
                </p>
                <button 
                    onClick={() => navigate('/app/dashboard')}
                    className="px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                >
                    Back to Dashboard
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
    </div>
  );
};

export default Timetable;
