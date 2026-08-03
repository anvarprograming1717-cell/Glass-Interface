import React, { useState } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListAnnouncements, 
  useCreateAnnouncement,
  getListAnnouncementsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth';
import { Megaphone, Plus, AlertCircle } from 'lucide-react';
import { AnnouncementInputPriority } from '@workspace/api-client-react';

export default function Announcements() {
  const { t } = useTranslation();
  const { role, userId } = useAuthStore();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' as AnnouncementInputPriority });

  const { data: announcements, isLoading } = useListAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const isManagement = role === 'director' || role === 'zavuch' || role === 'teacher';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    createAnnouncement.mutate({
      data: {
        title: formData.title,
        content: formData.content,
        authorId: userId,
        priority: formData.priority
      }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setFormData({ title: '', content: '', priority: 'normal' });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('announcements')}</h1>
        {isManagement && (
          <GlassButton onClick={() => setIsCreating(!isCreating)} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> New
          </GlassButton>
        )}
      </div>

      {isCreating && (
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required placeholder={t('title')}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <select 
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-black"
                value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <textarea 
              required placeholder={t('description')} rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none resize-none"
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <GlassButton type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t('cancel')}</GlassButton>
              <GlassButton type="submit" variant="primary">{t('save')}</GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center">{t('loading')}</div>
        ) : announcements?.length ? (
          announcements.map(announcement => (
            <GlassCard key={announcement.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={`mt-1 shrink-0 p-2 rounded-xl ${
                  announcement.priority === 'urgent' ? 'bg-red-500/20 text-red-500' :
                  announcement.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-indigo-500/20 text-indigo-500'
                }`}>
                  {announcement.priority === 'urgent' ? <AlertCircle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg">{announcement.title}</h3>
                    <span className="text-xs text-foreground/50">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">{announcement.authorName}</p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="p-8 text-center text-foreground/50">{t('no_data')}</div>
        )}
      </div>
    </div>
  );
}
