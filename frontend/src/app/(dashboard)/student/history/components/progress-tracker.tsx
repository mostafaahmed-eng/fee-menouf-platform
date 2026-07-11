'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Target, Award } from 'lucide-react';

interface ProgressTrackerProps {
  completedCredits?: number;
  requiredCredits?: number;
  cgpa?: number;
  isLoading?: boolean;
}

export default function ProgressTracker({
  completedCredits = 0,
  requiredCredits = 160,
  cgpa = 0,
  isLoading,
}: ProgressTrackerProps) {
  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  const percentage = Math.min(
    (completedCredits / requiredCredits) * 100,
    100,
  );
  const remaining = Math.max(requiredCredits - completedCredits, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            التقدم نحو التخرج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute text-2xl font-bold">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-card">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{completedCredits}</p>
              <p className="text-xs text-muted-foreground">مكتملة</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <Award className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{remaining}</p>
              <p className="text-xs text-muted-foreground">متبقية</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>إجمالي الساعات المطلوبة</span>
              <span className="font-medium">
                {completedCredits} / {requiredCredits}
              </span>
            </div>
            <Progress value={percentage} className="h-2.5" />
          </div>

          {cgpa > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-card">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm">
                المعدل التراكمي:{' '}
                <span className="font-bold text-lg">{cgpa.toFixed(2)}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
