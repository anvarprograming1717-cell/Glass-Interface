import React from 'react';
import { Sidebar, BottomNav } from '@/components/Navigation';
import { Header } from '@/components/Header';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const { role } = useAuthStore();
  const [location] = useLocation();

  // If not logged in, just show content (like login page)
  if (!role && location === '/login') {
    return (
      <main className="min-h-[100dvh] w-full relative">
        <Header />
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex bg-transparent">
      <Sidebar />
      <div className="flex-1 md:ml-[312px] p-4 md:p-6 pb-32 md:pb-6 relative w-full overflow-x-hidden">
        <Header />
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
