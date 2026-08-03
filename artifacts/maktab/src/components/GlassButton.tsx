import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  className?: string;
  variant?: 'default' | 'primary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    
    const variants = {
      default: "bg-white/20 dark:bg-white/10 border-white/40 dark:border-white/20 text-foreground hover:bg-white/30 dark:hover:bg-white/15",
      primary: "bg-indigo-500/80 dark:bg-indigo-600/80 border-indigo-400/50 text-white hover:bg-indigo-500/90 shadow-[0_0_15px_rgba(79,70,229,0.3)]",
      destructive: "bg-red-500/80 dark:bg-red-600/80 border-red-400/50 text-white hover:bg-red-500/90 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
      ghost: "bg-transparent border-transparent hover:bg-white/10 dark:hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-[12px]",
      md: "px-4 py-2 rounded-[16px]",
      lg: "px-6 py-3 text-lg rounded-[20px]",
      icon: "p-2 rounded-[16px]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "backdrop-blur-md saturate-[180%] border transition-all duration-200",
          "flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";
