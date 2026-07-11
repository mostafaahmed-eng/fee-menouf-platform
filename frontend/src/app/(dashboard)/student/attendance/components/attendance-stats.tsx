'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Clock,
  FileBadge,
  TrendingUp,
} from 'lucide-react';
import type { AttendanceStats } from '@/lib/types';

interface AttendanceStatsCardsProps {
  stats?: AttendanceStats;
  isLoading?: boolean;
}

const statCards = [
  {
    key: 'present' as const,
    label: 'حاضر',
    icon: UserCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    key: 'absent' as const,
    label: 'غائب',
    icon: UserX,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    key: 'late' as const,
    label: 'متأخر',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    key: 'excused' as const,
    label: 'بعذر',
    icon: FileBadge,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
];

export default function AttendanceStatsCards({
  stats,
  isLoading,
}: AttendanceStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 h-full">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <TrendingUp className="h-6 w-6 text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">
              {stats.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">نسبة الحضور</p>
          </CardContent>
        </Card>
      </motion.div>

      {statCards.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className={`${item.bg} ${item.border} h-full`}>
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <Icon className={`h-6 w-6 ${item.color} mb-1`} />
                <p className={`text-2xl font-bold ${item.color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
