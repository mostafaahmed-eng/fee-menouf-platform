'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useAuth } from '@/lib/hooks/use-auth';
import CourseCard from './components/course-card';
import RegistrationSummarySidebar from './components/registration-summary';
import api from '@/lib/api';
import type { Course, RegisteredCourse, RegistrationSummary } from '@/lib/types';
import {
  Search,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

function getErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.detail || 'حدث خطأ غير متوقع';
}

export default function CourseRegistrationPage() {
  const queryClient = useQueryClient();
  const { direction } = useTranslation();
  const { user } = useAuth();
  const studentId = user?.student?.id;
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const { data: availableCourses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: () => api.get('/courses').then((r) => r.data.data),
  });

  const { data: registeredCourses, isLoading: registeredLoading } = useQuery<
    RegisteredCourse[]
  >({
    queryKey: ['registered-courses', studentId],
    queryFn: () =>
      api.get(`/registration/student/${studentId}`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const { data: semesters } = useQuery({
    queryKey: ['active-semester'],
    queryFn: () =>
      api.get('/academic/semesters', { params: { isActive: true } }).then((r) => r.data.data?.[0]),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<RegistrationSummary>({
    queryKey: ['registration-summary', studentId],
    queryFn: () =>
      api.get(`/registration/student/${studentId}`).then((r) => {
        const regs = r.data.data || [];
        return {
          totalCredits: regs.reduce((sum: number, r: any) => sum + (r.course?.credits || 0), 0),
          maxCredits: 21,
          coursesCount: regs.length,
          status: 'active',
        };
      }),
    enabled: !!studentId,
  });

  const registerMutation = useMutation({
    mutationFn: (courseId: string) =>
      api.post('/registration/register', {
        studentId,
        semesterId: semesters?.id,
        courseIds: [courseId],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
      queryClient.invalidateQueries({ queryKey: ['registered-courses'] });
      queryClient.invalidateQueries({ queryKey: ['registration-summary'] });
      toast.success('تم التسجيل بنجاح');
    },
    onError: (err: unknown) => {
      toast.error('فشل التسجيل', {
        description: getErrorMessage(err),
      });
    },
  });

  const dropMutation = useMutation({
    mutationFn: (registrationId: string) =>
      api.post(`/registration/drop/${registrationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
      queryClient.invalidateQueries({ queryKey: ['registered-courses'] });
      queryClient.invalidateQueries({ queryKey: ['registration-summary'] });
      toast.success('تم حذف المقرر');
    },
    onError: (err: unknown) => {
      toast.error('فشل الحذف', {
        description: getErrorMessage(err),
      });
    },
  });

  const registeredIds = new Set(
    registeredCourses?.map((rc) => rc.course.id) ?? [],
  );
  const registeredMap = new Map(
    registeredCourses?.map((rc) => [rc.course.id, rc]) ?? [],
  );

  const filteredCourses = (availableCourses ?? []).filter((c) => {
    const matchesSearch =
      (c.nameAr ?? '').includes(search) ||
      (c.nameEn ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.code ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === 'all' || (c.level != null && c.level === parseInt(filterLevel));
    const matchesDept =
      filterDepartment === 'all' || c.departmentId === filterDepartment;
    return matchesSearch && matchesLevel && matchesDept;
  });

  const departments = [
        ...new Set(availableCourses?.map((c) => c.departmentId) ?? []),
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-6"
      dir={direction}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">تسجيل المقررات</h1>
          <p className="text-muted-foreground">
            اختر المقررات الدراسية للفصل الحالي
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <BookOpen className="h-4 w-4 ml-1" />
          {registeredIds.size} مقرر
        </Badge>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مقرر..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستويات</SelectItem>
                {[1, 2, 3, 4].map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    المستوى {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {coursesLoading || registeredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isRegistered={registeredIds.has(course.id)}
                    onRegister={(id) => registerMutation.mutate(id)}
                    onDrop={(id) => {
                      const reg = registeredMap.get(id);
                      if (reg) dropMutation.mutate(reg.id);
                    }}
                    isLoading={
                      registerMutation.isPending || dropMutation.isPending
                    }
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!coursesLoading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-3">لا توجد مقررات متاحة</p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setSearch('');
                  setFilterLevel('all');
                  setFilterDepartment('all');
                }}
              >
                <RotateCcw className="h-4 w-4 ml-1" />
                إعادة تعيين الفلترة
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <RegistrationSummarySidebar
            summary={summary}
            isLoading={summaryLoading}
          />

          {registeredCourses && registeredCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المقررات المسجلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {registeredCourses.map((rc) => (
                  <div
                    key={rc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="font-medium truncate ml-2">
                      {rc.course.nameAr}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-7 px-2"
                      onClick={() => dropMutation.mutate(rc.id)}
                      disabled={dropMutation.isPending}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
