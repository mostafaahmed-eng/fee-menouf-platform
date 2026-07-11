'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '@/lib/i18n/use-translation';
import { CHART_COLORS_HEX } from '@/lib/chart-colors';
import api from '@/lib/api';

const reportConfig: Record<string, { title: string; description: string }> = {
  registration: { title: 'تقرير التسجيل', description: 'إحصائيات تسجيل الطلاب' },
  attendance: { title: 'تقرير الحضور', description: 'نسب حضور الطلاب' },
  grades: { title: 'تقرير الدرجات', description: 'تحليل درجات الطلاب' },
  departments: { title: 'إحصائيات الأقسام', description: 'إحصائيات حسب الأقسام' },
};

export default function ReportTypePage() {
  const { direction } = useTranslation();
  const params = useParams();
  const type = params.type as string;
  const config = reportConfig[type] || { title: 'تقرير', description: '' };
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const { data: courses } = useQuery<any[]>({
    queryKey: ['admin', 'courses-list'],
    queryFn: () => api.get('/courses').then((r) => r.data.data),
  });

  const { data: registrationData, isLoading: regLoading } = useQuery<any>({
    queryKey: ['admin', 'report-registration'],
    queryFn: () => api.get('/reports/registration/active').then((r) => r.data.data),
    enabled: type === 'registration',
  });

  const { data: attendanceData, isLoading: attLoading } = useQuery<any>({
    queryKey: ['admin', 'report-attendance', selectedCourseId],
    queryFn: () => api.get(`/reports/attendance/${selectedCourseId}`).then((r) => r.data.data),
    enabled: type === 'attendance' && !!selectedCourseId,
  });

  const { data: gradesData, isLoading: gradesLoading } = useQuery<any>({
    queryKey: ['admin', 'report-grades', selectedCourseId],
    queryFn: () => api.get(`/reports/grades/${selectedCourseId}`).then((r) => r.data.data),
    enabled: type === 'grades' && !!selectedCourseId,
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ['admin', 'dept-list'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const chartData = (() => {
    if (type === 'registration' && registrationData) {
      return (registrationData.byDepartment ?? []).map((d: any) => ({
        label: d.department?.nameAr || '—',
        value: d.count || 0,
      }));
    }
    if (type === 'attendance' && attendanceData) {
      return (attendanceData.studentDetails ?? []).slice(0, 20).map((s: any) => ({
        label: s.studentName || '—',
        value: s.attendanceRate ?? 0,
      }));
    }
    if (type === 'grades' && gradesData) {
      return (gradesData.studentResults ?? []).slice(0, 20).map((g: any) => ({
        label: g.name || '—',
        value: g.score ?? 0,
      }));
    }
    if (type === 'departments') {
      return (departments ?? []).map((d: any) => ({
        label: d.nameAr,
        value: d.students?.length ?? 0,
      }));
    }
    return [];
  })();

  const isLoading =
    (type === 'registration' && regLoading) ||
    (type === 'attendance' && attLoading) ||
    (type === 'grades' && gradesLoading);

  const needsCourse = type === 'attendance' || type === 'grades';

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/reports"><ArrowLeft className="h-4 w-4 ml-1" /> العودة للتقارير</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>خيارات التقرير</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {needsCourse && (
            <div className="space-y-2">
              <Label>المادة</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="اختر مادة" /></SelectTrigger>
                <SelectContent>
                  {(courses ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
            <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> PDF</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS_HEX.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              {needsCourse && !selectedCourseId ? 'اختر مادة لعرض التقرير' : 'لا توجد بيانات'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
