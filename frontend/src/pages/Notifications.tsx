import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Clock,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/api';
import type { Notification } from '../types';

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Reminder': return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'Warning': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
      default: return { icon: Info, color: 'text-orange-500', bg: 'bg-orange-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-text">Intelligent Alerts</h2>
           <p className="text-text-muted font-medium">Stay updated with real-time academic reminders.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <CheckCheck size={18} /> Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 py-20 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Bell size={32} />
             </div>
             <p className="text-text-muted font-bold">No notifications yet.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notification, index) => {
              const styles = getTypeStyles(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-6 rounded-[2rem] border transition-all flex items-start gap-5 group ${
                    notification.is_read 
                      ? 'bg-white border-gray-100 opacity-70' 
                      : 'bg-white border-primary/20 shadow-lg shadow-primary/5'
                  }`}
                >
                  <div className={`p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${styles.bg} ${styles.color}`}>
                    <styles.icon size={24} />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                       <h4 className="font-bold text-lg text-text">{notification.title}</h4>
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className="text-text-muted text-sm leading-relaxed">{notification.message}</p>
                    
                    {!notification.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                         Mark as read <CheckCircle2 size={12} />
                      </button>
                    )}
                  </div>

                  {!notification.is_read && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                       <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
