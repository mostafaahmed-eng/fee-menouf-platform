'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, TrendingDown, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FacultyCourse {
  id: string;
  nameAr: string;
}

interface AnalyticsSummary {
  avgPerformance: number;
  avgAttendance: number;
  failRate: number;
  totalStudents: number;
  performanceChange: number;
  attendanceChange: number;
  failRateChange: number;
}

export default function AnalyticsPage() {
  const { direction } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data: courses } = useQuery<FacultyCourse[]>({
    queryKey: ['faculty', 'courses'],
    queryFn: () => api.get('/courses').then((r) => r.data.data),
  });

  useEffect(() => {
    if (courses?.length && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses]);

  const courseId = selectedCourse || courses?.[0]?.id;

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery<AnalyticsSummary>({
    queryKey: ['faculty', 'analytics', 'summary', courseId],
    queryFn: () => api.get(`/analytics/course/${courseId}`).then((r) => r.data.data),
    enabled: !!courseId,
  });

  return (
    <div className="space-y-6 p-4 md:p-6" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">التحليلات والتقارير</h1>
            <p className="text-muted-foreground">تحليل أداء الطلاب واتجاهات الحضور</p>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : summaryError ? (
          <Card className="lg:col-span-4">
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">فشل تحميل الملخص</p>
              <Button variant="outline" size="sm" onClick={() => refetchSummary()}><RefreshCw className="h-3 w-3 ml-1" /> إعادة المحاولة</Button>
            </CardContent>
          </Card>
        ) : summary ? (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">متوسط الأداء</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.avgPerformance}%</p>
                  <Badge variant="secondary" className={summary.performanceChange >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                    {summary.performanceChange >= 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                    {summary.performanceChange >= 0 ? '+' : ''}{summary.performanceChange}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">متوسط الحضور</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{summary.avgAttendance}%</p>
                  <Badge variant="secondary" className={summary.attendanceChange >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                    {summary.attendanceChange >= 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                    {summary.attendanceChange >= 0 ? '+' : ''}{summary.attendanceChange}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">نسبة الرسوب</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-destructive">{summary.failRate}%</p>
                  <Badge variant="secondary" className={
                    summary.failRateChange > 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }>
                    {summary.failRateChange > 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                    {summary.failRateChange > 0 ? '+' : ''}{summary.failRateChange}%
                  </Badge>
                </div>
                <Progress value={summary.failRate} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{summary.totalStudents}</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

    </div>
  );
}
