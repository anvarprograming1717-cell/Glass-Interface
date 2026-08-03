import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-white/15 dark:bg-white/8",
          "backdrop-blur-xl saturate-[180%]",
          "border border-white/30 dark:border-white/15",
          "rounded-[24px] shadow-lg overflow-hidden",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
