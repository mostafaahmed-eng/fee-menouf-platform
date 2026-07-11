'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AiBadge from '@/components/ai/ai-badge';

interface CourseRecommendation {
  courseCode: string;
  courseNameAr: string;
  courseNameEn: string;
  credits: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  prerequisitesMet: boolean;
  conflictCheck: boolean;
}

interface CourseRecommendationsProps {
  recommendations: CourseRecommendation[];
}

export default function CourseRecommendations({ recommendations }: CourseRecommendationsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">التوصيات المقترحة</h3>
        <AiBadge size="sm" label="AI توصية" />
      </div>

      {recommendations.map((rec, i) => (
        <motion.div
          key={rec.courseCode}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.01 }}
          className={cn(
            'rounded-lg border p-4 transition-colors',
            rec.priority === 'high' && 'border-violet-200 bg-violet-50/50 dark:border-violet-800/30 dark:bg-violet-950/10',
            rec.priority === 'medium' && 'border-blue-200 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/10',
            rec.priority === 'low' && 'border-muted',
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                rec.priority === 'high' && 'bg-violet-100 dark:bg-violet-900/30',
                rec.priority === 'medium' && 'bg-blue-100 dark:bg-blue-900/30',
                rec.priority === 'low' && 'bg-muted',
              )}>
                <BookOpen className={cn(
                  'h-5 w-5',
                  rec.priority === 'high' && 'text-violet-600 dark:text-violet-400',
                  rec.priority === 'medium' && 'text-blue-600 dark:text-blue-400',
                )} />
              </div>
              <div>
                <p className="font-medium">{rec.courseNameAr}</p>
                <p className="text-xs text-muted-foreground">{rec.courseCode} - {rec.credits} وحدات</p>
                <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  rec.priority === 'high' && 'border-violet-200 text-violet-700 dark:text-violet-400',
                  rec.priority === 'medium' && 'border-blue-200 text-blue-700 dark:text-blue-400',
                )}
              >
                {rec.priority === 'high' ? 'موصى به بشدة' : rec.priority === 'medium' ? 'موصى به' : 'اختياري'}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            {rec.prerequisitesMet ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" /> المتطلبات مكتملة
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" /> المتطلبات غير مكتملة
              </span>
            )}
            {rec.conflictCheck ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" /> لا يوجد تعارض
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertCircle className="h-3 w-3" /> يوجد تعارض في الجدول
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
