'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import type { Grade } from '@/lib/types';

interface GradeTableProps {
  grades?: Grade[];
  isLoading?: boolean;
}

const gradeLetterColors: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'A': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'A-': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'B+': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  'B': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  'B-': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'C+': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'C': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'C-': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'D+': 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  'D': 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  'F': 'bg-red-500/15 text-red-600 border-red-500/30',
};

export default function GradeTable({ grades, isLoading }: GradeTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!grades || grades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>لا توجد درجات متاحة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-right py-3 px-2">المقرر</th>
            <th className="text-right py-3 px-2">أعمال السنة</th>
            <th className="text-right py-3 px-2">منتصف الفصل</th>
            <th className="text-right py-3 px-2">النهائي</th>
            <th className="text-right py-3 px-2">المجموع</th>
            <th className="text-right py-3 px-2">التقدير</th>
            <th className="text-right py-3 px-2">النقاط</th>
            <th className="text-right py-3 px-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g, i) => (
            <motion.tr
              key={g.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-2">
                <p className="font-medium">{g.course?.nameAr || g.courseNameAr}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {g.courseCode}
                </p>
              </td>
              <td className="py-3 px-2 font-mono">{g.coursework}</td>
              <td className="py-3 px-2 font-mono">{g.midterm}</td>
              <td className="py-3 px-2 font-mono">{g.final}</td>
              <td className="py-3 px-2 font-mono font-medium">{g.total}</td>
              <td className="py-3 px-2">
                <Badge
                  variant="outline"
                  className={gradeLetterColors[g.gradeLetter] ?? ''}
                >
                  {g.gradeLetter}
                </Badge>
              </td>
              <td className="py-3 px-2 font-mono">{g.gpaPoints}</td>
              <td className="py-3 px-2">
                {g.isPublished ? (
                  <Eye className="h-4 w-4 text-emerald-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-amber-500" />
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
