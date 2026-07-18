'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Send, AlertTriangle, History } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CHART_COLORS_HEX } from '@/lib/chart-colors';
import GradeDistribution from './components/grade-distribution';
import GradeEntryTable from './components/grade-entry-table';

export default function GradesPage() {
  const { direction } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('MIDTERM');
  const [activeTab, setActiveTab] = useState('entry');

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['faculty', 'courses', 'grades'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['faculty', 'students', selectedCourse],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${selectedCourse}/students`);
      return data.data;
    },
    enabled: !!selectedCourse,
  });

  const { data: gradesData } = useQuery({
    queryKey: ['faculty', 'grades', 'course', selectedCourse],
    queryFn: async () => {
      const { data } = await api.get(`/grades/course/${selectedCourse}`);
      return data.data;
    },
    enabled: !!selectedCourse,
  });

  const [marks, setMarks] = useState<Record<string, number | null>>({});

  const gradeEntryStudents = useMemo(() => {
    if (!studentsData || !Array.isArray(studentsData)) return [];
    const gradeMap = new Map<string, number | null>();
    if (Array.isArray(gradesData)) {
      gradesData.forEach((g: { studentId?: string; student_id?: string; component?: string; marks?: number | null }) => {
        if (g.component === selectedComponent) {
          const sid = g.studentId || g.student_id || '';
          gradeMap.set(sid, g.marks ?? null);
        }
      });
    }
    return studentsData.map((s: { id: string; studentId?: string; student_id?: string; name?: string }) => ({
      id: s.id,
      student_id: s.studentId || s.student_id || s.id,
      student_name: s.name || '',
      marks: gradeMap.get(s.studentId || s.student_id || s.id) ?? marks[s.id] ?? null,
      max_marks: 100,
    }));
  }, [studentsData, gradesData, selectedComponent, marks]);

  const handleMarksChange = useCallback((studentId: string, value: number | null) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  }, []);

  const saveGradesMutation = useMutation({
    mutationFn: async () => {
      const payload = gradeEntryStudents
        .filter((s) => s.marks !== null)
        .map((s) => ({
          studentId: s.student_id,
          component: selectedComponent,
          marks: s.marks,
          maxMarks: s.max_marks,
        }));
      const { data } = await api.post('/grades/bulk', {
        courseId: selectedCourse,
        grades: payload,
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم حفظ الدرجات بنجاح');
      setMarks({});
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الدرجات');
    },
  });

  const gradeDistData = useMemo(() => {
    if (!gradesData || !Array.isArray(gradesData)) return [
      { name: 'A', count: 0, color: CHART_COLORS_HEX.secondary },
      { name: 'B', count: 0, color: CHART_COLORS_HEX.primary },
      { name: 'C', count: 0, color: CHART_COLORS_HEX.warning },
      { name: 'D', count: 0, color: '#f97316' },
      { name: 'F', count: 0, color: CHART_COLORS_HEX.danger },
    ];
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradesData.forEach((g: { gradeLetter?: string }) => {
      const letter = g.gradeLetter?.toUpperCase() || '';
      if (letter in counts) counts[letter as keyof typeof counts]++;
    });
    return [
      { name: 'A', count: counts.A, color: CHART_COLORS_HEX.secondary },
      { name: 'B', count: counts.B, color: CHART_COLORS_HEX.primary },
      { name: 'C', count: counts.C, color: CHART_COLORS_HEX.warning },
      { name: 'D', count: counts.D, color: '#f97316' },
      { name: 'F', count: counts.F, color: CHART_COLORS_HEX.danger },
    ];
  }, [gradesData]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/grades/publish/${selectedCourse}`);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم نشر الدرجات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء نشر الدرجات');
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty">
            <ArrowLeft className="h-4 w-4 ml-1" />
            العودة
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">إدارة الدرجات</h1>
        <p className="text-muted-foreground">إدخال وتعديل ونشر درجات الطلاب</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>اختر المادة</CardTitle>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course: { id: string; nameAr: string; code: string }) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.nameAr} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedCourse && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="entry" className="gap-2"><BookOpen className="h-4 w-4" /> إدخال الدرجات</TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2"><BookOpen className="h-4 w-4" /> توزيع الدرجات</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> سجل التعديلات</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدخال الدرجات</CardTitle>
                <CardDescription>اختر المكون ثم أدخل درجات الطلاب</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="اختر المكون" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_COMPONENTS.map((comp) => (
                      <SelectItem key={comp.value} value={comp.value}>
                        {comp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {studentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : gradeEntryStudents.length > 0 ? (
              <GradeEntryTable
                students={gradeEntryStudents}
                onMarksChange={handleMarksChange}
                onSave={() => saveGradesMutation.mutate()}
                isSaving={saveGradesMutation.isPending}
                componentName={GRADE_COMPONENTS.find((c) => c.value === selectedComponent)?.label || ''}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>لا يوجد طالب مسجلين في هذه المادة</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full gap-2" size="lg">
                      <Send className="h-4 w-4" />
                      نشر جميع الدرجات
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        تأكيد نشر الدرجات
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم نشر درجات جميع الطلاب لهذه المادة. بعد النشر، لن يتمكن الطلاب من الاعتراض إلا من خلال إجراءات رسمية.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => publishMutation.mutate()}
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? 'جاري النشر...' : 'تأكيد النشر'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الدرجات</CardTitle>
                <CardDescription>تحليل توزيع درجات الطلاب</CardDescription>
              </CardHeader>
              <CardContent>
                <GradeDistribution data={gradeDistData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل التعديلات</CardTitle>
                <CardDescription>سجل جميع التعديلات على الدرجات مع تتبع المراجعة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground py-8">سجل التعديلات قيد التطوير</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
