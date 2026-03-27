import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Clock } from 'lucide-react';
import { timetableService, subjectService, divisionService, batchService } from '../services/api';
import { Timetable as ITimetable, Subject, Division, Batch } from '../types';

const Timetable = () => {
  const [timetable, setTimetable] = useState<ITimetable[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    subject: '',
    division: '',
    batch: '',
    teacher: 1 // Default to our demo teacher Omkar
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tableRes, subRes, divRes, batchRes] = await Promise.all([
        timetableService.getAll(),
        subjectService.getAll(),
        divisionService.getAll(),
        batchService.getAll()
      ]);
      setTimetable(tableRes.data);
      setSubjects(subRes.data);
      setDivisions(divRes.data);
      setBatches(batchRes.data);
    } catch (error) {
      console.error('Failed to fetch timetable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        subject: parseInt(formData.subject),
        division: parseInt(formData.division),
        batch: formData.batch ? parseInt(formData.batch) : null,
      };
      await timetableService.create(dataToSubmit);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Error saving timetable entry');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this entry?')) {
      await timetableService.delete(id);
      fetchData();
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text tracking-tight">Weekly Schedule</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Slot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {days.map(day => (
          <div key={day} className="space-y-4">
            <h3 className="font-bold text-lg text-text border-b pb-2">{day}</h3>
            <div className="space-y-4">
              {timetable.filter(item => item.day === day).length === 0 ? (
                <p className="text-sm text-text-muted italic">No lectures</p>
              ) : (
                timetable
                  .filter(item => item.day === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(item => (
                    <div key={item.id} className="card p-4 space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">{item.subject_details?.code}</p>
                          <h4 className="font-bold text-text">{item.subject_details?.name}</h4>
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                        </div>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                          Div {item.division_name} {item.batch_name ? `- ${item.batch_name}` : ''}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6">Add Timetable Slot</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Day</label>
                  <select 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.day}
                    onChange={e => setFormData({...formData, day: e.target.value})}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Subject</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  >
                    <option value="">Select</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-lg"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">End Time</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-lg"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Division</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    required
                    value={formData.division}
                    onChange={e => setFormData({...formData, division: e.target.value})}
                  >
                    <option value="">Select</option>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Batch (Opt)</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    value={formData.batch}
                    onChange={e => setFormData({...formData, batch: e.target.value})}
                  >
                    <option value="">Full Division</option>
                    {batches.filter(b => b.division === parseInt(formData.division)).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Entry</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
