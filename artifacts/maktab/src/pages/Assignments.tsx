import React, { useState } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListAssignments, 
  useCreateAssignment,
  useListClasses,
  useListSubjects,
  getListAssignmentsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth';
import { Calendar, Plus, Clock } from 'lucide-react';

export default function Assignments() {
  const { t } = useTranslation();
  const { role, userId } = useAuthStore();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', classId: '', subjectId: '', dueDate: ''
  });

  const { data: assignments, isLoading } = useListAssignments();
  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const createAssignment = useCreateAssignment();

  const isTeacherView = role === 'teacher' || role === 'director' || role === 'zavuch';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    createAssignment.mutate({
      data: {
        title: formData.title,
        description: formData.description,
        classId: Number(formData.classId),
        subjectId: Number(formData.subjectId),
        teacherId: userId,
        dueDate: new Date(formData.dueDate).toISOString()
      }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setFormData({ title: '', description: '', classId: '', subjectId: '', dueDate: '' });
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('assignments')}</h1>
        {isTeacherView && (
          <GlassButton onClick={() => setIsCreating(!isCreating)} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> {t('create_assignment')}
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
              <input 
                type="datetime-local" required
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-foreground"
                value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
              <select 
                required className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-black"
                value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}
              >
                <option value="">Select Class</option>
                {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                required className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-black"
                value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}
              >
                <option value="">Select Subject</option>
                {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <textarea 
              placeholder={t('description')} rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none resize-none"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <GlassButton type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t('cancel')}</GlassButton>
              <GlassButton type="submit" variant="primary">{t('save')}</GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">{t('loading')}</div>
        ) : assignments?.length ? (
          assignments.map(assignment => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            return (
              <GlassCard key={assignment.id} className="p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {assignment.subjectName}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-foreground/60'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{assignment.title}</h3>
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2 flex-1">
                  {assignment.description}
                </p>
                {!isTeacherView && (
                  <GlassButton className="w-full mt-auto" size="sm">
                    Submit Work
                  </GlassButton>
                )}
              </GlassCard>
            )
          })
        ) : (
          <div className="col-span-full p-8 text-center text-foreground/50">{t('no_data')}</div>
        )}
      </div>
    </div>
  );
}
