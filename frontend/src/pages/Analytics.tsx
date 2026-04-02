import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  LineChart,
  Line,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { analyticsService, subjectService } from '../services/api';
import toast from 'react-hot-toast';
import MobileAnalytics from '../components/MobileAnalytics';

const Analytics = () => {
  const [overview, setOverview] = useState<any>({
    total_classes: 0,
    total_students: 0,
    avg_attendance: 0,
    low_attendance_count: 0
  });
  const [subjectsData, setSubjectsData] = useState<any[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [ov, subs, subList, low] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getSubjects(),
        subjectService.getAll(),
        analyticsService.getLowAttendance()
      ]);
      
      setOverview(ov.data);
      setSubjectsData(subs.data);
      setSubjects(subList.data);
      setLowAttendance(low.data);
      
      if (Array.isArray(subList.data) && subList.data.length > 0) {
        setSelectedSub(subList.data[0].id.toString());
      }
    } catch (err) {
      console.error('Analytics Error:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSub) {
      fetchSubjectSpecificData(Number(selectedSub));
    }
  }, [selectedSub]);

  const fetchSubjectSpecificData = async (id: number) => {
    try {
      const [students, trend] = await Promise.all([
        analyticsService.getStudents(id),
        analyticsService.getTrend(id)
      ]);
      setStudentPerformance(students.data);
      setTrendData(trend.data);
    } catch (err) {
      toast.error('Failed to load subject specific data');
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent < 75) return 'text-rose-500 bg-rose-50 border-rose-100';
    if (percent < 85) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-emerald-500 bg-emerald-50 border-emerald-100';
  };

  const getDotColor = (percent: number) => {
    if (percent < 75) return '#f43f5e';
    if (percent < 85) return '#f59e0b';
    return '#10b981';
  };

  const filteredStudents = studentPerformance.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-text-muted font-black animate-pulse uppercase tracking-widest text-[10px]">Processing Data...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="px-4">
        <header className="py-10 space-y-2">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
             <BarChart3 size={14} strokeWidth={3} /> Insights Dashboard
           </div>
           <h1 className="text-5xl font-black text-text italic tracking-tighter leading-tight">Analytics.</h1>
           
           <div className="pt-6">
              <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-lg">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-[1.5rem] text-text-muted font-bold text-[10px] uppercase tracking-widest border border-gray-100 whitespace-nowrap">
                  <Filter size={14} /> Subject
                </div>
                <select 
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  className="bg-transparent border-none outline-none font-black text-xs text-text pr-10 py-2 w-full appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
           </div>
        </header>

        <MobileAnalytics 
          overview={overview}
          subjectsData={subjectsData}
          studentPerformance={studentPerformance}
          lowAttendance={lowAttendance}
          trendData={trendData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getStatusColor={getStatusColor}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* HEADER SECTION (Desktop) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
            <BarChart3 size={14} strokeWidth={3} /> Insights Dashboard
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-text italic tracking-tighter leading-tight">Analytics Hub.</h1>
          <p className="text-text-muted font-semibold max-w-xl text-lg">Monitor attendance velocity, identify at-risk trends, and optimize student engagement.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20">
           <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-[1.5rem] text-text-muted font-bold text-xs uppercase tracking-widest border border-gray-100">
             <Filter size={14} /> Filter
           </div>
           <select 
             value={selectedSub}
             onChange={(e) => setSelectedSub(e.target.value)}
             className="bg-transparent border-none outline-none font-black text-sm text-text pr-10 py-2 min-w-[220px] appearance-none cursor-pointer"
             style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
           >
             {subjects.map(s => (
               <option key={s.id} value={s.id}>{s.name}</option>
             ))}
           </select>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <section className="overflow-x-auto pb-6 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
        <div className="flex lg:grid lg:grid-cols-4 gap-6 min-w-[1000px] lg:min-w-0">
          {[
            { label: 'Classes Logged', value: overview?.total_classes || 0, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Active Students', value: overview?.total_students || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Avg Attendance', value: `${overview?.avg_attendance || 0}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Students At Risk', value: overview?.low_attendance_count || 0, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex-1 bg-white p-8 rounded-3xl border shadow-xl group hover:-translate-y-2 transition-all duration-300 ${stat.color}`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white border border-inherit flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <stat.icon size={26} />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{stat.label}</p>
                   <h3 className="text-5xl font-black tracking-tighter italic">{stat.value}</h3>
                </div>
              </div>
              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  className="h-full bg-current opacity-20"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CHARTS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Subject-wise Bar Chart */}
        <div className="lg:col-span-3 bg-white p-10 rounded-3xl border border-gray-100 shadow-xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black italic tracking-tight">Subject Performance</h3>
              <p className="text-xs font-bold text-text-muted">Average attendance across all enrolled subjects</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-text-muted tracking-widest">
                  <span className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10"></span> Good
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-text-muted tracking-widest">
                  <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/10"></span> Low
               </div>
            </div>
          </div>
          <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="subject_name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4B5563', fontSize: 10, fontWeight: 800}}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 700}} 
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip 
                  cursor={{fill: '#F3F4F6', radius: 10}}
                  contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '1.5rem'}}
                />
                <Bar dataKey="percentage" barSize={40} radius={[12, 12, 12, 12]}>
                   {subjectsData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#f43f5e' : '#4f46e5'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-3xl text-white space-y-10 shadow-2xl border border-gray-800">
          <div>
            <h3 className="text-2xl font-black italic tracking-tight">Daily Trend.</h3>
            <p className="text-xs font-bold text-gray-400">Chronological attendance flow for {subjects.find(s => s.id === Number(selectedSub))?.name || 'Selected Subject'}</p>
          </div>
          <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4B5563', fontSize: 10, fontWeight: 800}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 10}} />
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#1F2937', borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#10b981', fontWeight: 900}}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="percentage" 
                  stroke="#10b981" 
                  strokeWidth={6} 
                  dot={{ r: 0 }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* DETAILED DATA SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-7 gap-10">
        {/* Student Performance Table */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
           <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black italic tracking-tight">Student Leaderboard</h3>
                <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest opacity-60">High Performance Recognition</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or roll..." 
                    className="pl-14 pr-8 py-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-2 ring-primary/20 w-full md:w-[320px] transition-all"
                  />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Rank</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Student</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted text-center">Intensity</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((student, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-all group cursor-default">
                      <td className="px-10 py-8">
                         <span className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xl text-text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                           {i + 1}
                         </span>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center font-black text-xs text-gray-400">
                               {student.name.split(' ').map((n: string)=>n[0]).join('')}
                            </div>
                            <div>
                               <p className="font-black text-text italic text-lg leading-tight uppercase tracking-tighter">{student.name}</p>
                               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40 italic">Roll: {student.roll_number}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col items-center gap-3">
                            <span className="text-xl font-black italic tracking-tighter">{student.percentage}%</span>
                            <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${student.percentage}%` }}
                                 className="h-full rounded-full shadow-sm" 
                                 style={{ backgroundColor: getDotColor(student.percentage) }} 
                               />
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${getStatusColor(student.percentage)}`}>
                            {student.percentage < 75 ? 'Critical' : student.percentage < 85 ? 'On-Track' : 'Mastery'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
           
           {filteredStudents.length === 0 && (
             <div className="p-32 text-center space-y-6">
                <div className="inline-flex w-24 h-24 bg-gray-50 rounded-2xl items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                   <Users size={48} strokeWidth={1} />
                </div>
                <div>
                   <p className="font-black text-text-muted italic text-2xl tracking-tight">No data detected.</p>
                   <p className="text-sm font-bold text-text-muted opacity-60">Try adjusting your filters or search terms.</p>
                </div>
             </div>
           )}
        </div>

        {/* Low Attendance Alert Sidebar */}
        <div className="lg:col-span-2 space-y-10">
           <div className="bg-rose-50 p-10 rounded-3xl border border-rose-100 space-y-10 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-rose-900 italic tracking-tighter flex items-center gap-4">
                  <AlertTriangle className="text-rose-500" size={32} strokeWidth={3} />
                  At Risk.
                </h3>
                <span className="text-[10px] font-black bg-rose-500 text-white px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-rose-500/20">
                  {lowAttendance.length}
                </span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                 {lowAttendance.map((s, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
                    >
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-black text-sm border border-rose-100">
                           {s.roll_number}
                        </div>
                        <div>
                           <p className="text-sm font-black text-text italic leading-tight uppercase tracking-tighter">{s.name}</p>
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{s.percentage}% Rate</p>
                        </div>
                     </div>
                     <ArrowRight className="text-rose-200 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" size={20} />
                   </motion.div>
                 ))}

                 {lowAttendance.length === 0 && (
                   <div className="text-center py-20 bg-emerald-50 rounded-3xl border border-emerald-100">
                      <p className="text-emerald-800 font-black italic text-xl">Perfect Attendance!</p>
                      <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">No alerts detected</p>
                   </div>
                 )}
              </div>
              
              <button className="w-full py-6 bg-white rounded-2xl text-rose-600 font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95">
                Generate Warning Letters
              </button>
           </div>

           {/* AI Insight Card */}
           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="bg-gradient-to-br from-blue-600 to-purple-600 p-10 rounded-3xl text-white space-y-6 shadow-2xl relative overflow-hidden group"
           >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                 <TrendingUp size={120} />
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20">
                 <Sparkles size={32} />
              </div>
              <div className="relative z-10 space-y-2">
                <h4 className="text-2xl font-black italic tracking-tighter">Velocity Insights.</h4>
                <p className="text-white/80 text-sm font-bold leading-relaxed">
                  Average attendance has shown a <strong>4.2% increase</strong> since the last syllabus checkpoint. Students perform 12% better during morning lectures.
                </p>
              </div>
              <button className="relative z-10 font-black text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white flex items-center gap-2">
                View Full Intelligence Report <ArrowRight size={12} />
              </button>
           </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
