import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, User, 
  CheckSquare, ListChecks, BarChart3, 
  Bell, LogOut, Calendar, GraduationCap, FolderOpen
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { name: 'Timetable', icon: Calendar, path: '/app/timetable' },
    { name: 'Students', icon: Users, path: '/app/students' },
    { name: 'Attendance', icon: CheckSquare, path: '/app/attendance' },
    { name: 'Marks', icon: GraduationCap, path: '/app/marks' },
    { name: 'Syllabus', icon: ListChecks, path: '/app/syllabus' },
    { name: 'Resources', icon: FolderOpen, path: '/app/resources' },
    { name: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.first_name || user?.username || 'Teacher';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white fixed left-0 top-0 h-full border-r border-gray-100 p-6 z-40 shadow-sm">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">T</div>
        <span className="font-bold text-xl tracking-tight text-text">TeachMate</span>
      </div>
      
      <nav className="flex-1 space-y-1.5 font-bold">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) => 
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                isActive 
                  ? "bg-blue-50 text-primary shadow-sm" 
                  : "text-text-muted hover:bg-gray-50 hover:text-text"
              )
            }
          >
            <item.icon size={20} className="transition-transform group-hover:scale-110" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-medium text-sm text-text truncate">{displayName}</p>
            <p className="text-xs text-text-muted truncate">{user?.email || 'Professor'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const navItems = [
    { name: 'Home', icon: LayoutDashboard, path: '/app/dashboard' },
    { name: 'Time', icon: Calendar, path: '/app/timetable' },
    { name: 'Students', icon: Users, path: '/app/students' },
    { name: 'Attend', icon: CheckSquare, path: '/app/attendance' },
    { name: 'Resources', icon: FolderOpen, path: '/app/resources' },
    { name: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 lg:hidden px-6 py-3 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) => 
              cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-text-muted")
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    );
  };
  
  const Header = () => {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    const fetchNotifications = useCallback(async () => {
       try {
          const res = await notificationService.getAll();
          const latestNotifications = res.data;
          setNotifications(latestNotifications);
          
          const countRes = await notificationService.getUnreadCount();
          const newCount = countRes.data.unread_count;

          // Browser Notification Trigger
          if (newCount > unreadCount && Notification.permission === 'granted' && unreadCount > 0) {
             const newItems = latestNotifications.filter((n: any) => !n.is_read);
             if (newItems.length > 0) {
                new window.Notification(newItems[0].title, {
                   body: newItems[0].message,
                });
             }
          }
          
          setUnreadCount(newCount);
       } catch (err) {
         console.error(err);
       }
    }, [unreadCount]);
  
    useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      
      // Request Browser Notification Permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    const displayName = user?.first_name || user?.username || 'Teacher';
  
    const pageTitle = pathname === '/app/dashboard' ? 'Overview' 
                    : pathname === '/app/timetable' ? 'Weekly Schedule'
                    : pathname.startsWith('/app/students') ? 'Student Directory'
                    : pathname === '/app/attendance' ? 'Attendance Tracking'
                    : pathname === '/app/syllabus' ? 'Syllabus Planner'
                    : pathname === '/app/marks' ? 'Marks Management'
                    : pathname === '/app/analytics' ? 'Performance Insights'
                    : pathname === '/app/resources' ? 'Resource Center'
                    : pathname === '/app/notifications' ? 'Notifications'
                    : 'TeachMate';
  
    return (
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/80 backdrop-blur-md z-30 px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-black text-text italic tracking-tighter leading-tight">{pageTitle}</h1>
        <div className="flex items-center gap-6">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 text-text-muted hover:text-primary active:scale-90"
            >
               <Bell size={24} />
               <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {unreadCount}
                  </motion.span>
                )}
               </AnimatePresence>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <NotificationDropdown 
                  notifications={notifications}
                  onClose={() => setShowDropdown(false)}
                  onRefresh={fetchNotifications}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-100">
             <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shadow-sm group hover:scale-105 transition-transform duration-300">
               <User size={18} className="group-hover:scale-110 transition-transform" />
             </div>
             <div className="flex flex-col">
               <span className="font-bold text-xs text-text leading-tight">{displayName}</span>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Professor</span>
             </div>
          </div>
        </div>
      </header>
    );
  }
  
  const Layout = () => {
    return (
      <div className="flex h-screen overflow-hidden bg-background text-text selection:bg-primary/10">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 mt-16 p-6 overflow-y-auto custom-scrollbar pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    );
  };
  
export default Layout;
