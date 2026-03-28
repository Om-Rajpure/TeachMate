import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { 
  CheckSquare, ListChecks, ClipboardCheck, BarChart3, Bell,
  Users, CalendarDays, LineChart, Lightbulb,
  ArrowRight, Sparkles, GraduationCap
} from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const features = [
  {
    icon: CheckSquare,
    title: 'Attendance Tracking',
    description: 'Mark attendance in seconds. Auto-detect defaulters and send alerts.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ListChecks,
    title: 'Syllabus Planning',
    description: 'Plan topics, track coverage, and stay on schedule effortlessly.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ClipboardCheck,
    title: 'Marks Management',
    description: 'Record IAs, assignments & exams. Instant performance snapshots.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Visual insights on attendance, marks, and academic progress.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Auto-alerts for low attendance, pending lectures, and deadlines.',
    color: 'bg-rose-50 text-rose-600',
  },
];

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Add Subjects & Students',
    description: 'Set up your classes, divisions, and student records.',
  },
  {
    number: '02',
    icon: CalendarDays,
    title: 'Upload Timetable',
    description: 'Define your weekly schedule with timeslots.',
  },
  {
    number: '03',
    icon: GraduationCap,
    title: 'Track Lectures & Attendance',
    description: 'Log every lecture and mark attendance on the fly.',
  },
  {
    number: '04',
    icon: LineChart,
    title: 'Get Insights',
    description: 'Analyze trends and identify students who need attention.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation Bar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              T
            </div>
            <span className="font-bold text-xl tracking-tight text-text">TeachMate</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════ HERO SECTION ═══════════════════════════ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-grid" id="hero">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} custom={0} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-semibold border border-primary/10">
                  <Sparkles size={16} />
                  Smart Academic Assistant
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-text"
              >
                Your Smart{' '}
                <span className="text-gradient">Teaching</span>
                <br />
                Assistant
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="mt-6 text-lg lg:text-xl text-text-muted leading-relaxed max-w-lg mx-auto lg:mx-0"
              >
                Manage lectures, attendance, syllabus, and student performance in one place.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                custom={3}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  id="hero-cta"
                  onClick={() => navigate('/login')}
                  className="btn-landing group"
                >
                  Get Started
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#features"
                  className="btn-landing-outline"
                >
                  Learn More
                </a>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                custom={4}
                className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm text-text-muted"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Free to use
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  No setup required
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Instant insights
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-3xl blur-2xl" />
                <img
                  src="/hero-illustration.png"
                  alt="TeachMate Dashboard Preview"
                  className="relative w-full rounded-2xl shadow-card"
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES SECTION ═══════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              custom={0}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-semibold mb-4"
            >
              Features
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
            >
              Everything You Need to{' '}
              <span className="text-gradient">Teach Smarter</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="mt-4 text-lg text-text-muted max-w-2xl mx-auto"
            >
              Powerful tools designed specifically for educators. Simplify your workflow and focus on what matters most.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                custom={index}
                className="feature-card group"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════ HOW IT WORKS ═══════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background bg-grid" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              custom={0}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-semibold mb-4"
            >
              How It Works
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
            >
              Get Started in{' '}
              <span className="text-gradient">4 Simple Steps</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                custom={index}
                className="relative group"
              >
                {/* Connector line (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+28px)] w-[calc(100%-56px)] h-[2px] bg-gradient-to-r from-primary/30 to-primary/10" />
                )}

                <div className="bg-white rounded-2xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-card hover:-translate-y-1 text-center">
                  <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <step.icon size={28} className="text-primary" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════ FINAL CTA ═══════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white" id="cta">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-blue-900 text-white p-12 lg:p-20 text-center"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <motion.div variants={fadeInUp} custom={0} className="relative z-10">
              <Lightbulb size={40} className="mx-auto mb-6 text-yellow-300" />
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
            >
              Start Managing Your
              <br />
              Teaching Smarter Today
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              custom={2}
              className="relative z-10 mt-6 text-lg text-blue-100 max-w-xl mx-auto"
            >
              Join educators who are saving hours every week with TeachMate's smart academic tools.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              custom={3}
              className="relative z-10 mt-10"
            >
              <button
                id="cta-login"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-white text-primary font-bold text-lg rounded-2xl
                           transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5
                           active:scale-95 active:translate-y-0"
              >
                Login Now
                <ArrowRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="py-10 bg-background border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="font-bold text-text">TeachMate</span>
          </div>
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} TeachMate. Built for educators.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
