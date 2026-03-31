import { useNavigate } from 'react-router-dom';
import { 
  FaInstagram, 
  FaYoutube, 
  FaGithub, 
  FaLinkedin, 
  FaGlobe 
} from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Products', path: '/#products' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Contact', path: '/contact' },
  ];

  const socialLinks = [
    { icon: FaInstagram, href: 'https://www.instagram.com/conceptsin5', label: 'Instagram', color: 'hover:text-pink-600' },
    { icon: FaYoutube, href: 'https://www.youtube.com/@conceptsin5', label: 'YouTube', color: 'hover:text-red-600' },
    { icon: FaGithub, href: 'https://github.com/Om-Rajpure', label: 'GitHub', color: 'hover:text-gray-900' },
    { icon: FaGlobe, href: 'https://conceptsin5.com/', label: 'Portfolio', color: 'hover:text-blue-500' },
    { icon: FaLinkedin, href: 'https://www.linkedin.com/in/om-rajpure', label: 'LinkedIn', color: 'hover:text-blue-700' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 pb-12 border-b border-gray-50">
          
          {/* LEFT: Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer group shrink-0" 
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-card group-hover:scale-110 transition-transform duration-300">
              T
            </div>
            <span className="font-black text-2xl tracking-tighter text-text">TeachMate</span>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  if (link.path.startsWith('/#')) {
                    const id = link.path.substring(2);
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(link.path);
                  }
                }}
                className="text-sm font-bold text-text-muted hover:text-primary transition-all duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* RIGHT: Social Hub */}
          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.label}
                className={`text-text-muted ${social.color} transition-all duration-300 hover:scale-125 hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]`}
                aria-label={social.label}
              >
                <social.icon size={24} />
              </a>
            ))}
          </div>
        </div>

        {/* BOTTOM: Meta */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <p className="text-xs font-bold text-text-muted uppercase tracking-[0.25em]">
            © {currentYear} TeachMate. All Rights Reserved.
          </p>
          <div className="flex items-center gap-8">
            <button className="text-[10px] font-black text-text-muted hover:text-primary uppercase tracking-widest transition-colors">Privacy Policy</button>
            <button className="text-[10px] font-black text-text-muted hover:text-primary uppercase tracking-widest transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
