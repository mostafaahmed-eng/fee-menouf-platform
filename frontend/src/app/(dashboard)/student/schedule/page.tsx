'use client';



import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimetableGrid from './components/timetable-grid';
import TimetableList from './components/timetable-list';
import { useTranslation } from '@/lib/i18n/use-translation';
import api from '@/lib/api';
import type { TimetableSlot } from '@/lib/types';
import {
  Grid3X3,
  List,
  Download,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export default function SchedulePage() {
  const { direction } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: slots, isLoading } = useQuery<TimetableSlot[]>({
    queryKey: ['timetable', weekOffset],
    queryFn: () =>
      api
        .get('/schedule', { params: { weekOffset } })
        .then((r) => r.data.data),
  });

  const weekStart = new Date();
  weekStart.setDate(
    weekStart.getDate() + weekOffset * 7 - weekStart.getDay(),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);

  const handleExport = () => {
    if (!slots) return;
    const csv = [
      ['اليوم', 'المقرر', 'بداية', 'نهاية', 'قاعة', 'دكتور'].join(','),
      ...slots.map((s) =>
        [
          ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][s.day],
          s.courseName,
          s.startTime,
          s.endTime,
          s.room,
          s.doctorName,
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">الجدول الدراسي</h1>
          <p className="text-muted-foreground text-sm">
            {weekStart.toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'long',
            })}{' '}
            -{' '}
            {weekEnd.toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 ml-1" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p - 1)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="text-xs px-2">
            {weekOffset === 0
              ? 'هذا الأسبوع'
              : weekOffset < 0
              ? `${Math.abs(weekOffset)} أسابيع سابقة`
              : `${weekOffset} أسابيع قادمة`}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p + 1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              هذا الأسبوع
            </Button>
          )}
        </div>
      </motion.div>

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as 'grid' | 'list')}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3X3 className="h-4 w-4 ml-1" />
              شبكي
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 ml-1" />
              قائمة
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid">
          <Card>
            <CardContent className="p-4">
              <TimetableGrid slots={slots} isLoading={isLoading} weekOffset={weekOffset} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-4">
              <TimetableList slots={slots} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
