'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/use-translation';
import { History, BookOpen, GraduationCap, Award, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { AcademicHistory, AcademicSemester } from '@/lib/types';
import { useMemo } from 'react';

export default function AcademicHistoryPage() {
  const { direction } = useTranslation();
  const { user } = useAuth();
  const studentId = user?.student?.id;

  const { data: history, isLoading } = useQuery<AcademicHistory>({
    queryKey: ['student', 'history', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/grades/transcript/${studentId}`);
      return data.data;
    },
    enabled: !!studentId,
  });

  const { data: analytics } = useQuery({
    queryKey: ['student', 'analytics', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/student/${studentId}`);
      return data.data;
    },
    enabled: !!studentId,
  });

  const progressPercentage = useMemo(() => {
    if (!history) return 0;
    return Math.round((history.completedCredits / history.requiredCredits) * 100);
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6"
      dir={direction}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">السجل الأكاديمي</h1>
        <p className="text-muted-foreground">السجل الدراسي الكامل والتقدم الأكاديمي</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{history?.cgpa?.toFixed(2) || '—'}</p>
            <p className="text-xs text-muted-foreground">المعدل التراكمي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{history?.totalCredits || 0}</p>
            <p className="text-xs text-muted-foreground">إجمالي الوحدات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{history?.completedCredits || 0}</p>
            <p className="text-xs text-muted-foreground">الوحدات المنجزة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <History className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{analytics?.gpa_trend?.length || 0}</p>
            <p className="text-xs text-muted-foreground">فصل دراسي</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التقدم الأكاديمي</CardTitle>
          <CardDescription>{history?.completedCredits || 0} / {history?.requiredCredits || 160} وحدة مطلوبة</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">{progressPercentage}% مكتمل</p>
        </CardContent>
      </Card>

      {history?.semesters?.map((sem: AcademicSemester, idx: number) => (
        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    الفصل {sem.semester} - {sem.academicYear}
                  </CardTitle>
                  <CardDescription>
                    المعدل: {sem.gpa?.toFixed(2) ?? '0.00'} | إجمالي الوحدات: {sem.totalCredits}
                  </CardDescription>
                </div>
                <Badge variant={(sem.gpa ?? 0) >= 2 ? 'success' : 'warning'}>
                  {(sem.gpa ?? 0) >= 2 ? 'ناجح' : 'إنذار'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-2 font-medium">المادة</th>
                      <th className="pb-2 font-medium">الكود</th>
                      <th className="pb-2 font-medium">الدرجة</th>
                      <th className="pb-2 font-medium">التقدير</th>
                      <th className="pb-2 font-medium">الوحدات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((course, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{course.courseNameAr}</td>
                        <td className="py-2 text-muted-foreground">{course.courseCode}</td>
                        <td className="py-2">{course.gradeLetter}</td>
                        <td className="py-2">
                          <Badge variant={course.isPassed ? 'success' : 'destructive'}>
                            {course.isPassed ? 'مقبول' : 'راسب'}
                          </Badge>
                        </td>
                        <td className="py-2">{course.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
