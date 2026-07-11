'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Exam } from '@/lib/types';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Timer,
} from 'lucide-react';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('انتهى');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d}يوم ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="font-mono text-sm tabular-nums" dir="ltr">
      {remaining}
    </span>
  );
}

const examTypeColors: Record<string, string> = {
  midterm: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  final: 'bg-red-500/15 text-red-600 border-red-500/30',
  quiz: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  practical: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

const examTypeLabels: Record<string, string> = {
  midterm: 'منتصف الفصل',
  final: 'نهائي',
  quiz: 'اختبار قصير',
  practical: 'عملي',
};

export default function ExamsPage() {
  const { direction } = useTranslation();
  const { data: upcomingExams, isLoading: upcomingLoading } = useQuery<Exam[]>({
    queryKey: ['upcoming-exams'],
    queryFn: () => api.get('/exams').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const sortedUpcoming = (upcomingExams ?? []).sort(
    (a, b) =>
      new Date(`${a.date}T${a.startTime}`).getTime() -
      new Date(`${b.date}T${b.startTime}`).getTime(),
  );

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
      >
        <h1 className="text-2xl md:text-3xl font-bold">الامتحانات</h1>
        <p className="text-muted-foreground">
          جدول الامتحانات والنتائج
        </p>
      </motion.div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            <Clock className="h-4 w-4 ml-1" />
            الامتحانات القادمة
          </TabsTrigger>

          <TabsTrigger value="timetable">
            <Calendar className="h-4 w-4 ml-1" />
            جدول الامتحانات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : sortedUpcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedUpcoming.map((exam, i) => {
                const examDate = new Date(
                  `${exam.date}T${exam.startTime}`,
                ).getTime();
                const isNear = examDate - Date.now() < 86400000;

                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card
                      className={`${
                        isNear
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : ''
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">
                              {exam.course?.nameAr || exam.courseNameAr}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {exam.course?.nameEn || exam.courseNameEn}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${examTypeColors[exam.type]}`}
                              >
                                {examTypeLabels[exam.type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {exam.course?.code || exam.courseCode}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                isNear
                                  ? 'bg-amber-500/20 text-amber-600 animate-pulse'
                                  : ''
                              }`}
                            >
                              <Timer className="h-3 w-3 ml-1" />
                              <CountdownTimer
                                targetDate={`${exam.date}T${exam.startTime}`}
                              />
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(exam.date).toLocaleDateString('ar-EG', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {exam.startTime} - {exam.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>قاعة {exam.location || exam.hall}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Ticket className="h-4 w-4" />
                            <span>مقعد {exam.seatNumber}</span>
                          </div>
                        </div>

                        {exam.notes && (
                          <p className="text-xs text-muted-foreground mt-3 p-2 rounded bg-muted/30">
                            {exam.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                لا توجد امتحانات قادمة
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timetable">
          {upcomingLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">جدول الامتحانات</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {sortedUpcoming.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-right py-3 px-2">التاريخ</th>
                        <th className="text-right py-3 px-2">الوقت</th>
                        <th className="text-right py-3 px-2">المقرر</th>
                        <th className="text-right py-3 px-2">النوع</th>
                        <th className="text-right py-3 px-2">القاعة</th>
                        <th className="text-right py-3 px-2">المقعد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUpcoming.map((exam, i) => (
                        <motion.tr
                          key={exam.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-2">
                            {new Date(exam.date).toLocaleDateString('ar-EG', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </td>
                          <td className="py-3 px-2 font-mono">
                            {exam.startTime} - {exam.endTime}
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-medium">{exam.course?.nameAr || exam.courseNameAr}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {exam.course?.code || exam.courseCode}
                            </p>
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${examTypeColors[exam.type]}`}
                            >
                              {examTypeLabels[exam.type]}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">{exam.location || exam.hall}</td>
                          <td className="py-3 px-2 font-mono">
                            {exam.seatNumber}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    لا توجد امتحانات مجدولة
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
