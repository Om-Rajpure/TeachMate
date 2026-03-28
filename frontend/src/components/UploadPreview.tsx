import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Trash2, 
  Plus, Edit2, Save, FileSpreadsheet, 
  CheckCircle2, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadPreviewProps {
  type: 'timetable' | 'syllabus';
  file: File;
  onClose: () => void;
  onSave: (data: any[]) => void;
}

const UploadPreview: React.FC<UploadPreviewProps> = ({ type, file, onClose, onSave }) => {
  const [isParsing, setIsParsing] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    // Simulate AI Parsing delay
    const timer = setTimeout(() => {
      generateMockData();
      setIsParsing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [type]);

  const generateMockData = () => {
    if (type === 'timetable') {
      setData([
        { id: 1, subject: 'Artificial Intelligence', time: '09:00 - 10:00', room: 'Lab 102', div: 'A', batch: 'All' },
        { id: 2, subject: 'Computer Networks', time: '10:00 - 11:00', room: 'Class 304', div: 'A', batch: 'All' },
        { id: 3, subject: 'Software Engineering', time: '11:15 - 12:15', room: 'Class 304', div: 'A', batch: 'All' },
        { id: 4, subject: 'Data Science', time: '13:00 - 14:00', room: 'Lab 105', div: 'A', batch: 'B1' },
      ]);
    } else {
      setData([
        { id: 1, topic: 'Introduction to Agents', hours: 2, priority: 'High' },
        { id: 2, topic: 'Search Strategies', hours: 4, priority: 'Critical' },
        { id: 3, topic: 'Genetic Algorithms', hours: 3, priority: 'Medium' },
        { id: 4, topic: 'Neural Networks 101', hours: 5, priority: 'High' },
      ]);
    }
  };

  const handleRemove = (id: number) => {
    setData(data.filter(item => item.id !== id));
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    setEditingId(null);
  };

  const handleValueChange = (id: number, field: string, value: string) => {
    setData(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  if (isParsing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6">
        <div className="relative">
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <FileSpreadsheet size={32} className="text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-text">Analyzing {file.name}</h3>
          <p className="text-text-muted text-sm mt-1 max-w-xs">Our AI is extracting rows, subjects, and schedules from your file...</p>
        </div>
        
        <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: "100%" }}
             transition={{ duration: 2.5 }}
             className="h-full bg-primary"
           />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h3 className="text-2xl font-black text-text">Verify Parsed Data</h3>
          <p className="text-sm text-text-muted">We found {data.length} entries. Please check for accuracy.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-text-muted transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                {type === 'timetable' ? (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Time</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Room</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Div</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Topic</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Hrs</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Priority</th>
                  </>
                )}
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  {type === 'timetable' ? (
                    <>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <input 
                            type="text" 
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                            value={item.subject} 
                            onChange={(e) => handleValueChange(item.id, 'subject', e.target.value)}
                          />
                        ) : (
                          <span className="font-bold text-text text-sm">{item.subject}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <input 
                            type="text" 
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                            value={item.time} 
                            onChange={(e) => handleValueChange(item.id, 'time', e.target.value)}
                          />
                        ) : (
                          <span className="text-text-muted text-sm">{item.time}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <input 
                            type="text" 
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                            value={item.room} 
                            onChange={(e) => handleValueChange(item.id, 'room', e.target.value)}
                          />
                        ) : (
                          <span className="text-text-muted text-sm">{item.room}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-blue-50 text-primary rounded-lg text-[10px] font-black">{item.div}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <input 
                            type="text" 
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                            value={item.topic} 
                            onChange={(e) => handleValueChange(item.id, 'topic', e.target.value)}
                          />
                        ) : (
                          <span className="font-bold text-text text-sm">{item.topic}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <input 
                            type="number" 
                            className="w-20 p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                            value={item.hours} 
                            onChange={(e) => handleValueChange(item.id, 'hours', e.target.value)}
                          />
                        ) : (
                          <span className="text-text-muted text-sm">{item.hours}h</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                           item.priority === 'Critical' ? 'bg-rose-50 text-rose-600' : 
                           item.priority === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                         }`}>{item.priority}</span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === item.id ? (
                        <button onClick={handleSaveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Save size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleEdit(item.id)} className="p-2 text-text-muted hover:bg-gray-100 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button onClick={() => handleRemove(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button className="w-full py-4 bg-gray-50/50 text-text-muted text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            <Plus size={16} /> Add Entry Manually
          </button>
        </div>
      </div>

      <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-[2.5rem]">
         <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">Ready to sync</span>
         </div>
         <div className="flex gap-3">
           <button onClick={onClose} className="px-6 py-3 font-bold text-text-muted hover:bg-gray-100 rounded-2xl transition-all">
             Cancel
           </button>
           <button 
             onClick={() => onSave(data)}
             className="px-10 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
           >
             Save Changes
           </button>
         </div>
      </div>
    </div>
  );
};

export default UploadPreview;
