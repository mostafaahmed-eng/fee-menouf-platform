'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, ClipboardCheck, GraduationCap, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { FacultyCourse, FacultyDashboardStats } from '@/lib/types';

export default function TaDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile');
      return data.data;
    },
  });

  const doctorId = profile?.user?.ta?.doctorId;

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['ta', 'dashboard', doctorId],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/${doctorId}/dashboard`);
      return data.data;
    },
    enabled: !!doctorId,
  });

  const stats = dashboard as FacultyDashboardStats | undefined;
  const courses = (dashboard as { courses?: FacultyCourse[] })?.courses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: user?.fullNameEn || 'TA' })}
        </h1>
        <p className="text-muted-foreground">
          لوحة تحكم المعيد / المدرس المساعد
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.totalStudents || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">المواد المساعدة</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{courses?.length || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">متوسط الحضور</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.avgAttendance || 0}%</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">الدرجات المعلقة</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-amber-500">{stats?.pendingGrades || 0}</p></CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              المواد المساعدة
            </CardTitle>
            <CardDescription>المواد التي تقدم فيها المساعدة</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : courses && courses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((course) => (
                  <Link key={course.id} href={`/faculty/courses/${course.id}`}>
                    <div className="rounded-lg border p-4 transition-colors hover:border-primary/50">
                      <p className="font-medium">{course.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{course.code}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{course.studentCount} طالب</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{course.scheduleTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد مواد مساعدة</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <Link href="/faculty/attendance">
                  <ClipboardCheck className="h-5 w-5" />
                  <span className="text-xs">تسجيل حضور</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <Link href="/faculty/grades">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs">إدخال درجات</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                إحصاءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">استفسارات غير مقروءة</span>
                <span>{stats?.unreadInquiries || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">حالة تسجيل الحضور</span>
                <Badge variant="outline">نشط</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
