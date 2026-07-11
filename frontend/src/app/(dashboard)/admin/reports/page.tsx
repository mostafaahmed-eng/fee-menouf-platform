'use client';



import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Users, BookOpen, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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

interface RegistrationData {
  month: string;
  count: number;
}

interface CourseOption {
  id: string;
  nameAr: string;
}

const reportTypes = [
  { id: 'registration', label: 'تقارير التسجيل', icon: Users, description: 'إحصائيات تسجيل الطلاب' },
  { id: 'attendance', label: 'تقارير الحضور', icon: BarChart3, description: 'نسب حضور الطلاب' },
  { id: 'grades', label: 'تقارير الدرجات', icon: BookOpen, description: 'تحليل درجات الطلاب' },
];

export default function ReportsPage() {
  const { direction } = useTranslation();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('registration');
  const [selectedCourse, setSelectedCourse] = useState('');

  const { data: courses } = useQuery<CourseOption[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((r) => r.data.data),
  });

  const { data: registrationData, isLoading: regLoading, isError: regError, refetch: refetchReg } = useQuery<RegistrationData[]>({
    queryKey: ['admin', 'reports', 'registration', dateFrom, dateTo],
    queryFn: () => api.get('/reports/registration/active', { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined } }).then((r) => r.data.data),
    enabled: activeTab === 'registration',
  });

  const { data: gradeStats, isLoading: gradeStatsLoading, isError: gradeStatsError, refetch: refetchGradeStats } = useQuery<any>({
    queryKey: ['admin', 'reports', 'grade-stats', selectedCourse],
    queryFn: () => api.get(`/reports/grades/${selectedCourse}`).then((r) => r.data.data),
    enabled: activeTab === 'grades' && !!selectedCourse,
  });

  return (
    <div className="space-y-6 p-4 md:p-6" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">مركز التقارير</h1>
        <p className="text-muted-foreground">عرض وتصدير تقارير النظام</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <motion.div key={report.id} whileHover={{ y: -2 }}>
              <Link href={`/admin/reports/${report.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.label}</p>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فلترة التقرير</CardTitle>
          <CardDescription>حدد نطاق التقرير</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">التسجيل</SelectItem>
                  <SelectItem value="attendance">الحضور</SelectItem>
                  <SelectItem value="grades">الدرجات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-2"><Download className="h-4 w-4" /> عرض التقرير</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="registration" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات التسجيل</CardTitle>
              <CardDescription>توزيع عمليات التسجيل حسب الشهر</CardDescription>
            </CardHeader>
            <CardContent>
              {regLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : regError ? (
                <div className="flex flex-col items-center justify-center h-72 gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">فشل تحميل البيانات</p>
                  <Button variant="outline" size="sm" onClick={() => refetchReg()}><RefreshCw className="h-3 w-3 ml-1" /> إعادة المحاولة</Button>
                </div>
              ) : registrationData?.length ? (
                <div className="h-72 w-full overflow-x-auto">
                  <div className="min-w-[400px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-72 text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="attendance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الحضور</CardTitle>
              <CardDescription>اختر المادة لعرض تقرير الحضور</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> تصدير CSV</Button>
                <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> تصدير PDF</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الدرجات</CardTitle>
              <CardDescription>تحليل درجات الطلاب حسب المادة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {gradeStatsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : gradeStatsError ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <Button variant="outline" size="sm" onClick={() => refetchGradeStats()}><RefreshCw className="h-3 w-3 ml-1" /> إعادة المحاولة</Button>
                  </div>
                ) : gradeStats ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400">{gradeStats.excellent}</p><p className="text-xs text-muted-foreground">ممتاز</p></CardContent></Card>
                    <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-amber-500">{gradeStats.good}</p><p className="text-xs text-muted-foreground">جيد</p></CardContent></Card>
                    <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-destructive">{gradeStats.failed}</p><p className="text-xs text-muted-foreground">راسب</p></CardContent></Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">اختر مادة لعرض الإحصائيات</div>
                )}
                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> تصدير</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
