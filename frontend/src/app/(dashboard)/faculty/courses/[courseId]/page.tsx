'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Upload,
  Megaphone,
  BarChart3,
  Download,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTranslation } from '@/lib/i18n/use-translation';
import { CHART_COLORS, CHART_COLORS_HEX } from '@/lib/chart-colors';
import { StudentEnrollment, Announcement, CourseMaterial } from '@/lib/types';

const COLORS = CHART_COLORS;

export default function CourseDetail() {
  const { direction } = useTranslation();
  const params = useParams();
  const courseId = params.courseId as string;
  const [activeTab, setActiveTab] = useState('students');

  const { data: course, isLoading } = useQuery({
    queryKey: ['faculty', 'course', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}`);
      return data.data;
    },
  });

  const { data: students } = useQuery<StudentEnrollment[]>({
    queryKey: ['faculty', 'course', courseId, 'students'],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/students`);
      return data.data;
    },
  });

  const { data: materials } = useQuery<CourseMaterial[]>({
    queryKey: ['faculty', 'course', courseId, 'materials'],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/materials`);
      return data.data;
    },
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['faculty', 'course', courseId, 'announcements'],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/announcements`);
      return data.data;
    },
  });

  const { data: attendanceReport } = useQuery({
    queryKey: ['faculty', 'course', courseId, 'attendance-report'],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/report/${courseId}`);
      return data.data;
    },
  });

  const { data: gradesData } = useQuery({
    queryKey: ['faculty', 'course', courseId, 'grades'],
    queryFn: async () => {
      const { data } = await api.get(`/grades/course/${courseId}`);
      return data.data;
    },
  });

  const gradeDistData = useMemo(() => {
    if (!gradesData || !Array.isArray(gradesData)) return [
      { name: 'A', count: 0 }, { name: 'B', count: 0 }, { name: 'C', count: 0 }, { name: 'D', count: 0 }, { name: 'F', count: 0 },
    ];
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradesData.forEach((g: { gradeLetter?: string }) => {
      const letter = g.gradeLetter?.toUpperCase() || '';
      if (letter in counts) counts[letter as keyof typeof counts]++;
    });
    return [
      { name: 'A', count: counts.A }, { name: 'B', count: counts.B }, { name: 'C', count: counts.C }, { name: 'D', count: counts.D }, { name: 'F', count: counts.F },
    ];
  }, [gradesData]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty/courses">
            <ArrowLeft className="h-4 w-4 ml-1" />
            العودة إلى المواد
          </Link>
        </Button>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{course?.nameAr}</h1>
            <p className="text-muted-foreground">{course?.nameEn} - {course?.code}</p>
          </div>
          <Badge variant="secondary" className="w-fit">{course?.credits} وحدات</Badge>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" /> الطلاب المسجلين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{students?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" /> المواد الدراسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{materials?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4" /> الإعلانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{announcements?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="students" className="gap-2"><Users className="h-4 w-4" /> الطلاب</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2"><BarChart3 className="h-4 w-4" /> الحضور</TabsTrigger>
          <TabsTrigger value="grades-tab" className="gap-2"><BookOpen className="h-4 w-4" /> الدرجات</TabsTrigger>
          <TabsTrigger value="materials" className="gap-2"><Upload className="h-4 w-4" /> المواد</TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2"><Megaphone className="h-4 w-4" /> الإعلانات</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" /> التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الطلاب</CardTitle>
              <CardDescription>{students?.length || 0} طالب مسجل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 font-medium">الطالب</th>
                      <th className="pb-3 font-medium">الكود</th>
                      <th className="pb-3 font-medium">البريد الإلكتروني</th>
                      <th className="pb-3 font-medium">نسبة الحضور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students?.map((student) => (
                      <tr key={student.id} className="border-b last:border-0">
                        <td className="py-3">{student.fullName}</td>
                        <td className="py-3 text-muted-foreground">{student.studentId}</td>
                        <td className="py-3 text-muted-foreground">{student.email}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.attendancePercentage}
                              className="h-2 w-24"
                            />
                            <span className="text-xs">{student.attendancePercentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>ملخص الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'حاضر', value: attendanceReport?.presentPercentage || 0, color: 'text-green-500' },
                  { label: 'غائب', value: attendanceReport?.absentPercentage || 0, color: 'text-red-500' },
                  { label: 'متأخر', value: attendanceReport?.latePercentage || 0, color: 'text-amber-500' },
                  { label: 'معذور', value: attendanceReport?.excusedPercentage || 0, color: 'text-blue-500' },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="pt-6 text-center">
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}%</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button className="mt-4 gap-2" variant="outline" asChild>
                <Link href={`/faculty/attendance?course=${courseId}`}>
                  <Users className="h-4 w-4" />
                  إدارة الحضور
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades-tab" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>إدخال الدرجات</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="gap-2" asChild>
                <Link href={`/faculty/grades?course=${courseId}`}>
                  <BookOpen className="h-4 w-4" />
                  إدارة الدرجات
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المواد الدراسية</CardTitle>
                <CardDescription>الملفات والمواد التعليمية للمادة</CardDescription>
              </div>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                رفع مادة
              </Button>
            </CardHeader>
            <CardContent>
              {materials && materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{material.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {material.type === 'lecture' ? 'محاضرة' :
                             material.type === 'lab' ? 'معمل' :
                             material.type === 'assignment' ? 'واجب' : 'مرجع'}
                            {' - '}
                            {new Date(material.uploadedAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  لم يتم رفع أي مواد بعد
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الإعلانات</CardTitle>
                <CardDescription>الإعلانات المنشورة للمادة</CardDescription>
              </div>
              <Button className="gap-2">
                <Megaphone className="h-4 w-4" />
                إضافة إعلان
              </Button>
            </CardHeader>
            <CardContent>
              {announcements && announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(announcement.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  لا توجد إعلانات بعد
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل أداء الطلاب</CardTitle>
              <CardDescription>توزيع الدرجات في المادة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS_HEX.primary} radius={[4, 4, 0, 0]}>
                      {gradeDistData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>توزيع الدرجات النسبي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {gradeDistData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
