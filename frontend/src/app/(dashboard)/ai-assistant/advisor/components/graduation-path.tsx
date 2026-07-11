'use client';

import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GraduationPath as GraduationPathType } from '@/lib/types';

interface GraduationPathProps {
  path: GraduationPathType[];
  totalCredits: number;
  completedCredits: number;
  requiredCredits: number;
}

export default function GraduationPath({
  path,
  completedCredits,
  requiredCredits,
}: GraduationPathProps) {
  const progress = Math.round((completedCredits / requiredCredits) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">مسار التخرج</h3>
        <span className="text-xs text-muted-foreground">
          {completedCredits}/{requiredCredits} وحدة ({progress}%)
        </span>
      </div>

      <div className="relative">
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-muted-foreground/20" />

        <div className="space-y-6">
          {path.map((sem, i) => {
            const isCompleted = sem.isCurrent || i < path.findIndex((s) => s.isCurrent);
            const isCurrent = sem.isCurrent;

            return (
              <motion.div
                key={`${sem.academicYear}-${sem.semester}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative pr-10"
              >
                <div className="absolute right-2 top-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <Circle className="h-4 w-4 text-violet-500" />
                      <span className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-violet-500/30" />
                    </div>
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>

                <div className={cn(
                  'rounded-lg border p-3',
                  isCurrent && 'border-violet-200 bg-violet-50/50 dark:border-violet-800/30 dark:bg-violet-950/10',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">
                        {sem.semester === '1' ? 'الفصل الأول' : 'الفصل الثاني'}
                      </span>
                      <span className="mr-2 text-xs text-muted-foreground">
                        {sem.academicYear}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {sem.credits} وحدة
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sem.courses.map((course) => (
                      <span
                        key={course}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        {course}
                      </span>
                    ))}
                  </div>

                  {isCurrent && (
                    <Badge className="mt-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      الفصل الحالي
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-violet-500" />
        <p className="mt-2 text-sm font-medium">
          {progress >= 100
            ? 'مبروك! لقد أكملت جميع متطلبات التخرج 🎉'
            : `متبقي ${requiredCredits - completedCredits} وحدة حتى التخرج`}
        </p>
      </div>
    </div>
  );
}
