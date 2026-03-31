import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { Clock, User, ArrowRight } from 'lucide-react';

const blogs = [
  {
    id: 1,
    title: "How AI Can Predict Teacher Burnout in Colleges",
    excerpt: "Discover how machine learning algorithms analyze workload and stress patterns to identify early signs of professional exhaustion in academic settings.",
    content: `
      <p>Teacher burnout is a growing crisis in modern education. With increasing administrative burdens, larger class sizes, and the pressure of continuous professional development, educators are reaching their breaking point. However, artificial intelligence (AI) offers a beacon of hope.</p>
      <h2>The Science of Prediction</h2>
      <p>By using <strong>Random Forest</strong> and <strong>Neural Network</strong> models, AI systems like TeachMate can analyze subtle shifts in behavioral data. These models look at indicators such as lecture frequency, attendance volatility, and even the speed of marks entry to create a baseline of typical behavior.</p>
      <h3>Early Warning Signs</h3>
      <ul>
        <li>Consistency in schedule adherence</li>
        <li>Engagement levels in digital platforms</li>
        <li>Syllabus completion rates over time</li>
      </ul>
      <p>When an AI detects a deviation from this baseline—perhaps a sudden drop in early-morning lecture efficiency or a delay in processing student feedback—it can flag a 'Moderate' risk of burnout. This allows institutional admins to intervene early with personalized support, rather than waiting for a resignation letter.</p>
      <h2>Conclusion</h2>
      <p>Predictive analytics isn't just about data; it's about people. By automating the detection of stress patterns, we can create a more sustainable academic ecosystem where teachers thrive and students succeed.</p>
    `,
    category: "AI in Education",
    date: "March 28, 2026",
    readTime: "8 min read",
    author: "Dr. Aris Thorne",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Smart Timetable Generation Using Algorithms",
    excerpt: "Explore the complexity of constraint-based scheduling and how genetic algorithms create the perfect, conflict-free college timetable in seconds.",
    content: `
      <p>Manual timetable creation is a mathematical nightmare. Between lab requirements, teacher availability, room capacities, and student batches, the number of potential conflicts is astronomical.</p>
      <h2>The Algorithmic Approach</h2>
      <p>Modern <strong>Timetable Generators</strong> use advanced constraint-satisfaction algorithms. Unlike human planners, these systems can evaluate thousands of permutations per second to find the 'Global Optimum'.</p>
      <h3>Handling Complex Constraints</h3>
      <p>TeachMate's engine specifically handles:</p>
      <ul>
        <li>Batch-wise Lab partitions</li>
        <li>Teacher-specific 'No-Lecture' zones</li>
        <li>Room equipment requirements (e.g., Projectors, PC Labs)</li>
      </ul>
      <p>By implementing <em>Genetic Algorithms</em>, the system 'evolves' a schedule through multiple generations, weeding out conflicts until a zero-collision result is achieved.</p>
    `,
    category: "Smart Timetable",
    date: "March 25, 2026",
    readTime: "10 min read",
    author: "Engr. Sam Rivers",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "Why Manual Timetable Creation Fails",
    excerpt: "A deep dive into the human errors that plague college scheduling and why automation is the only sustainable path for growing institutions.",
    content: `
      <p>Despite best efforts, human-made timetables almost always contain errors that aren't discovered until the second week of the semester. This leads to chaotic 'corrections' that disrupt the entire academic flow.</p>
      <h2>The Cost of Inefficiency</h2>
      <p>Every minute a room sits empty while a batch sits in a corridor is a loss of institutional value. Manual planning lacks the 'Bird's Eye View' needed to maximize resource utilization.</p>
    `,
    category: "Academic Automation",
    date: "March 20, 2026",
    readTime: "6 min read",
    author: "Prof. Elena Vance",
    image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 4,
    title: "Role of AI in Modern Education Systems",
    excerpt: "How automated tools are moving beyond simple recording to become active participants in student success and teacher wellness.",
    content: `
      <p>The classroom of 2026 is no longer just a physical space; it's a data environment. AI in education is transitioning from 'Cool Feature' to 'Total Requirement'.</p>
    `,
    category: "Smart College Systems",
    date: "March 15, 2026",
    readTime: "12 min read",
    author: "Dr. Sarah Chen",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 5,
    title: "Automating Academic Workflows with Technology",
    excerpt: "From attendance to marks entry, discover how reducing administrative friction unlocks more time for actual teaching and mentorship.",
    content: `
      <p>The average teacher spends 40% of their day on administrative tasks. We believe that technology should handle the paperwork so humans can handle the inspiration.</p>
    `,
    category: "Workflow Optimization",
    date: "March 10, 2026",
    readTime: "7 min read",
    author: "Marcus Aurelius",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800"
  }
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <div className="pt-44 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mb-24 mx-auto text-center"
        >
          <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-6 block">Knowledge Hub</span>
          <h1 className="text-5xl lg:text-8xl font-[900] tracking-tighter mb-8 leading-[0.9]">
            AI, <span className="text-gradient">Smart Systems</span> & Wellness
          </h1>
          <p className="text-xl lg:text-2xl text-text-muted leading-relaxed font-medium">
            Deep dives into the technology and psychology of modern academic management.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, idx) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-soft hover:shadow-hover transition-all duration-500 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-primary shadow-sm uppercase tracking-wider">
                    {blog.category}
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={14} /> {blog.readTime}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {blog.author}</span>
                </div>
                
                <h3 className="text-xl font-black mb-4 leading-snug group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-text-muted text-sm leading-relaxed mb-6 flex-grow">
                  {blog.excerpt}
                </p>

                <button className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest group/btn self-start">
                  Read Full Article
                  <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
