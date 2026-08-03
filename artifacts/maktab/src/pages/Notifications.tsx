import React from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListNotifications, 
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Info, AlertTriangle, MessageSquare, BookOpen } from 'lucide-react';

export default function Notifications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'assignment': return <BookOpen className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('notifications')}</h1>
        <GlassButton onClick={handleMarkAllRead} variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400">
          <Check className="w-4 h-4" /> {t('mark_all_read')}
        </GlassButton>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center">{t('loading')}</div>
        ) : notifications?.length ? (
          notifications.map(notification => (
            <GlassCard 
              key={notification.id} 
              className={`p-4 flex gap-4 cursor-pointer transition-all ${!notification.isRead ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'opacity-70'}`}
              onClick={() => !notification.isRead && handleMarkRead(notification.id)}
            >
              <div className="mt-1 shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-foreground/50 whitespace-nowrap ml-4">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {notification.body && (
                  <p className="text-sm text-foreground/70">{notification.body}</p>
                )}
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
              )}
            </GlassCard>
          ))
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center text-foreground/50">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p>{t('no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
