import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Bell, CheckCircle2, MessageSquare, AlertCircle, 
  Briefcase, FileText, CheckSquare, Trash2, 
  Filter, Check
} from 'lucide-react';
import { notificationsApi, type Notification } from '../services/notificationsApi';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingState, ErrorState } from '../components/ui/States';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.list(100);
      setNotifications(data);
    } catch (err) {
      setError('Bildirimler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment_added': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'task_assigned': return <CheckSquare className="w-5 h-5 text-emerald-500" />;
      case 'task_overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'job_status_changed': return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'offer_converted': return <FileText className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.entity_type && notification.entity_id) {
      const routes: Record<string, string> = {
        'customer': `/customers/${notification.entity_id}`,
        'job': `/jobs/${notification.entity_id}`,
        'task': `/tasks`,
        'offer': `/offers`,
      };
      const path = routes[notification.entity_type];
      if (path) navigate(path);
    }
  };

  if (isLoading) return <LoadingState message="Bildirimler yükleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchNotifications} />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Bildirimler</h1>
          <p className="text-text-body mt-1">Sizinle ilgili tüm güncellemeler ve hatırlatıcılar.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Tümünü Okundu İşaretle
            </Button>
          )}
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filtrele
          </Button>
        </div>
      </div>

      <Card noPadding>
        {notifications.length === 0 ? (
          <div className="p-20 text-center text-text-body italic">
            <Bell className="w-12 h-12 text-border mx-auto mb-4" />
            <p>Henüz bildirim bulunmuyor.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 flex gap-4 hover:bg-surface-dim/30 transition-all cursor-pointer group relative ${!n.is_read ? 'bg-primary/5' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className={`p-3 rounded-2xl flex-shrink-0 h-fit ${!n.is_read ? 'bg-white shadow-sm ring-1 ring-primary/10' : 'bg-surface-dim'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-text-high' : 'font-medium text-text-body'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] font-bold text-text-body/60 uppercase">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-text-high' : 'text-text-body'}`}>
                    {n.message}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    {n.actor_name && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {n.actor_name.substring(0, 1)}
                        </div>
                        <span className="text-[10px] font-bold text-text-body uppercase">{n.actor_name}</span>
                      </div>
                    )}
                    {n.entity_type && (
                      <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">
                        {n.entity_type} #{n.entity_id}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.is_read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      className="p-2 bg-white rounded-xl shadow-sm border border-border hover:text-primary transition-colors"
                      title="Okundu İşaretle"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="p-2 bg-white rounded-xl shadow-sm border border-border hover:text-red-500 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
