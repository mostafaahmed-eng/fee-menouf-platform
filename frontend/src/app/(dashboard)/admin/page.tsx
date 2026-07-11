'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  Activity,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import type { SystemHealth, SystemUser, Department } from '@/lib/types';

const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart as React.ComponentType<any>), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line as React.ComponentType<any>), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis as React.ComponentType<any>), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis as React.ComponentType<any>), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid as React.ComponentType<any>), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip as React.ComponentType<any>), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer as React.ComponentType<any>), { ssr: false });

interface EnrollmentTrendItem {
  month: string;
  students: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const { direction } = useTranslation();

  const { data: health } = useQuery<SystemHealth>({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data.data),
    retry: false,
  });

  const { data: allUsers } = useQuery<SystemUser[]>({
    queryKey: ['admin', 'all-users'],
    queryFn: () => api.get('/users').then((r) => r.data.data),
  });

  const { data: enrollmentTrend, isLoading: trendLoading, isError: trendError, refetch: refetchTrend } = useQuery<EnrollmentTrendItem[]>({
    queryKey: ['admin', 'enrollment-trend'],
    queryFn: () => api.get('/analytics/enrollment-trends').then((r) => r.data.data),
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['admin', 'dept-list'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const { data: allCourses } = useQuery<any[]>({
    queryKey: ['admin', 'all-courses'],
    queryFn: () => api.get('/courses').then((r) => r.data.data),
  });

  const statCards = [
    { key: 'total_users', label: 'إجمالي المستخدمين', value: allUsers?.length, loading: false, sub: null, progress: null },
    { key: 'students', label: 'الطلاب', value: allUsers?.filter((u) => u.role === 'STUDENT').length, loading: false, sub: null, progress: null },
    { key: 'faculty', label: 'أعضاء هيئة التدريس', value: allUsers?.filter((u) => u.role === 'DOCTOR' || u.role === 'TA').length, loading: false, sub: null, progress: null },
    { key: 'courses', label: 'المواد الدراسية', value: allCourses?.length ?? '—', loading: false, sub: null, progress: null },
    { key: 'departments', label: 'الأقسام', value: departments?.length, loading: false, sub: null, progress: null },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6" dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة تحكم الإدارة</h1>
          <p className="text-muted-foreground">نظرة عامة على النظام</p>
        </div>
        <div className="flex items-center gap-2">
          {health && health.status === 'ok' ? (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              <Activity className="h-3 w-3 ms-1" /> النظام سليم
            </Badge>
          ) : (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="h-3 w-3 ms-1" /> غير متاح
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/admin/settings"><Settings className="h-4 w-4" /> الإعدادات</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <motion.div key={s.key} variants={item}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{s.label}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value?.toLocaleString() ?? s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> إحصائيات التسجيل</CardTitle>
              <CardDescription>عدد الطلاب المسجلين هذا الفصل</CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : trendError ? (
                <div className="flex flex-col items-center justify-center h-72 gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">فشل تحميل البيانات</p>
                  <Button variant="outline" size="sm" onClick={() => refetchTrend()}>
                    <RefreshCw className="h-3 w-3 ms-1" /> إعادة المحاولة
                  </Button>
                </div>
              ) : enrollmentTrend?.length ? (
                <div className="h-72 w-full overflow-x-auto">
                  <div className="min-w-[400px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis allowDecimals={false} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 'var(--radius)',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                        }}
                      />
                      <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-72 text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الأقسام</CardTitle>
            </CardHeader>
            <CardContent>
              {departments?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {departments.map((dept: Department) => (
                    <Link key={dept.id} href={`/admin/departments/${dept.id}`}>
                      <div className="rounded-lg border p-3 hover:border-primary/50 transition-colors">
                        <p className="font-medium">{dept.nameAr}</p>
                        <p className="text-xs text-muted-foreground">{dept.nameEn}</p>
                        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                          <span>{dept.code}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">لا توجد أقسام</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> صحة النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> الحالة</span>
                    <span className="text-green-600">نشط</span>
                  </div>
                  {health.timestamp && (
                    <div className="flex items-center justify-between text-sm">
                      <span>آخر تحديث</span>
                      <span className="text-xs text-muted-foreground">{new Date(health.timestamp).toLocaleString('ar-EG')}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /> غير متاح
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-16 flex-col gap-1" asChild>
              <Link href="/admin/departments"><Building2 className="h-5 w-5" /><span className="text-xs">الأقسام</span></Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1" asChild>
              <Link href="/admin/users"><Users className="h-5 w-5" /><span className="text-xs">المستخدمين</span></Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1" asChild>
              <Link href="/admin/courses"><BookOpen className="h-5 w-5" /><span className="text-xs">المواد</span></Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1" asChild>
              <Link href="/admin/reports"><GraduationCap className="h-5 w-5" /><span className="text-xs">التقارير</span></Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
