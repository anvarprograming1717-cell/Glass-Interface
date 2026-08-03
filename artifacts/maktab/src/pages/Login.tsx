import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/use-auth';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { UserRole } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

const roles: { value: UserRole, label: string }[] = [
  { value: 'director', label: 'director' },
  { value: 'zavuch', label: 'zavuch' },
  { value: 'teacher', label: 'teacher' },
  { value: 'student', label: 'student' },
  { value: 'parent', label: 'parent' },
];

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const login = useAuthStore(state => state.login);
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('password');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate user IDs based on role
    const mockIds: Record<UserRole, number> = {
      director: 1, zavuch: 2, teacher: 3, student: 4, parent: 5
    };
    login(selectedRole, mockIds[selectedRole]);
    setLocation('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <GlassCard className="w-full max-w-md p-8 pt-10">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mx-auto bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_30px_rgba(79,70,229,0.5)] mb-4"
          >
            M
          </motion.div>
          <h1 className="text-2xl font-bold">{t('app_name')}</h1>
          <p className="text-foreground/60 mt-2">{t('login')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">{t('role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <div 
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`
                    p-3 rounded-xl border cursor-pointer text-center text-sm transition-all
                    ${selectedRole === r.value 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'bg-white/10 dark:bg-black/10 border-white/20 text-foreground/70 hover:bg-white/20'}
                    ${r.value === 'director' ? 'col-span-2' : ''}
                  `}
                >
                  {t(r.label as any)}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-foreground placeholder:text-foreground/40"
                placeholder={t('username')}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-foreground placeholder:text-foreground/40"
                placeholder={t('password')}
              />
            </div>
          </div>

          <GlassButton type="submit" variant="primary" className="w-full py-3">
            {t('login')}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
