import React, { useState } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListUsers,
  useListClasses
} from '@workspace/api-client-react';
import { Search, Mail, Phone } from 'lucide-react';

export default function Directory({ type }: { type: 'student' | 'teacher' }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | undefined>();

  const { data: classes } = useListClasses();
  const { data: users, isLoading } = useListUsers({ 
    role: type,
    classId: selectedClass,
    search: search || undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{type === 'student' ? t('students') : t('teachers')}</h1>
        
        <div className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-9 pr-4 outline-none text-sm"
            />
          </div>
          {type === 'student' && (
            <select 
              className="bg-white/10 border-white/20 border rounded-xl px-3 py-2 outline-none text-sm w-32"
              value={selectedClass || ''}
              onChange={e => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="" className="text-black">All Classes</option>
              {classes?.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">{t('loading')}</div>
        ) : users?.length ? (
          users.map(user => (
            <GlassCard key={user.id} className="p-5 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 overflow-hidden mb-4 border-2 border-indigo-200 dark:border-indigo-800">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={user.firstName} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-foreground/60 mb-4">@{user.username}</p>
              
              <div className="flex items-center justify-center gap-2 w-full mt-auto">
                <GlassButton variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                  <Mail className="w-4 h-4" />
                </GlassButton>
                <GlassButton variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                  <Phone className="w-4 h-4" />
                </GlassButton>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-foreground/50">{t('no_data')}</div>
        )}
      </div>
    </div>
  );
}
