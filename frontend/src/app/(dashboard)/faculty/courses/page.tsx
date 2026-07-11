'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, Clock, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FacultyCourse } from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FacultyCourses() {
  const { direction } = useTranslation();
  const { data: courses, isLoading } = useQuery<FacultyCourse[]>({
    queryKey: ['faculty', 'courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/faculty">
              <ArrowLeft className="h-4 w-4 ml-1" />
              العودة
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-2">المواد الدراسية</h1>
        <p className="text-muted-foreground">المواد التي تدرسها هذا الفصل الدراسي</p>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {courses?.map((course) => (
            <motion.div key={course.id} variants={item} whileHover={{ y: -4 }}>
              <Link href={`/faculty/courses/${course.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.nameAr}</CardTitle>
                        <CardDescription>{course.nameEn}</CardDescription>
                      </div>
                      <Badge>{course.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.credits} وحدات</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.credits} وحدات دراسية</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.scheduleTime}</span>
                    </div>
                    {course.room && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{course.room}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
