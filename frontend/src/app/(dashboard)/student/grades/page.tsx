'use client';



import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import GradeTable from './components/grade-table';
import Transcript from './components/transcript';

const GpaChart = dynamic(() => import('./components/gpa-chart'), {
  loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
  ssr: false,
});
import { useTranslation } from '@/lib/i18n/use-translation';
import api from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Grade, GpaRecord } from '@/lib/types';
import type { User } from '@/lib/types/user.types';
import {
  GraduationCap,
  BarChart3,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function GradesPage() {
  const { direction } = useTranslation();
  const { user } = useAuth();
  const studentId = user?.student?.id;
  const [academicYear, setAcademicYear] = useState('all');
  const [semester, setSemester] = useState('all');

  const { data: profile } = useQuery<User>({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/auth/profile').then((r) => r.data.data),
  });

  const { data: grades, isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ['grades', studentId, academicYear, semester],
    queryFn: () =>
      api
        .get(`/students/${studentId}/grades`, {
          params: {
            ...(academicYear !== 'all' && { academicYear }),
            ...(semester !== 'all' && { semester }),
          },
        })
        .then((r) => r.data.data),
    enabled: !!studentId,
  });

  const { data: gpaHistory, isLoading: gpaLoading } = useQuery<GpaRecord[]>({
    queryKey: ['gpa-history', studentId],
    queryFn: () => api.get(`/grades/transcript/${studentId}`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const currentGpa =
    grades?.reduce((sum, g) => sum + g.gpaPoints * g.credits, 0) ?? 0;
  const currentCredits =
    grades?.reduce((sum, g) => sum + g.credits, 0) ?? 0;
  const semesterGpa = currentCredits > 0 ? (currentGpa / currentCredits) : 0;

  const latestRecord = gpaHistory && gpaHistory.length > 0
    ? gpaHistory[gpaHistory.length - 1]
    : undefined;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-6"
      dir={direction}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 },
        }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">الدرجات</h1>
          <p className="text-muted-foreground">عرض نتائجك الدراسية</p>
        </div>
        <div className="flex gap-2">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="العام الدراسي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="2025-2026">2025-2026</SelectItem>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
            </SelectContent>
          </Select>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الفصل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="first">الأول</SelectItem>
              <SelectItem value="second">الثاني</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GPA الفصل</p>
                <p className="text-2xl font-bold text-primary">
                  {semesterGpa.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold text-blue-500">
                  {latestRecord?.cgpa?.toFixed(2) ?? '---'}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المقررات</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {grades?.length ?? 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الساعات المكتسبة</p>
                <p className="text-2xl font-bold text-amber-500">
                  {currentCredits}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">الدرجات</TabsTrigger>
          <TabsTrigger value="gpa-chart">تطور GPA</TabsTrigger>
          <TabsTrigger value="transcript">السجل الأكاديمي</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">درجات الفصل الدراسي</CardTitle>
            </CardHeader>
            <CardContent>
              <GradeTable grades={grades} isLoading={gradesLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gpa-chart">
          <GpaChart data={gpaHistory} isLoading={gpaLoading} />
        </TabsContent>

        <TabsContent value="transcript">
          <Transcript
            grades={grades}
            cgpa={latestRecord?.cgpa}
            totalCredits={latestRecord?.totalCredits}
            studentName={profile?.fullNameAr}
            studentId={profile?.student?.studentId}
            isLoading={gradesLoading}
          />
        </TabsContent>

      </Tabs>
    </motion.div>
  );
}
