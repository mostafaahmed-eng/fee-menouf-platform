'use client';



import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  AlertTriangle,
  GraduationCap,
  Bell,
  UserCheck,
  CalendarCheck,
  FileText,
  Menu,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import api from '@/lib/api';
import type {
  Notification,
} from '@/lib/types';
import {
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AnimatedCounter({ value, suffix = '' }: { value: number | string | null | undefined; suffix?: string }) {
  const numericValue = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = Math.max(1, Math.floor(numericValue / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= numericValue) {
        setDisplay(numericValue);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, duration / 60);
    return () => clearInterval(timer);
  }, [numericValue]);
  return (
    <span>
      {Number(display).toFixed(2)}
      {suffix}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

export default function StudentDashboard() {
  const { direction } = useTranslation();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/auth/profile').then((r) => r.data.data),
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['recent-notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
  });

  const studentId = profile?.student?.id;
  const { data: attendanceRecords } = useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: () => api.get(`/students/${studentId}/attendance`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const totalAttendance = attendanceRecords?.length ?? 0;
  const presentAttendance = attendanceRecords?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length ?? 0;
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  if (profileLoading) {
    return (
      <div className="p-6 space-y-6" dir={direction}>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const warnings = notifications?.filter((n) => n.type === 'warning') ?? [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-6"
      dir={direction}
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            مرحباً، {profile?.fullNameAr || profile?.fullNameEn}
          </h1>
          <p className="text-muted-foreground">
            {profile?.student?.department?.nameAr || ''} - المستوى {profile?.student?.level || 1}
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {profile?.email || ''}
        </Badge>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GPA</p>
                <p className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={profile?.student?.gpa ?? 0} />
                </p>
              </div>
              <GraduationCap className="h-10 w-10 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-3xl font-bold text-blue-500">
                  <AnimatedCounter value={profile?.student?.cgpa ?? 0} />
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المقررات المسجلة</p>
                <p className="text-3xl font-bold text-emerald-500">
                  {profile?.student?.totalCredits ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">ساعة معتمدة</p>
              </div>
              <BookOpen className="h-10 w-10 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الحضور</p>
                <p className="text-3xl font-bold text-amber-500">
                  {attendancePercentage}%
                </p>
              </div>
              <UserCheck className="h-10 w-10 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {warnings.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  إنذارات أكاديمية
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  لديك {warnings.length} إنذار{warnings.length > 1 ? 'ات' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              آخر الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-lg text-sm ${
                      !n.isRead
                        ? 'bg-primary/10 border-e-2 border-primary'
                        : 'bg-muted/30'
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                ))}
                <Link
                  href="/student/notifications"
                  className="block text-center text-sm text-primary hover:underline mt-2"
                >
                  عرض الكل
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                لا توجد إشعارات
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              إجراءات سريعة
            </CardTitle>
            <CardDescription>اختر من الإجراءات التالية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/student/schedule')}
              >
                <CalendarCheck className="h-6 w-6" />
                <span>عرض الجدول</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/student/course-registration')}
              >
                <FileText className="h-6 w-6" />
                <span>تسجيل المقررات</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/student/grades')}
              >
                <GraduationCap className="h-6 w-6" />
                <span>الدرجات</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
