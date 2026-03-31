import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';

const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Products', path: '/#products' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      if (location.pathname === '/') {
        const id = path.substring(2);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-glass border-b border-gray-100/50 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-card group-hover:scale-110 transition-transform">
            T
          </div>
          <span className="font-black text-2xl tracking-tighter text-text">TeachMate</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.path)}
              className="text-sm font-bold text-text-muted hover:text-primary transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </button>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-gradient px-6 py-2.5 text-sm flex items-center gap-2"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-text"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.path)}
                  className="text-lg font-bold text-text text-left"
                >
                  {link.name}
                </button>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 text-center font-bold text-primary bg-primary/5 rounded-2xl"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn-gradient py-4 text-center font-bold"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default PublicNavbar;
