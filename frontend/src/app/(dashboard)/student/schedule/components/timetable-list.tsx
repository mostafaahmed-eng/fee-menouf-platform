'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import LectureBlock from './lecture-block';
import { CalendarDays } from 'lucide-react';
import type { TimetableSlot } from '@/lib/types';

interface TimetableListProps {
  slots?: TimetableSlot[];
  isLoading?: boolean;
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function TimetableList({ slots, isLoading }: TimetableListProps) {
  const { direction } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const groupedByDay = (slots ?? []).reduce<Record<number, TimetableSlot[]>>(
    (acc, s) => {
      if (!acc[s.day]) acc[s.day] = [];
      acc[s.day].push(s);
      return acc;
    },
    {},
  );

  if (slots?.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد محاضرات مجدولة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      {[0, 1, 2, 3, 4].map((day) => {
        const daySlots = groupedByDay[day] ?? [];
        if (daySlots.length === 0) return null;
        daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <div key={day}>
            <h3 className="font-semibold text-sm mb-2 text-primary">
              {DAY_NAMES[day]}
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {daySlots.map((slot) => (
                  <LectureBlock
                    key={`${slot.day}-${slot.startTime}-${slot.courseCode}`}
                    slot={slot}
                    variant="list"
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
