'use client';



import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AttendanceStatsCards from './components/attendance-stats';
import AttendanceCalendar from './components/attendance-calendar';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Attendance } from '@/lib/types';
import {
  Download,
  Filter,
  Search,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

interface CourseOption {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  present: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  absent: 'bg-red-500/15 text-red-600 border-red-500/30',
  late: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  excused: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
};

const statusLabels: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'بعذر',
};

const markedByLabels: Record<string, string> = {
  qr: 'QR Code',
  manual: 'يدوي',
  face: 'التعرف على الوجه',
};

export default function AttendancePage() {
  const { direction } = useTranslation();
  const { user } = useAuth();
  const studentId = user?.student?.id;
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: records, isLoading: recordsLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance-records', studentId],
    queryFn: () =>
      api.get(`/attendance/student/${studentId}`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const stats = useMemo(() => {
    if (!records || records.length === 0) return undefined;
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const percentage = (present / total) * 100;
    return { total, present, absent, late, excused, percentage };
  }, [records]);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    (records ?? []).forEach((r) => map.set(r.courseId, r.courseName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [records]);

  const filteredRecords = (records ?? []).filter((r) => {
    const matchesSearch =
      (r.courseName ?? '').includes(search) ||
      (r.lectureTitle ?? '').includes(search);
    const matchesCourse =
      filterCourse === 'all' || r.courseId === filterCourse;
    const matchesStatus =
      filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const courseAttendance = (records ?? []).reduce<
    Record<string, { present: number; total: number }>
  >((acc, r) => {
    if (!acc[r.courseId]) {
      acc[r.courseId] = { present: 0, total: 0 };
    }
    acc[r.courseId].total++;
    if (r.status === 'present') acc[r.courseId].present++;
    return acc;
  }, {});

  const handleExport = () => {
    const csv = [
      ['التاريخ', 'المقرر', 'المحاضرة', 'الحالة', 'طريقة التسجيل'].join(','),
      ...filteredRecords.map((r) =>
        [
          r.date,
          r.courseName,
          r.lectureTitle,
          statusLabels[r.status],
          markedByLabels[r.markedBy],
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 space-y-6"
      dir={direction}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">سجل الحضور</h1>
          <p className="text-muted-foreground">تتبع حضورك للمحاضرات</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 ml-1" />
          تصدير
        </Button>
      </motion.div>

      <AttendanceStatsCards stats={stats} isLoading={recordsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCalendar records={records} isLoading={recordsLoading} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نسبة الحضور حسب المقرر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(courseAttendance).length > 0 ? (
              Object.entries(courseAttendance).map(([courseId, data]) => {
                const percentage = (data.present / data.total) * 100;
                const course = records?.find((r) => r.courseId === courseId);
                return (
                  <div key={courseId} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{course?.courseName ?? courseId}</span>
                      <span className="font-mono">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-2 ${
                        percentage < 70 ? '[&>div]:bg-red-500' : ''
                      }`}
                    />
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            سجل الحضور التفصيلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="المقرر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المقررات</SelectItem>
                {courses?.map((c: CourseOption) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="excused">بعذر</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => { setSearch(''); setFilterCourse('all'); setFilterStatus('all'); }}>
              <Filter className="h-4 w-4 ml-1" />
              إعادة تعيين
            </Button>
          </div>

          {recordsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-3 px-2">التاريخ</th>
                    <th className="text-right py-3 px-2">المقرر</th>
                    <th className="text-right py-3 px-2">المحاضرة</th>
                    <th className="text-right py-3 px-2">الحالة</th>
                    <th className="text-right py-3 px-2">طريقة التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        {new Date(r.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-2 font-medium">{r.courseName}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {r.lectureTitle}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={statusColors[r.status]}
                        >
                          <UserCheck className="h-3 w-3 ml-1" />
                          {statusLabels[r.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {markedByLabels[r.markedBy]}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد سجلات حضور</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
