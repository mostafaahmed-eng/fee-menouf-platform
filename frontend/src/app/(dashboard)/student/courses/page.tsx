'use client';



import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import type { RegisteredCourse } from '@/lib/types';
import {
  Search,
  BookOpen,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function CoursesPage() {
  const { direction } = useTranslation();
  const { user } = useAuth();
  const studentId = user?.student?.id;
  const [search, setSearch] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery<RegisteredCourse[]>({
    queryKey: ['my-courses', studentId],
    queryFn: () =>
      api.get(`/registration/student/${studentId}`).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const filteredCourses = (courses ?? []).filter((rc) => {
    const c = rc.course;
    return (
      (c.nameAr ?? '').includes(search) ||
      (c.nameEn ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.code ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

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
          <h1 className="text-2xl md:text-3xl font-bold">مقرراتي</h1>
          <p className="text-muted-foreground">
            جميع المقررات المسجلة
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مقرر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((rc, i) => {
              const c = rc.course;
              const isExpanded = expandedCourse === c.id;

              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      setExpandedCourse(isExpanded ? null : c.id)
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{c.nameAr}</h3>
                            <p className="text-sm text-muted-foreground">
                              {c.nameEn}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs font-mono">
                                {c.code}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {c.credits} س.م
                              </Badge>
                              {rc.status === 'completed' && (
                                <Badge className="text-xs bg-emerald-500">
                                  مكتمل
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t space-y-4">
                              {c.description && (
                                <p className="text-sm text-muted-foreground">
                                  {c.description}
                                </p>
                              )}

                              <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 rounded-lg bg-muted/30">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      د. {c.doctorId || '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {c.schedule && c.schedule.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    مواعيد المحاضرات
                                  </h4>
                                  <div className="space-y-1">
                                    {c.schedule.map((s, idx) => (
                                      <div
                                        key={idx}
                                        className="text-sm text-muted-foreground"
                                      >
                                        {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][
                                          s.day
                                        ]}{' '}
                                        | {s.startTime} - {s.endTime} | قاعة{' '}
                                        {s.room}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            لا توجد مقررات مسجلة
          </p>
          <Button
            className="mt-3"
            onClick={() => (window.location.href = '/student/course-registration')}
          >
            تسجيل مقررات
          </Button>
        </div>
      )}
    </motion.div>
  );
}
