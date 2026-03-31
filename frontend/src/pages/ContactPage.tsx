import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { 
  FaInstagram, 
  FaYoutube, 
  FaGithub, 
  FaLinkedin, 
  FaGlobe 
} from 'react-icons/fa';

const ContactPage = () => {
  const socialCards = [
    {
      id: 'instagram',
      name: 'Instagram',
      text: 'Follow us for updates and reels',
      icon: FaInstagram,
      href: 'https://www.instagram.com/conceptsin5',
      color: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-200'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      text: 'Watch tutorials and project builds',
      icon: FaYoutube,
      href: 'https://www.youtube.com/@conceptsin5',
      color: 'from-red-500 to-red-700',
      shadow: 'shadow-red-200'
    },
    {
      id: 'github',
      name: 'GitHub',
      text: 'Explore our code and projects',
      icon: FaGithub,
      href: 'https://github.com/Om-Rajpure',
      color: 'from-gray-700 to-gray-900',
      shadow: 'shadow-gray-200'
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      text: 'View our work and services',
      icon: FaGlobe,
      href: 'https://conceptsin5.com/',
      color: 'from-blue-500 to-teal-500',
      shadow: 'shadow-blue-200'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      text: 'Connect professionally',
      icon: FaLinkedin,
      href: 'https://www.linkedin.com/in/om-rajpure',
      color: 'from-blue-600 to-blue-800',
      shadow: 'shadow-blue-300'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary selection:text-white">
      <PublicNavbar />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="bg-blob top-[-10%] right-[-10%] bg-blue-500/10" />
        <div className="bg-blob bottom-[-10%] left-[-10%] bg-purple-500/10" />
      </div>

      <main className="relative pt-44 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-6 block">Stay Connected</span>
            <h1 className="text-5xl lg:text-8xl font-[900] tracking-tighter leading-[0.9] text-text mb-8">
              Connect <span className="text-gradient">With Us</span>
            </h1>
            <p className="text-xl lg:text-2xl text-text-muted leading-relaxed font-medium">
              Reach out through your preferred platform. We're active across the web and love hearing from our community.
            </p>
          </motion.div>

          {/* Social Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {socialCards.map((card, idx) => (
              <motion.a
                key={card.id}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className={`group relative bg-white p-10 rounded-[3rem] border border-gray-100 shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center overflow-hidden`}
              >
                {/* Background Accent */}
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Icon Container */}
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center mb-8 shadow-lg group-hover:shadow-glow group-hover:scale-110 transition-all duration-500 transform group-hover:rotate-3`}>
                  <card.icon size={36} />
                </div>

                <h3 className="text-2xl font-black text-text mb-4 tracking-tight">{card.name}</h3>
                <p className="text-text-muted leading-relaxed font-bold text-sm mb-6 max-w-[200px]">
                  {card.text}
                </p>

                <div className="mt-auto px-6 py-2.5 rounded-full bg-gray-50 text-text-muted text-xs font-black uppercase tracking-widest border border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  Join Platform
                </div>
              </motion.a>
            ))}
          </div>

          {/* Optional Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-20 text-center"
          >
            <p className="text-text-muted font-bold tracking-tight bg-white/50 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20 shadow-sm">
              Prefer email? Reach us via <a href="https://www.linkedin.com/in/om-rajpure" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn messages</a>.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
