'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { motion } from 'framer-motion';
import type { TimetableSlot } from '@/lib/types';

interface LectureBlockProps {
  slot: TimetableSlot;
  onClick?: () => void;
  variant?: 'grid' | 'list';
}

export default function LectureBlock({
  slot,
  onClick,
  variant = 'grid',
}: LectureBlockProps) {
  const { direction } = useTranslation();
  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onClick}
        dir={direction}
      >
        <div
          className="w-1.5 h-10 rounded-full shrink-0"
          style={{ backgroundColor: slot.color }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{slot.courseName}</p>
          <p className="text-xs text-muted-foreground">
            د. {slot.doctorName} | قاعة {slot.room}
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-mono shrink-0 text-left">
          {slot.startTime} - {slot.endTime}
        </div>
      </motion.div>
    );
  }

  const startTime = slot?.startTime ?? '8:00';
  const endTime = slot?.endTime ?? '9:00';
  const startHour = parseInt(startTime.split(':')[0]) || 8;
  const endHour = parseInt(endTime.split(':')[0]) || 9;
  const startMin = parseInt(startTime.split(':')[1]) || 0;
  const topOffset = ((startHour - 8) * 60 + startMin) * (60 / 60) + 8;

  const durationMinutes =
    (endHour - startHour) * 60 +
    (parseInt(endTime.split(':')[1]) || 0) -
    startMin;
  const height = Math.max(durationMinutes, 40);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      className="absolute right-1 left-1 rounded-lg p-2 overflow-hidden cursor-pointer shadow-sm border border-white/20"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${slot.color}20`,
        borderColor: `${slot.color}40`,
      }}
      onClick={onClick}
      dir={direction}
    >
      <p className="font-semibold text-xs leading-tight truncate">
        {slot.courseName}
      </p>
      {height > 50 && (
        <>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            قاعة {slot.room}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            د. {slot.doctorName}
          </p>
        </>
      )}
      <p className="text-[9px] text-muted-foreground/70 mt-0.5 font-mono">
        {slot.startTime}
      </p>
    </motion.div>
  );
}
