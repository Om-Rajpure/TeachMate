import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, User, 
  CheckSquare, ListChecks, ClipboardCheck, BarChart3, 
  Bell, FileText, LogOut
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { notificationService } from '../services/api';
import { useWebSockets } from '../hooks/useWebSockets';
import { useAuth } from '../context/AuthContext';
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
    { name: 'Lectures', icon: BookOpen, path: '/app/lectures' },
    { name: 'Attendance', icon: CheckSquare, path: '/app/attendance' },
    { name: 'Syllabus', icon: ListChecks, path: '/app/syllabus' },
    { name: 'Marks', icon: ClipboardCheck, path: '/app/marks' },
    { name: 'Analytics', icon: BarChart3, path: '/app/analytics' },
    { name: 'Resources', icon: FileText, path: '/app/resources' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.first_name || user?.username || 'Teacher';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white h-screen sticky top-0 border-r border-gray-100 p-6 z-20">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">T</div>
        <span className="font-bold text-xl tracking-tight text-text">TeachMate</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) => 
              cn(isActive ? "nav-item-active" : "nav-item")
            }
          >
            <item.icon size={20} />
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
    { name: 'Logs', icon: BookOpen, path: '/app/lectures' },
    { name: 'Attendance', icon: CheckSquare, path: '/app/attendance' },
    { name: 'Marks', icon: ClipboardCheck, path: '/app/marks' },
    { name: 'Stats', icon: BarChart3, path: '/app/analytics' },
    { name: 'Files', icon: FileText, path: '/app/resources' },
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
  
    const fetchUnread = useCallback(async () => {
       try {
         const res = await notificationService.getAll();
         setUnreadCount(res.data.filter(n => !n.is_read).length);
       } catch (err) {
         console.error(err);
       }
    }, []);
  
    useEffect(() => {
      fetchUnread();
    }, [fetchUnread]);
  
    useWebSockets(() => {
      fetchUnread();
    });

    const displayName = user?.first_name || user?.username || 'Teacher';
  
    const pageTitle = pathname === '/app/dashboard' ? 'Dashboard' 
                    : pathname === '/app/timetable' ? 'Timetable'
                    : pathname === '/app/lectures' ? 'Lecture Logs'
                    : pathname === '/app/attendance' ? 'Attendance'
                    : pathname === '/app/syllabus' ? 'Syllabus Planner'
                    : pathname === '/app/marks' ? 'Marks Management'
                    : pathname === '/app/analytics' ? 'Performance Analytics'
                    : pathname === '/app/resources' ? 'Resource Center'
                    : pathname === '/app/notifications' ? 'Notifications'
                    : 'TeachMate';
  
    return (
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 px-6 py-5 lg:px-10 border-b border-gray-100 lg:border-none flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-text">{pageTitle}</h1>
        <div className="flex items-center gap-6">
          <NavLink to="/app/notifications" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors text-text-muted hover:text-primary">
             <Bell size={24} />
             {unreadCount > 0 && (
               <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                 {unreadCount}
               </span>
             )}
          </NavLink>
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-100">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
               <User size={18} />
             </div>
             <span className="font-bold text-sm text-text">{displayName}</span>
          </div>
        </div>
      </header>
    );
  }
  
  const Layout = () => {
    return (
      <div className="flex min-h-screen bg-background text-text selection:bg-primary/10">
        <Sidebar />
        <main className="flex-1 pb-24 lg:pb-0 scroll-smooth">
          <Header />
          <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <MobileNav />
        <ToastContainer />
      </div>
    );
  };
  
export default Layout;
