'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Attendance } from '@/lib/types';

interface AttendanceCalendarProps {
  records?: Attendance[];
  isLoading?: boolean;
  year?: number;
  month?: number;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  late: 'bg-amber-500',
  excused: 'bg-blue-500',
};

export default function AttendanceCalendar({
  records,
  isLoading,
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
}: AttendanceCalendarProps) {
  const { direction } = useTranslation();
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const dayRecords = records?.filter((r) => r.date.startsWith(date)) ?? [];
      const statusCounts = { present: 0, absent: 0, late: 0, excused: 0 };
      dayRecords.forEach((r) => {
        statusCounts[r.status]++;
      });
      const dominant =
        dayRecords.length > 0
          ? (Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof statusCounts)
          : null;
      return {
        day: i + 1,
        date,
        records: dayRecords,
        dominant,
        count: dayRecords.length,
      };
    });
    return days;
  }, [records, year, month]);

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const monthName = new Date(year, month).toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل الحضور - {monthName}</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-7 gap-1.5" dir={direction}>
            {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((d) => (
              <div
                key={d}
                className="text-center text-xs text-muted-foreground font-medium py-1"
              >
                {d}
              </div>
            ))}
            {Array.from({
              length: new Date(year, month, 1).getDay(),
            }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarData.map((d) => (
              <div
                key={d.day}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium relative ${
                  d.dominant
                    ? `${STATUS_COLORS[d.dominant]} text-white`
                    : 'bg-muted/30 text-muted-foreground'
                }`}
                title={
                  d.count > 0
                    ? `${d.count} محاضرة${d.count > 1 ? 'ات' : ''}`
                    : undefined
                }
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" /> حاضر
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500" /> غائب
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500" /> متأخر
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500" /> بعذر
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
