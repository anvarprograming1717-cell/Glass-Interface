import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { useTranslation } from '@/i18n/use-translation';
import { Language } from '@/i18n/translations';
import { Bell, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth';
import { Link } from 'wouter';

export function Header() {
  const { lang, setLang } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('maktab-theme') as 'light' | 'dark') || 'light';
  });

  const { role } = useAuthStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('maktab-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const langs: { id: Language; label: string }[] = [
    { id: 'uz', label: 'O\'z' },
    { id: 'ru', label: 'Рус' },
    { id: 'en', label: 'En' },
  ];

  return (
    <header className="sticky top-4 z-30 flex items-center justify-end md:justify-between mb-8 px-4 md:px-0">
      <div className="hidden md:block" /> {/* Spacer for flex-between */}
      
      <div className="flex items-center gap-3">
        <GlassCard className="flex items-center p-1 rounded-full !rounded-[100px] border-none shadow-sm">
          {langs.map(l => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-[100px] transition-all ${
                lang === l.id 
                  ? 'bg-white/40 dark:bg-white/20 text-foreground shadow-sm' 
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {l.label}
            </button>
          ))}
        </GlassCard>

        <GlassButton variant="ghost" size="icon" onClick={toggleTheme} className="!rounded-full">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </GlassButton>

        {role && (
          <Link href="/notifications">
            <GlassButton variant="ghost" size="icon" className="!rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </GlassButton>
          </Link>
        )}
        
        {role && (
          <Link href="/settings">
            <GlassButton variant="ghost" size="icon" className="!rounded-full ml-1 overflow-hidden p-0 border-2 border-indigo-200 dark:border-indigo-800">
               <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${role}`} alt="Avatar" className="w-full h-full object-cover" />
            </GlassButton>
          </Link>
        )}
      </div>
    </header>
  );
}
