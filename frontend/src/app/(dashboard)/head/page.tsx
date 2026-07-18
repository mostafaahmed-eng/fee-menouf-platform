'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export default function HeadDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const deptId = user?.doctor?.department?.id;

  const { data: deptStats, isLoading } = useQuery({
    queryKey: ['head', 'department', deptId, 'statistics'],
    queryFn: async () => {
      const { data } = await api.get(`/departments/${deptId}/statistics`);
      return data.data;
    },
    enabled: !!deptId,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: user?.fullNameEn || 'Department Head' })}
        </h1>
        <p className="text-muted-foreground">
          {user?.doctor?.department?.nameAr || 'قسم'} — لوحة تحكم رئيس القسم
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
            <CardContent><p className="text-2xl font-bold">{deptStats?.totalStudents || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">أعضاء هيئة التدريس</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{deptStats?.totalDoctors || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">المواد</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{deptStats?.totalCourses || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">البرامج</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{deptStats?.totalPrograms || 0}</p></CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              مؤشرات القسم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>الطلاب النشطون</span><span>{deptStats?.activeStudents || 0}</span></div>
              <Progress value={deptStats?.totalStudents ? ((deptStats?.activeStudents || 0) / deptStats.totalStudents) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>الخريجون</span><span>{deptStats?.graduatedStudents || 0}</span></div>
              <Progress value={deptStats?.totalStudents ? ((deptStats?.graduatedStudents || 0) / deptStats.totalStudents) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>المرشدون</span><span>{deptStats?.totalAdvisors || 0}</span></div>
              <Progress value={deptStats?.totalDoctors ? ((deptStats?.totalAdvisors || 0) / deptStats.totalDoctors) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              معلومات القسم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">القسم</span><span>{user?.doctor?.department?.nameAr || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">رئيس القسم</span><span>{user?.fullNameEn || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المدرسين المساعدين</span><span>{deptStats?.total_tas || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المرشدين الأكاديميين</span><span>{deptStats?.total_advisors || 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
