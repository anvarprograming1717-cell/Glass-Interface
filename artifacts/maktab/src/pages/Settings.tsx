import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useAuthStore } from '@/store/use-auth';
import { useLocation } from 'wouter';
import { LogOut, Monitor, Moon, Sun, Globe } from 'lucide-react';
import { useGetMe } from '@workspace/api-client-react';

export default function Settings() {
  const { t, lang, setLang } = useTranslation();
  const { logout } = useAuthStore();
  const [, setLocation] = useLocation();
  const { data: me, isError } = useGetMe({ query: { retry: false } });

  const displayUser = isError || !me ? {
    firstName: "Demo",
    lastName: "User",
    username: "demo_user",
    role: role || 'student'
  } : me;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('maktab-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('maktab-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>

      <GlassCard className="p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-indigo-500/20 overflow-hidden border-4 border-indigo-200 dark:border-indigo-800 shrink-0">
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayUser.role || 'default'}`} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{displayUser.firstName} {displayUser.lastName}</h2>
            <p className="text-foreground/60 capitalize mt-1">{t(displayUser.role as any) || displayUser.role}</p>
            <p className="text-sm font-mono mt-1 opacity-70">@{displayUser.username}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Appearance */}
          <section>
            <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Appearance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                  theme === 'light' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="font-medium">{t('light')}</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                  theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="font-medium">{t('dark')}</span>
              </button>
            </div>
          </section>

          {/* Language */}
          <section>
            <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t('language')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={`p-3 rounded-xl border text-center font-medium transition-all ${
                    lang === l ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'
                  }`}
                >
                  {l === 'uz' ? "O'zbek" : l === 'ru' ? "Русский" : "English"}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-6 border-t border-white/10">
            <GlassButton onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
              <LogOut className="w-4 h-4" /> {t('logout')}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
