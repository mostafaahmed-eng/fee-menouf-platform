'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Plus, Download } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScheduleEntry } from '@/lib/types';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const dayIndexToName = (index: number) => dayNames[index] || dayNamesEn[index];

export default function SchedulesPage() {
  const { direction } = useTranslation();
  const [selectedDay, setSelectedDay] = useState('all');

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const res = await api.get('/schedule');
      const items: ScheduleEntry[] = res.data.data || [];
      const grouped: Record<string, ScheduleEntry[]> = {};
      dayNames.forEach((name) => { grouped[name] = []; });
      items.forEach((entry) => {
        const dayName = dayIndexToName(entry.day);
        if (grouped[dayName]) {
          grouped[dayName].push(entry);
        }
      });
      return grouped;
    },
  });

  const schedule = scheduleData || {};

  const filteredDays = selectedDay === 'all'
    ? dayNames
    : [selectedDay];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
        <div className="grid gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة الجداول</h1>
          <p className="text-muted-foreground">عرض وإدارة جداول المحاضرات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> تصدير</Button>
          <Button className="gap-2" asChild>
            <Link href="/admin/schedules/generate"><Plus className="h-4 w-4" /> إنشاء جدول</Link>
          </Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="اليوم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأيام</SelectItem>
            {dayNames.map((day, i) => (
              <SelectItem key={i} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {filteredDays.map((day) => (
          <Card key={day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{day}</CardTitle>
              <CardDescription className="text-xs">
                {schedule[day]?.length || 0} محاضرة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {schedule[day]?.length > 0 ? (
                schedule[day].map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.courseCode}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.type === 'lecture' ? 'محاضرة' : entry.type === 'lab' ? 'معمل' : 'تمرين'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{entry.courseName}</p>
                    <div className="mt-1 flex items-center justify-between text-muted-foreground">
                      <span>{entry.startTime} - {entry.endTime}</span>
                      <span>{entry.classroom}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{entry.doctorName}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">لا توجد محاضرات</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
