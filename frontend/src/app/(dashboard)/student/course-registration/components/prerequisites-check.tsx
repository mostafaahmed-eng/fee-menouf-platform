'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { CoursePrerequisite } from '@/lib/types';

interface PrerequisitesCheckProps {
  prerequisites: CoursePrerequisite[];
}

export default function PrerequisitesCheck({
  prerequisites,
}: PrerequisitesCheckProps) {
  const { direction } = useTranslation();
  if (!prerequisites || prerequisites.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>لا توجد متطلبات سابقة</span>
      </div>
    );
  }

  const allCompleted = prerequisites.every((p) => p.isCompleted);

  return (
    <div className="space-y-2" dir={direction}>
      <p className="text-sm font-medium flex items-center gap-1">
        <span>المتطلبات السابقة</span>
        {allCompleted ? (
          <Badge variant="outline" className="text-emerald-600 border-emerald-400 text-xs">
            مكتملة
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-400 text-xs">
            غير مكتملة
          </Badge>
        )}
      </p>
      <div className="space-y-1.5">
        {prerequisites.map((p, i) => (
          <motion.div
            key={p.courseId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 text-sm"
          >
            {p.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={p.isCompleted ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400'}>
              {p.courseName}
            </span>
            <span className="text-xs text-muted-foreground">({p.courseCode})</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
