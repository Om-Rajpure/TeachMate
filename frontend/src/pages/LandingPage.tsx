import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Sparkles,
  ExternalLink, BrainCircuit, Zap, ShieldCheck, 
  Quote, Star, Award, HeartPulse, BarChart3
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

const extendedFeatures = [
  {
    icon: BrainCircuit,
    title: 'AI-Driven Insights',
    description: 'Advanced algorithms that predict student performance and teacher workload trends.',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    icon: Zap,
    title: 'Smart Automation',
    description: 'Automate repetitive tasks like timetable scheduling and report generation.',
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Instant visualization of academic progress, attendance, and feedback loops.',
    color: 'text-teal-600',
    bg: 'bg-teal-50'
  },
  {
    icon: Award,
    title: 'Academic Optimization',
    description: 'Streamline syllabus coverage and resource allocation with intelligent planning.',
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Security',
    description: 'Enterprise-grade data encryption and secure access controls for your institution.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    icon: HeartPulse,
    title: 'Wellness Tracking',
    description: 'Monitor faculty wellness and burnout risks with behavioral analysis.',
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  }
];

const testimonials = [
  {
    quote: "TeachMate's burnout prediction system helped us save 3 valuable faculty members who were on the verge of resigning. It's a game-changer.",
    author: "Dr. James Wilson",
    role: "Dean of Academics, State University",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
  },
  {
    quote: "The smart timetable generator reduced our scheduling time from 2 weeks to just 2 minutes. The academic logic is flawless.",
    author: "Prof. Sarah Miller",
    role: "Principal, Merit Academy",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
  },
  {
    quote: "Finally, a teaching assistant that actually understands the modern educator's workflow. The analytics are incredibly intuitive.",
    author: "Mr. Robert Chen",
    role: "Senior Lecturer, Tech Institute",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  }
];

interface ProductSectionProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  buttonText: string;
  link?: string;
  image: string;
  reversed?: boolean;
}

