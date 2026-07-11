'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function AiBadge({ size = 'sm', className, label }: AiBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 px-3 py-1 text-xs font-medium text-violet-700 dark:from-violet-500/30 dark:to-purple-500/30 dark:text-violet-300',
        size === 'md' && 'px-4 py-1.5 text-sm',
        size === 'lg' && 'px-5 py-2 text-base',
        className,
      )}
    >
      <Sparkles className={cn('h-3 w-3', size === 'md' && 'h-4 w-4', size === 'lg' && 'h-5 w-5')} />
      <span>{label || 'AI Powered'}</span>
    </motion.span>
  );
}
