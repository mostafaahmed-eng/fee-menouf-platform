'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence } from 'framer-motion';
import LectureBlock from './lecture-block';
import { Clock } from 'lucide-react';
import type { TimetableSlot } from '@/lib/types';

interface TimetableGridProps {
  slots?: TimetableSlot[];
  isLoading?: boolean;
  weekOffset?: number;
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const HOURS = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`);

export default function TimetableGrid({
  slots,
  isLoading,
}: TimetableGridProps) {
  const { direction } = useTranslation();
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-6 gap-1">
            <div />
            {DAY_NAMES.map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
            {Array.from({ length: 60 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const daySlots = (slots ?? []).reduce<Record<number, TimetableSlot[]>>(
    (acc, s) => {
      if (!acc[s.day]) acc[s.day] = [];
      acc[s.day].push(s);
      return acc;
    },
    {},
  );

  Object.values(daySlots).forEach((dayS) =>
    dayS.sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  const today = new Date().getDay();
  const egyptDay = today === 6 ? 0 : today + 1; // Convert JS Sunday=0 -> Egypt Sunday=0

  return (
    <div className="overflow-x-auto" dir={direction}>
      <div className="min-w-[800px]">
        <div
          className="grid gap-px bg-muted/50 rounded-lg overflow-hidden"
          style={{
            gridTemplateColumns: '70px repeat(5, 1fr)',
          }}
        >
          <div className="bg-card p-2 flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          {DAY_NAMES.map((name, i) => (
            <div
              key={i}
              className={`bg-card p-2 text-center text-sm font-medium ${
                i === egyptDay ? 'text-primary bg-primary/5' : ''
              }`}
            >
              {name}
              {i === egyptDay && (
                <span className="block text-[10px] text-primary font-normal">
                  اليوم
                </span>
              )}
            </div>
          ))}

          {HOURS.map((hour) => (
            <>
              <div
                key={`time-${hour}`}
                className="bg-card p-1 text-[10px] text-muted-foreground font-mono text-center flex items-center justify-center h-14 border-t border-muted/30"
              >
                {hour}
              </div>
              {[0, 1, 2, 3, 4].map((day) => {
                const slot = daySlots[day]?.find(
                  (s) =>
                    s.startTime.startsWith(hour.split(':')[0]),
                );
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`bg-card p-0.5 relative h-14 border-t border-muted/30 ${
                      day === egyptDay ? 'bg-primary/5' : ''
                    }`}
                  >
                    <AnimatePresence>
                      {slot && (
                        <LectureBlock
                          key={`${slot.day}-${slot.startTime}-${slot.courseCode}`}
                          slot={slot}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
