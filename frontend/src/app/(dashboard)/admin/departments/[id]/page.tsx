'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function DepartmentDetail() {
  const { direction } = useTranslation();
  const params = useParams();
  const id = params.id as string;

  const { data: dept, isLoading: deptLoading } = useQuery({
    queryKey: ['admin', 'department', id],
    queryFn: async () => {
      const { data } = await api.get(`/departments/${id}`);
      return data.data;
    },
  });

  const { data: programs, isLoading: programsLoading } = useQuery<any[]>({
    queryKey: ['admin', 'department-programs', id],
    queryFn: async () => {
      const { data } = await api.get(`/programs?departmentId=${id}`);
      return data.data;
    },
  });

  const { data: deptStudents } = useQuery<any>({
    queryKey: ['admin', 'department-students', id],
    queryFn: async () => {
      const { data } = await api.get(`/students?departmentId=${id}&limit=1`);
      return data;
    },
  });

  const { data: deptCourses } = useQuery<any>({
    queryKey: ['admin', 'department-courses', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses?departmentId=${id}`);
      return data;
    },
  });

  const isLoading = deptLoading || programsLoading;

  const chartData = programs?.map((p: any) => ({
    name: p.nameAr,
    students: p.students?.length ?? 0,
  })) ?? [];

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/departments"><ArrowLeft className="h-4 w-4 ml-1" /> العودة للأقسام</Link>
        </Button>
        <div className="mt-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{dept?.nameAr}</h1>
            <p className="text-muted-foreground">{dept?.nameEn} - {dept?.code}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">الطلاب</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{deptStudents?.meta?.total ?? '—'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">أعضاء التدريس</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{dept?.headId ? '1' : '—'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">المواد</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{deptCourses?.length ?? '—'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">البرامج</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{programs?.length ?? '—'}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البرامج الأكاديمية</CardTitle>
          <CardDescription>توزيع الطلاب حسب البرامج</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill={CHART_COLORS_HEX.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات القسم</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">رئيس القسم</p>
            <p className="font-medium">{dept?.headId || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
            <p className="font-medium">{dept?.contactEmail || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
            <p className="font-medium">{dept?.createdAt ? new Date(dept.createdAt).toLocaleDateString('ar-EG') : '---'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
