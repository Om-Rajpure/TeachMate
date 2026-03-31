import React from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart,
  Line,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface MobileAnalyticsProps {
  overview: any;
  subjectsData: any[];
  studentPerformance: any[];
  lowAttendance: any[];
  trendData: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  getStatusColor: (val: number) => string;
}

const MobileAnalytics: React.FC<MobileAnalyticsProps> = ({
  overview,
  subjectsData,
  studentPerformance,
  lowAttendance,
  trendData,
  searchQuery,
  setSearchQuery,
  getStatusColor,
}) => {
  const filteredStudents = studentPerformance.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-8 pb-24">
      {/* 1. OVERVIEW HORIZONTAL SCROLL */}
      <section className="overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar scroll-smooth">
        <div className="flex gap-3 min-w-max">
          {[
            { label: 'Classes', value: overview?.total_classes || 0, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Students', value: overview?.total_students || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Avg %', value: `${overview?.avg_attendance || 0}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'At Risk', value: overview?.low_attendance_count || 0, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`w-[160px] bg-white p-4 rounded-[2rem] border shadow-lg shadow-gray-200/5 ${stat.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-xl bg-white border border-inherit flex items-center justify-center">
                   <stat.icon size={14} />
                 </div>
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
              </div>
              <h3 className="text-2xl font-black tracking-tighter italic">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. SUBJECT PERFORMANCE CHART */}
      <section className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/10 space-y-4">
        <div>
          <h3 className="text-base font-black italic tracking-tight">Subject Performance</h3>
          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest opacity-60 italic">Avg attendance per course</p>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#E5E7EB" opacity={0.3} />
              <XAxis 
                dataKey="subject_name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 8, fontWeight: 800}}
                tickFormatter={(val) => val.split(' ')[0]} 
              />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 9}} />
              <Bar dataKey="percentage" barSize={18} radius={[4, 4, 4, 4]}>
                 {subjectsData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#f43f5e' : '#4f46e5'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. STUDENT PERFORMANCE CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-base font-black italic tracking-tight uppercase">Leaderboard</h3>
           <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student..." 
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[9px] font-bold outline-none focus:ring-2 ring-primary/20 w-[110px]"
              />
           </div>
        </div>

        <div className="space-y-3">
           {filteredStudents.map((student, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between gap-3"
             >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-primary italic shrink-0 text-xs shadow-sm">
                      {i + 1}
                   </div>
                   <div className="overflow-hidden">
                      <p className="font-black text-text italic text-[13px] tracking-tighter truncate">{student.name}</p>
                      <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest opacity-40">Roll: {student.roll_number}</p>
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black border shrink-0 whitespace-nowrap ${getStatusColor(student.percentage)}`}>
                   {student.percentage < 75 ? '🔴 Critical' : student.percentage < 85 ? '🟡 On-Track' : '🟢 Mastery'} • {student.percentage}%
                </div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* 4. AT RISK LIST */}
      <section className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 space-y-6">
         <div className="flex items-center justify-between">
           <h3 className="text-base font-black text-rose-900 italic tracking-tighter flex items-center gap-2 uppercase">
             <AlertTriangle className="text-rose-500" size={18} />
             At Risk
           </h3>
           <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-rose-500/20">
             {lowAttendance.length}
           </span>
         </div>
         
         <div className="space-y-2">
            {lowAttendance.slice(0, 5).map((s, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-rose-100 flex items-center justify-between">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center font-black text-[9px] shrink-0">
                       {s.roll_number}
                    </div>
                    <span className="text-[11px] font-black text-rose-900 italic tracking-tighter truncate">{s.name}</span>
                 </div>
                 <span className="text-[9px] font-black text-rose-500">{s.percentage}%</span>
              </div>
            ))}
            <button className="w-full py-3 bg-white rounded-xl text-rose-600 font-black text-[9px] uppercase tracking-widest shadow-sm mt-2 border border-rose-100 active:scale-95 transition-all">
              View All Alerts
            </button>
         </div>
      </section>

      {/* 5. TREND CHART */}
      <section className="bg-[#111827] p-6 rounded-[2.5rem] text-white space-y-6 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TrendingUp size={80} />
         </div>
         <div>
            <h3 className="text-base font-black italic tracking-tight">Daily Trend.</h3>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest opacity-60 italic">Session History</p>
         </div>
         <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData} margin={{ top: 10, right: 10, left: -35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4B5563', fontSize: 7, fontWeight: 700}}
                    minTickGap={20}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                  />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 7}} />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 0 }}
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </section>

      {/* 6. AI INSIGHT CARD */}
      <motion.div 
        className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-primary/20 relative overflow-hidden"
      >
         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <TrendingUp size={18} />
         </div>
         <div className="space-y-1">
           <h4 className="text-base font-black italic tracking-tighter">Insights.</h4>
           <p className="text-white/80 text-[10px] font-bold leading-relaxed max-w-[200px]">
             Daily attendance increased by <strong>4.2%</strong> this week.
           </p>
         </div>
         <ArrowRight className="absolute bottom-6 right-6 text-white/40" size={18} />
      </motion.div>
    </div>
  );
};

export default MobileAnalytics;
