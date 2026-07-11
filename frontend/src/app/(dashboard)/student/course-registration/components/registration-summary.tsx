'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { RegistrationSummary } from '@/lib/types';

interface RegistrationSummaryProps {
  summary?: RegistrationSummary;
  isLoading?: boolean;
}

const statusConfig = {
  draft: { label: 'مسودة', color: 'bg-gray-500', icon: Clock },
  pending: { label: 'قيد المراجعة', color: 'bg-amber-500', icon: Clock },
  approved: { label: 'تم الاعتماد', color: 'bg-emerald-500', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-500', icon: AlertCircle },
};

export default function RegistrationSummarySidebar({
  summary,
  isLoading,
}: RegistrationSummaryProps) {
  const { direction } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const StatusIcon = statusConfig[summary.status].icon;
  const statusInfo = statusConfig[summary.status];
  const creditsPercentage = (summary.totalCredits / summary.maxCredits) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            ملخص التسجيل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5" dir={direction}>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">
              {summary.totalCredits}
            </p>
            <p className="text-sm text-muted-foreground">
              من أصل {summary.maxCredits} ساعة معتمدة
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>الساعات المعتمدة</span>
              <span>
                {summary.totalCredits} / {summary.maxCredits}
              </span>
            </div>
            <Progress value={creditsPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span>عدد المقررات</span>
            <span className="font-medium">{summary.coursesCount}</span>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm">حالة الطلب</span>
              <Badge
                variant="secondary"
                className={`${statusInfo.color} text-white`}
              >
                <StatusIcon className="h-3 w-3 ml-1 inline" />
                {statusInfo.label}
              </Badge>
            </div>
            {summary.approvalNote && (
              <p className="text-xs text-muted-foreground mt-2">
                {summary.approvalNote}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
