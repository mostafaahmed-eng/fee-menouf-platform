'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AiBadge from './ai-badge';

interface ResultCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showBadge?: boolean;
  delay?: number;
}

export default function ResultCard({
  title,
  description,
  children,
  className,
  showBadge = true,
  delay = 0,
}: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn('border-violet-200/50 dark:border-violet-800/30', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {showBadge && <AiBadge size="sm" />}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}