const ProductSection = ({ 
  title, subtitle, description, features, buttonText, link, image, reversed = false 
}: ProductSectionProps) => {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (link?.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate('/login');
    }
  };

  const highlightKeywords = (text: string) => {
    const keywords = ['AI', 'Smart', 'Automated', 'Insights', 'Optimization'];
    const parts = text.split(new RegExp(`(${keywords.join('|')})`, 'g'));
    return parts.map((part, i) => 
      keywords.includes(part) ? (
        <span key={i} className="text-gradient-colorful font-black">{part}</span>
      ) : part
    );
  };

  return (
    <section className="py-24 lg:py-32 overflow-hidden px-4 sm:px-6 lg:px-8" id="products">
      <div className="max-w-7xl mx-auto">
        <div className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={reversed ? 'lg:order-2' : ''}
          >
            <div className="space-y-6">
              <span className="inline-block px-5 py-2 rounded-full bg-primary/5 text-primary text-sm font-black tracking-widest uppercase border border-primary/10">
                {subtitle}
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text tracking-tighter leading-[1] mb-6">
                {highlightKeywords(title)}
              </h2>
              <p className="text-xl text-text-muted leading-relaxed max-w-xl">
                {highlightKeywords(description)}
              </p>
              
              <ul className="grid sm:grid-cols-2 gap-4 pt-4">
                {features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-text font-bold text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="pt-8">
                <button
                  onClick={handleCTA}
                  className="btn-gradient px-10 py-5 text-lg flex items-center gap-3"
                >
                  {buttonText}
                  {link?.startsWith('http') ? <ExternalLink size={20} /> : <ArrowRight size={20} />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: reversed ? -40 : 40 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`relative ${reversed ? 'lg:order-1' : ''}`}
          >
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary/20 via-purple-500/10 to-teal-500/20 rounded-full blur-[100px] opacity-30" />
            <div className="relative rounded-[3rem] overflow-hidden border-8 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] p-2 bg-gray-50/50 backdrop-blur-sm">
              <img
                src={image}
                alt={title}
                className="w-full h-auto rounded-[2.5rem]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary selection:text-white">
      <PublicNavbar />
      
      {/* ═══════════════════════════ HERO SECTION ═══════════════════════════ */}
      <section className="relative pt-44 pb-20 lg:pt-56 lg:pb-40 bg-grid overflow-hidden">
        {/* Background blobs */}
        <div className="bg-blob top-0 left-[-10%] bg-blue-500/20" />
        <div className="bg-blob bottom-[20%] right-[-10%] bg-purple-500/20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 inline-block"
            >
              <span className="px-6 py-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-primary/20 text-primary text-sm font-black tracking-widest uppercase shadow-sm">
                <Sparkles size={16} className="inline mr-2" />
                Next-Gen Academic Ecosystem
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-[900] tracking-tighter leading-[0.9] text-text mb-8"
            >
              Teach <span className="text-gradient-colorful">Smarter</span>,
              <br />
              Grow Faster
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl lg:text-2xl text-text-muted leading-relaxed max-w-2xl mx-auto mb-12 font-medium"
            >
              Manage lectures, automate <span className="text-text font-bold">Timetables</span>, and predict <span className="text-text font-bold">Burnout</span> with our all-in-one <span className="text-gradient">AI</span> platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <button
                onClick={() => navigate('/login')}
                className="btn-gradient px-12 py-6 text-xl shadow-2xl"
              >
                Start for Free
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline-glass px-12 py-6 text-xl border-gray-200"
              >
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-16 flex items-center justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              {['Tech University', 'Merit Academy', 'Global Schools', 'Scholars Hub'].map(brand => (
                <span key={brand} className="text-xl font-black tracking-widest text-text whitespace-nowrap">{brand}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ ABOUT SECTION (NEW) ═══════════════════════════ */}
      <section className="py-24 bg-white relative overflow-hidden" id="about">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="card-glass p-12 lg:p-20 text-center relative overflow-hidden">
             <div className="bg-blob center bg-blue-500/10" />
             <div className="max-w-3xl mx-auto relative z-10">
               <span className="text-primary font-black uppercase tracking-widest text-sm mb-6 block">Our Mission</span>
               <h2 className="text-3xl lg:text-5xl font-black mb-8 leading-tight">
                 Solving Real Academic Problems with <span className="text-gradient">AI</span> and <span className="text-gradient">Automation</span>
               </h2>
               <p className="text-xl text-text-muted leading-relaxed font-medium">
                 TeachMate was born from a simple observation: teachers are overworked and administrative systems are broken. By combining behavioral AI and constraint-based algorithms, we eliminate the friction in academic management.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES GRID (NEW) ═══════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background" id="features">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-primary font-black uppercase tracking-widest text-sm mb-4 block">Capabilities</span>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6">Designed for <span className="text-gradient-colorful">High-Performance</span> Teaching</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">Modular tools that adapt to your institutional workflow.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {extendedFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-soft hover:shadow-hover transition-all duration-500 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-text mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PRODUCT SHOWCASE ═══════════════════════════ */}
      <div className="space-y-0">
        <ProductSection 
          title="AI-Based Teacher Burnout Prediction"
          subtitle="Wellness Analytics"
          description="A smart AI-powered system that analyzes teacher workload and behavioral patterns to detect burnout risks before they happen."
          features={["Early Detection", "Workload Analysis", "Personalized Support", "Admin Insights"]}
          buttonText="Predict Burnout"
          link="https://facultymind-ai.vercel.app/"
          image="/burnout_prediction_mockup_1774977700537.png"
        />

        <ProductSection 
          title="Advanced Timetable Generator"
          subtitle="Smart Scheduling"
          description="Automate complex college schedules handling labs, batches, and room constraints with our advanced optimization engine."
          features={["Zero Conflicts", "Lab Scheduling", "Room Optimization", "Instant Updates"]}
          buttonText="Generate Now"
          link="https://advance-timetable-generator.vercel.app"
          image="/timetable_generator_mockup_1774977729413.png"
          reversed={true}
        />
      </div>

      {/* ═══════════════════════════ TESTIMONIALS (NEW) ═══════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-4 block">Trust</span>
            <h2 className="text-4xl lg:text-7xl font-black tracking-tighter">Loved by <span className="text-gradient">Innovators</span></h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-background rounded-[2.5rem] p-10 relative group border border-gray-50 shadow-soft hover:shadow-hover transition-all duration-500"
              >
                <Quote className="absolute top-8 right-10 w-12 h-12 text-primary/10" />
                <div className="flex gap-1 mb-8 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-lg text-text font-bold leading-relaxed mb-8 relative z-10 italic">"{item.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.author} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-black text-text leading-tight">{item.author}</h4>
                    <p className="text-xs text-text-muted font-bold tracking-wider uppercase">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FINAL CTA ═══════════════════════════ */}
      <section className="py-24 lg:py-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="bg-gradient-to-br from-blue-700 via-purple-700 to-blue-900 rounded-[3.5rem] p-16 lg:p-32 text-center text-white relative overflow-hidden shadow-glow"
          >
            <Zap className="absolute -top-10 -right-10 w-64 h-64 opacity-5 rotate-12" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter">Ready to <span className="text-emerald-400">Transform</span> Your Institution?</h2>
              <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">Join hundreds of progressive educators today.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button onClick={() => navigate('/login')} className="px-12 py-6 bg-white text-primary rounded-2xl font-black text-xl hover:shadow-white/20 transition-all shadow-xl active:scale-95">Get Started Now</button>
                <button onClick={() => navigate('/contact')} className="px-12 py-6 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-xl hover:bg-white/20 transition-all active:scale-95">Support Team</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
