'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AiLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function AiLoadingSpinner({ size = 'md', className, text }: AiLoadingSpinnerProps) {
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <motion.span
            key={i}
            className={cn(
              'rounded-full bg-gradient-to-r from-violet-500 to-purple-500',
              dotSize,
            )}
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
