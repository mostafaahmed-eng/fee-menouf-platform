'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import PrerequisitesCheck from './prerequisites-check';
import {
  Clock,
  Users,
  BookOpen,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { Course, CourseSchedule } from '@/lib/types';

interface CourseCardProps {
  course: Course;
  isRegistered?: boolean;
  onRegister?: (courseId: string) => void;
  onDrop?: (courseId: string) => void;
  isLoading?: boolean;
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

function ScheduleDisplay({ schedule }: { schedule: CourseSchedule[] }) {
  if (!schedule || schedule.length === 0) return null;
  return (
    <div className="space-y-1">
      {schedule.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {DAY_NAMES[s.day]} | {s.startTime} - {s.endTime}
          </span>
          <span className="mr-auto">قاعة {s.room}</span>
        </div>
      ))}
    </div>
  );
}

export default function CourseCard({
  course,
  isRegistered = false,
  onRegister,
  onDrop,
  isLoading,
}: CourseCardProps) {
  const isFull = (course.maxStudents ?? 0) >= course.capacity;
  const capacityPercent = course.capacity > 0 ? Math.min(((course.maxStudents ?? 0) / course.capacity) * 100, 100) : 0;
  const prerequisitesMet = course.prerequisites?.every((p) => p.isCompleted) ?? true;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`h-full ${
          isRegistered ? 'border-emerald-500/50 bg-emerald-500/5' : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono">
                {course.code}
              </p>
              <h3 className="font-semibold text-base">{course.nameAr}</h3>
              <p className="text-sm text-muted-foreground">{course.nameEn}</p>
            </div>
            <Badge variant={isRegistered ? 'default' : 'outline'}>
              <BookOpen className="h-3 w-3 ml-1" />
              {course.credits} س.م
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <ScheduleDisplay schedule={course.schedule ?? []} />

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                السعة
              </span>
              <span>
                {course.maxStudents ?? 0}/{course.capacity}
              </span>
            </div>
            <Progress
              value={capacityPercent}
              className={`h-1.5 ${
                isFull ? 'bg-red-200 [&>div]:bg-red-500' : ''
              }`}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <span>د. {course.doctorId || '—'}</span>
          </div>

          <PrerequisitesCheck prerequisites={course.prerequisites ?? []} />
        </CardContent>
        <CardFooter className="pt-0">
          {isRegistered ? (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onDrop?.(course.id)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 ml-1" />
              حذف المقرر
            </Button>
          ) : (
            <Button
              variant={prerequisitesMet && !isFull ? 'default' : 'secondary'}
              size="sm"
              className="w-full"
              onClick={() => onRegister?.(course.id)}
              disabled={!prerequisitesMet || isFull || isLoading}
            >
              {isFull ? (
                <>
                  <AlertTriangle className="h-4 w-4 ml-1" />
                  ممتلئ
                </>
              ) : !prerequisitesMet ? (
                <>
                  <AlertTriangle className="h-4 w-4 ml-1" />
                  متطلبات سابقة
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-1" />
                  تسجيل
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
