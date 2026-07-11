'use client';



import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  QrCode,
  MapPin,
  Download,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import AttendanceTable from './components/attendance-table';
import QrGenerator from './components/qr-generator';

interface StudentAttendance {
  id: string;
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

export default function AttendancePage() {
  const { direction } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [activeTab, setActiveTab] = useState('mark');

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['faculty', 'courses', 'attendance'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });

  const loadStudents = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await api.get(`/courses/${selectedCourse}/students`);
      const studentsData = data.data;
      if (!Array.isArray(studentsData)) {
        toast.error('بيانات الطلاب غير متاحة');
        return;
      }
      setStudents(
        studentsData.map((s: { id: string; studentId: string; name: string }) => ({
          id: s.id,
          student_id: s.studentId,
          student_name: s.name,
          status: null,
        })),
      );
    } catch {
      toast.error('حدث خطأ أثناء تحميل الطلاب');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/attendance/mark-bulk', {
        courseId: selectedCourse,
        records: students.map((s) => ({
          studentId: s.student_id,
          status: s.status || 'absent',
          date: lectureDate,
        })),
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم حفظ الحضور بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الحضور');
    },
  });

  const handleStatusChange = (studentId: string, status: StudentAttendance['status']) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s)),
    );
  };

  const handleBulkAction = (status: StudentAttendance['status']) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status })),
    );
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleExport = () => {
    const csv = [
      ['Student ID', 'Student Name', 'Status'].join(','),
      ...students.map((s) => [s.student_id, s.student_name, s.status || 'unmarked'].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${lectureDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات');
  };

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
        <h1 className="text-2xl font-bold tracking-tight mt-2">إدارة الحضور</h1>
        <p className="text-muted-foreground">تسجيل ومتابعة حضور الطلاب</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mark" className="gap-2">
            <MapPin className="h-4 w-4" /> تسجيل حضور
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-2">
            <QrCode className="h-4 w-4" /> رمز QR
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <Download className="h-4 w-4" /> تقارير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحديد المحاضرة</CardTitle>
              <CardDescription>اختر المادة والتاريخ</CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-48" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label>المادة</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={lectureDate}
                      onChange={(e) => setLectureDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={loadStudents} disabled={!selectedCourse}>
                    تحميل الطلاب
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {students.length > 0 && (
            <>
              <AttendanceTable
                students={students}
                onStatusChange={handleStatusChange}
                onBulkAction={handleBulkAction}
              />
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1 gap-2" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ الحضور
                </Button>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  تصدير CSV
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          {coursesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <QrGenerator courses={courses || []} />
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الحضور</CardTitle>
              <CardDescription>ملخص حضور الطلاب حسب المادة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>المادة</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course: { id: string; nameAr: string }) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  عرض التقرير
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  تصدير CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
