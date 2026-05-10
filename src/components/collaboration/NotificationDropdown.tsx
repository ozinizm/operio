import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Briefcase, FileText, CheckSquare, Clock, Loader2 } from 'lucide-react';
import { notificationsApi, type Notification } from '../../services/notificationsApi';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../ui/Toast';

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Ref to track last seen notification ID to prevent duplicate toasts
  const lastSeenIdRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    fetchData(true);
    // Poll for notifications every 15 seconds
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isInitial = false) => {
    try {
      // 1. Get count
      const { count } = await notificationsApi.getUnreadCount();
      
      // 2. If count increased or it's initial load, check for the latest notification
      if (isInitial || count > 0) {
        const latest = await notificationsApi.list(1);
        if (latest && latest.length > 0) {
          const newest = latest[0];
          
          // Show toast only if:
          // - Not the very first load of the app (prevent old notification spam)
          // - ID is newer than what we last saw
          // - It's unread
          if (!isInitialLoadRef.current && 
              lastSeenIdRef.current !== null && 
              newest.id > lastSeenIdRef.current && 
              !newest.is_read) {
            showToast(newest.title || 'Yeni bildirim', 'info');
          }
          
          lastSeenIdRef.current = newest.id;
        }
      }

      setUnreadCount(count);
      isInitialLoadRef.current = false;
    } catch (err) {
      console.error('Failed to fetch notification data:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.list(10);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'task_assigned': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'task_status_changed': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'task_overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'job_status_changed': return <Briefcase className="w-4 h-4 text-amber-500" />;
      case 'offer_converted': return <FileText className="w-4 h-4 text-indigo-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Route based on entity
    if (notification.entity_type && notification.entity_id) {
      const routes: Record<string, string> = {
        'customer': `/customers/${notification.entity_id}`,
        'job': `/jobs/${notification.entity_id}`,
        'task': `/tasks`, // For now, maybe direct link later
        'offer': `/offers`,
      };
      const path = routes[notification.entity_type];
      if (path) navigate(path);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className={`p-2 rounded-xl transition-all relative group ${isOpen ? 'bg-surface-dim text-text-high' : 'text-text-body hover:bg-surface-dim hover:text-text-high'}`}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'group-hover:shake' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white animate-in zoom-in duration-300">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-modal z-50 animate-in zoom-in-95 duration-100 flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-jakarta font-bold text-sm text-text-high">Bildirimler</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-text-body italic text-sm">Henüz bildirim bulunmuyor.</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 border-b border-border/50 hover:bg-surface-dim/30 transition-colors cursor-pointer flex gap-3 relative ${!n.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 h-fit ${!n.is_read ? 'bg-white shadow-sm' : 'bg-surface-dim'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-xs ${!n.is_read ? 'font-bold text-text-high' : 'font-medium text-text-body'}`}>{n.title}</p>
                    <p className="text-[11px] text-text-body leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-text-body/60" />
                      <span className="text-[10px] text-text-body/60">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}</span>
                    </div>
                  </div>
                  {!n.is_read && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full absolute right-4 top-4"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border bg-surface-dim/20 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-text-body hover:text-primary transition-colors"
            >
              Tüm Bildirimleri Gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

