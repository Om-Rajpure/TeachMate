import { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  PieChart as PieChartIcon, 
  AlertCircle, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { motion } from 'framer-motion';
import { analyticsService } from '../services/api';
import type { ClassAnalytics } from '../types';

const Analytics = () => {
  const [data, setData] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getClassAnalytics().then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  const statsCards = useMemo(() => {
    if (!data) return [];
    return [
      { 
        label: 'Class Average', 
        value: `${data.class_average}%`, 
        icon: TrendingUp, 
        color: 'bg-blue-50 text-blue-600',
        trend: data.class_average > 70 ? 'up' : 'down'
      },
      { 
        label: 'Total Students', 
        value: data.total_students, 
        icon: Users, 
        color: 'bg-green-50 text-green-600' 
      },
      { 
        label: 'Pass Rate', 
        value: `${Math.round((data.student_performances.filter(p => p.percentage >= 40).length / data.total_students) * 100)}%`, 
        icon: PieChartIcon, 
        color: 'bg-orange-50 text-orange-600' 
      },
      { 
        label: 'Highest Score', 
        value: `${data.toppers[0]?.percentage || 0}%`, 
        icon: Trophy, 
        color: 'bg-red-50 text-red-600' 
      },
    ];
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data) return [];
    const ranges = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '60-69', count: 0 },
      { range: '40-59', count: 0 },
      { range: '<40', count: 0 },
    ];
    
    data.student_performances.forEach(p => {
      if (p.percentage >= 90) ranges[0].count++;
      else if (p.percentage >= 80) ranges[1].count++;
      else if (p.percentage >= 70) ranges[2].count++;
      else if (p.percentage >= 60) ranges[3].count++;
      else if (p.percentage >= 40) ranges[4].count++;
      else ranges[5].count++;
    });
    
    return ranges;
  }, [data]);

  const passFailData = useMemo(() => {
    if (!data) return [];
    const passed = data.student_performances.filter(p => p.percentage >= 40).length;
    return [
      { name: 'Passed', value: passed },
      { name: 'Failed', value: data.total_students - passed },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-text-muted">No analytics data available yet.</div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              {card.trend && (
                card.trend === 'up' ? <ArrowUpRight className="text-green-500" size={20} /> : <ArrowDownRight className="text-red-500" size={20} />
              )}
            </div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">{card.label}</p>
            <h3 className="text-3xl font-black text-text">{card.value}</h3>
          </motion.div>
        ))}
      </section>

      {/* Main Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-text flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" /> Performance Distribution
             </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#F9FAFB'}}
                  contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 6, 6]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-text flex items-center gap-2">
                <PieChartIcon size={20} className="text-primary" /> Subject Proficiency
             </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.subject_performance}>
                <PolarGrid stroke="#F3F4F6" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#4B5563', fontSize: 10, fontWeight: 'bold'}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar
                   name="Avg %"
                   dataKey="avg_percentage"
                   stroke="#4F46E5"
                   fill="#4F46E5"
                   fillOpacity={0.6}
                />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Insights & Toppers */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* "AI" Rule-based Insights */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-bold text-text">Intelligent Insights</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-gradient-to-br from-primary to-blue-600 rounded-3xl text-white space-y-4 shadow-xl shadow-primary/20">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} />
                 </div>
                 <h4 className="font-bold text-lg">Class Performance</h4>
                 <p className="text-white/80 text-sm leading-relaxed">
                   The class is performing <strong>{data.class_average > 70 ? 'exceedingly well' : 'stably'}</strong> with an average of {data.class_average}%. 
                   {data.class_average > 75 && " Consider introducing more complex assignments to challenge the top performers."}
                 </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                 <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                    <AlertCircle size={20} />
                 </div>
                 <h4 className="font-bold text-lg text-text">Weak Areas</h4>
                 <p className="text-text-muted text-sm leading-relaxed">
                   {data.weak_students.length} students are currently below the 60% threshold. 
                   {data.subject_performance.sort((a,b) => a.avg_percentage - b.avg_percentage)[0]?.subject} seems to be the most challenging subject.
                 </p>
              </div>
           </div>

           {/* Performance List View */}
           <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                 <h4 className="font-bold text-lg">Student Performance Radar</h4>
                 <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">All Students</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                 {data.student_performances.map((student) => (
                    <div key={student.id} className="p-4 hover:bg-gray-50 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-text-muted group-hover:bg-primary group-hover:text-white transition-all">
                             {student.rank}
                          </div>
                          <div>
                             <p className="font-bold text-text">{student.name}</p>
                             <p className="text-xs text-text-muted uppercase tracking-tighter">Roll: {student.roll_number}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="font-black text-text">{student.percentage}%</p>
                             <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-primary" style={{width: `${student.percentage}%`}} />
                             </div>
                          </div>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                             student.grade.includes('A') ? 'bg-green-100 text-green-700' : 
                             student.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                             'bg-orange-100 text-orange-700'
                          }`}>
                             {student.grade}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Toppers Sidebar */}
        <div className="space-y-6">
           <h3 className="text-xl font-bold text-text">Class Toppers</h3>
           <div className="space-y-4">
              {data.toppers.map((topper, i) => (
                <div key={topper.id} className="relative bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:scale-[1.02] transition-transform">
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        i === 0 ? 'bg-yellow-100 text-yellow-600' : 
                        i === 1 ? 'bg-gray-100 text-gray-600' : 
                        'bg-orange-100 text-orange-600'
                      }`}>
                         {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </div>
                      <div>
                         <h4 className="font-bold text-lg text-text">{topper.name}</h4>
                         <p className="text-sm text-text-muted font-medium">Rank {topper.rank} • {topper.percentage}%</p>
                      </div>
                   </div>
                   {/* Abstract background shape for rank 1 */}
                   {i === 0 && (
                     <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full blur-2xl" />
                   )}
                </div>
              ))}
           </div>

           {/* At Risk List */}
           <div className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 space-y-6">
              <h4 className="font-bold text-red-700 flex items-center gap-2">
                 <AlertCircle size={18} /> At Risk Students
              </h4>
              <div className="space-y-4">
                 {data.weak_students.length === 0 ? (
                   <p className="text-sm text-red-600 italic">No students at risk currently.</p>
                 ) : (
                   data.weak_students.slice(0, 5).map(s => (
                     <div key={s.id} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-red-800">{s.name}</span>
                        <span className="text-xs font-black text-red-500 bg-white px-2 py-0.5 rounded-lg border border-red-100">
                           {s.percentage}%
                        </span>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
