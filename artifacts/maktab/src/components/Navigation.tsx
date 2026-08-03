import React from 'react';
import { Link, useLocation } from 'wouter';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { useTranslation } from '@/i18n/use-translation';
import { useAuthStore } from '@/store/use-auth';
import { 
  LayoutDashboard, GraduationCap, CheckSquare, FileText, 
  Megaphone, MessageSquare, Bell, Users, UsersRound, Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslationKey } from '@/i18n/translations';

interface NavItem {
  icon: React.ElementType;
  label: TranslationKey;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'dashboard', path: '/', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: GraduationCap, label: 'grades', path: '/grades', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: CheckSquare, label: 'attendance', path: '/attendance', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: FileText, label: 'assignments', path: '/assignments', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: Megaphone, label: 'announcements', path: '/announcements', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: MessageSquare, label: 'messages', path: '/messages', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: Bell, label: 'notifications', path: '/notifications', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
  { icon: Users, label: 'students', path: '/students', roles: ['director', 'zavuch'] },
  { icon: UsersRound, label: 'teachers', path: '/teachers', roles: ['director', 'zavuch'] },
  { icon: Settings, label: 'settings', path: '/settings', roles: ['director', 'zavuch', 'teacher', 'student', 'parent'] },
];

export function Sidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { role } = useAuthStore();

  const allowedItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <GlassCard className="hidden md:flex flex-col w-[280px] h-[calc(100vh-2rem)] fixed top-4 left-4 p-4 z-40">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(79,70,229,0.5)]">
          M
        </div>
        <h1 className="font-bold text-lg leading-tight tracking-tight">
          Maktab<br/>Raqamli
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide pb-20">
        {allowedItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-[16px] cursor-pointer transition-all duration-200",
                  isActive 
                    ? "bg-white/30 dark:bg-white/15 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm" 
                    : "text-foreground/80 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{t(item.label)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function BottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { role } = useAuthStore();

  // Pick top 5 based on role for bottom nav
  const allowedItems = navItems.filter(item => role && item.roles.includes(role));
  const mobileItems = allowedItems.slice(0, 5);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6">
      <GlassCard className="flex items-center justify-between p-2 rounded-[24px]">
        {mobileItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center justify-center p-2 min-w-[60px] cursor-pointer">
                <div className={cn(
                  "p-2 rounded-[14px] transition-all",
                  isActive ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-foreground/60"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-all",
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-foreground/60"
                )}>
                  {t(item.label)}
                </span>
              </div>
            </Link>
          );
        })}
      </GlassCard>
    </div>
  );
}
