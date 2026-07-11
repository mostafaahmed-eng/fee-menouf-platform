'use client';



import { useTranslation } from '@/lib/i18n/use-translation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Users,
  Clock,
  Bell,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  FacultyDashboardStats,
  FacultyCourse,
} from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FacultyDashboard() {
  const { direction } = useTranslation();
  const [date] = useState(new Date());

  const { data: profile } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile');
      return data.data;
    },
  });

  const doctorId = profile?.user?.doctor?.id;

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['faculty', 'dashboard', doctorId],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/${doctorId}/dashboard`);
      return data.data;
    },
    enabled: !!doctorId,
  });

  const stats = dashboard as FacultyDashboardStats | undefined;
  const courses = (dashboard as { courses?: FacultyCourse[] })?.courses;
  const statsLoading = dashboardLoading;
  const coursesLoading = dashboardLoading;

  const { data: unreadNotifs } = useQuery({
    queryKey: ['faculty', 'notifications', 'unread'],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: { perPage: 1, isRead: false } });
      return data.pagination?.total || data.data?.length || 0;
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة تحكم أعضاء هيئة التدريس</h1>
          <p className="text-muted-foreground">
            {date.toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            {unreadNotifs ?? 0}
          </Button>
          <Button size="sm" className="gap-2">
            <UserCheck className="h-4 w-4" />
            تسجيل حضور سريع
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">عبر جميع المواد</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المواد المسندة</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{courses?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">هذا الفصل الدراسي</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الحضور</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.avgAttendance || 0}%</div>
              )}
              <Progress value={stats?.avgAttendance || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الدرجات المعلقة</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-amber-500">
                  {stats?.pendingGrades || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">بحاجة إلى إدخال</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                مواد هذا الفصل
              </CardTitle>
              <CardDescription>المواد التي تدرسها هذا الفصل الدراسي</CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {courses?.slice(0, 4).map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{course.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{course.code}</p>
                        </div>
                        <Badge variant="outline">{course.credits} وحدات</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.credits} وحدات
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.scheduleTime}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {courses && courses.length > 4 && (
                <Button variant="link" className="mt-3 w-full" asChild>
                  <Link href="/faculty/courses">
                    عرض الكل
                    <ArrowRight className="mr-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>


        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" className="space-y-4">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                استفسارات الطلاب
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>لا توجد استفسارات جديدة</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-1" asChild>
              <Link href="/faculty/attendance">
                <UserCheck className="h-5 w-5" />
                <span className="text-xs">تسجيل حضور</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1" asChild>
              <Link href="/faculty/grades">
                <GraduationCap className="h-5 w-5" />
                <span className="text-xs">إدخال درجات</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1" asChild>
              <Link href="/faculty/materials">
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">المواد الدراسية</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-1" asChild>
              <Link href="/faculty/analytics">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">تحليلات</span>
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
