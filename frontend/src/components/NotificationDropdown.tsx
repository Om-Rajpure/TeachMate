import { motion } from 'framer-motion';
import { 
  Bell, Check, 
  Users, AlertTriangle, 
  BookOpen, CheckCircle2, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationService } from '../services/api';
import { toast } from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'lecture_reminder' | 'attendance_alert' | 'marks_alert' | 'syllabus_alert' | 'system_alert';
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onRefresh: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onRefresh }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'lecture_reminder': return <Clock className="text-blue-500" size={18} />;
      case 'attendance_alert': return <Users className="text-amber-500" size={18} />;
      case 'marks_alert': return <AlertTriangle className="text-rose-500" size={18} />;
      case 'syllabus_alert': return <BookOpen className="text-purple-500" size={18} />;
      case 'system_alert': return <CheckCircle2 className="text-emerald-500" size={18} />;
      default: return <Bell className="text-gray-400" size={18} />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'marks_alert': return 'border-l-4 border-rose-500 bg-rose-50/30';
      case 'attendance_alert': return 'border-l-4 border-amber-500 bg-amber-50/30';
      default: return 'border-l-4 border-transparent';
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      onRefresh();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      onRefresh();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
    >
      <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0">
        <div>
          <h3 className="font-black text-text text-lg tracking-tight">Notifications</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-0.5">Stay Updated</p>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
        >
          <Check size={12} /> Mark all read
        </button>
      </div>

      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-300" size={24} />
            </div>
            <p className="text-sm font-bold text-text-muted italic">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                className={`p-5 transition-colors hover:bg-gray-50/80 relative group ${getTypeStyles(notif.type)} ${!notif.is_read ? 'bg-blue-50/20' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text leading-tight mb-1 truncate">{notif.title}</span>
                      <span className="text-xs text-text-muted font-medium line-clamp-2 leading-relaxed">{notif.message}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-tighter">
                         {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                       </span>
                       {!notif.is_read && (
                         <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                       )}
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-primary hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-gray-100"
                  >
                    <Check size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
        <button 
          onClick={onClose}
          className="text-xs font-black text-text-muted hover:text-text uppercase tracking-widest transition-colors"
        >
          Close Panel
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
