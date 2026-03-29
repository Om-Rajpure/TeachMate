import React, { useState, useEffect } from 'react';
import { Calendar, Upload, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timetableService } from '../services/api';

interface TimetableCardProps {
  onUploadClick: () => void;
  isCompact?: boolean;
}

const TimetableCard: React.FC<TimetableCardProps> = ({ onUploadClick, isCompact }) => {
  const navigate = useNavigate();
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkExists = async () => {
    try {
      const res = await timetableService.exists();
      setExists(res.data.exists);
    } catch (err) {
      console.error('Error checking timetable existence:', err);
      setExists(false); // Fallback to upload state on error for safety
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExists();
    
    // Poll for changes or listen to a custom event if necessary
    const handleRefresh = () => checkExists();
    window.addEventListener('timetable-updated', handleRefresh);
    return () => window.removeEventListener('timetable-updated', handleRefresh);
  }, []);

  if (loading) {
    if (isCompact) return null;
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[2rem] animate-pulse">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl mb-3"></div>
        <div className="h-4 w-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (isCompact) {
    if (exists === false) return null;
    return (
      <button 
        onClick={() => navigate('/app/timetable')}
        className="px-6 py-3 bg-primary/5 text-primary font-bold hover:bg-primary/10 rounded-2xl transition-all flex items-center gap-2"
      >
        <ExternalLink size={16} /> View Timetable
      </button>
    );
  }

  if (exists === false) {
    return (
      <button 
        onClick={onUploadClick}
        className="group flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 w-full"
      >
        <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
          <Upload size={24} />
        </div>
        <span className="text-sm font-bold text-text">Upload Timetable</span>
        <p className="text-[10px] text-text-muted mt-1 font-medium">No schedule uploaded yet</p>
      </button>
    );
  }

  return (
    <div className="group flex flex-col p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 w-full relative">
      <div className="flex flex-col items-center mb-4">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
          <Calendar size={24} />
        </div>
        <span className="text-sm font-bold text-text">Weekly Timetable</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 w-full mt-auto">
        <button 
          onClick={() => navigate('/app/timetable')}
          className="flex items-center justify-center gap-2 p-2.5 bg-gray-50 text-text-muted hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-bold transition-all"
          title="View full schedule"
        >
          <ExternalLink size={14} /> View
        </button>
        <button 
          onClick={onUploadClick}
          className="flex items-center justify-center gap-2 p-2.5 bg-gray-50 text-text-muted hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-bold transition-all"
          title="Update current schedule"
        >
          <RefreshCw size={14} /> Update
        </button>
      </div>
    </div>
  );
};

export default TimetableCard;
