import React from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { useAuthStore } from '@/store/use-auth';
import { 
  useGetDashboardStats, 
  useGetRecentActivity, 
  useGetPredictions 
} from '@workspace/api-client-react';
import { 
  Users, GraduationCap, Building2, TrendingUp, 
  AlertTriangle, BrainCircuit, Activity 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const { role } = useAuthStore();
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activities } = useGetRecentActivity();
  const { data: predictions } = useGetPredictions();

  if (statsLoading) {
    return <div className="p-8 text-center">{t('loading')}</div>;
  }

  const statCards = [
    { label: t('total_students'), value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('total_teachers'), value: stats?.totalTeachers || 0, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: t('total_classes'), value: stats?.totalClasses || 0, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: t('avg_grade'), value: stats?.averageGrade?.toFixed(1) || '0.0', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <GlassCard key={i} className="p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-foreground/60 font-medium">{card.label}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col min-h-[300px]">
          <h3 className="font-semibold mb-6">{t('grades')} - {t('recent_activity')}</h3>
          <div className="flex-1 w-full h-full min-h-[200px]">
            {stats?.gradesBySubject && stats.gradesBySubject.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gradesBySubject}>
                  <XAxis dataKey="subjectName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} domain={[0, 5]} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', color: 'white' }}
                  />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                    {stats.gradesBySubject.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(238 84% ${67 - (index * 5)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-foreground/40">{t('no_data')}</div>
            )}
          </div>
        </GlassCard>

        {/* AI Predictions */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold">{t('ai_predictions')}</h3>
            </div>
            <div className="space-y-3">
              {predictions?.length ? predictions.slice(0,3).map(pred => (
                <div key={pred.id} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{pred.studentName}</span>
                  </div>
                  <p className="opacity-80">{pred.description}</p>
                </div>
              )) : (
                <p className="text-sm text-foreground/50">{t('no_data')}</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold">{t('recent_activity')}</h3>
            </div>
            <div className="space-y-4">
              {activities?.length ? activities.slice(0,4).map(act => (
                <div key={act.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{act.description}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">{new Date(act.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-foreground/50">{t('no_data')}</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
