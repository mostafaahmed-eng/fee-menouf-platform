'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StudentAttendance {
  id: string;
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

interface AttendanceTableProps {
  students: StudentAttendance[];
  onStatusChange: (studentId: string, status: StudentAttendance['status']) => void;
  onBulkAction: (status: StudentAttendance['status']) => void;
}

const statusColors = {
  present: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  excused: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const statusLabels: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'معذور',
};

export default function AttendanceTable({
  students,
  onStatusChange,
  onBulkAction,
}: AttendanceTableProps) {
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) =>
    (s.student_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
    excused: students.filter((s) => s.status === 'excused').length,
    unmarked: students.filter((s) => !s.status).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-5 gap-2 text-center text-sm">
        {[
          { key: 'present', label: 'حاضر', count: stats.present, color: 'text-green-600 dark:text-green-400' },
          { key: 'absent', label: 'غائب', count: stats.absent, color: 'text-red-600 dark:text-red-400' },
          { key: 'late', label: 'متأخر', count: stats.late, color: 'text-amber-600 dark:text-amber-400' },
          { key: 'excused', label: 'معذور', count: stats.excused, color: 'text-blue-600 dark:text-blue-400' },
          { key: 'unmarked', label: 'غير محدد', count: stats.unmarked, color: 'text-muted-foreground' },
        ].map((stat) => (
          <div key={stat.key} className="rounded-lg border p-2">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن طالب..."
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => onBulkAction(status)}
              className="text-xs"
            >
              تعيين الكل: {statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-right font-medium">#</th>
              <th className="p-3 text-right font-medium">الكود</th>
              <th className="p-3 text-right font-medium">اسم الطالب</th>
              <th className="p-3 text-center font-medium">الحالة</th>
              <th className="p-3 text-center font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, idx) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={cn(
                  'border-b transition-colors hover:bg-muted/30',
                  student.status === 'absent' && 'bg-red-50/50 dark:bg-red-950/10',
                )}
              >
                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{student.student_id}</td>
                <td className="p-3 font-medium">{student.student_name}</td>
                <td className="p-3 text-center">
                  {student.status ? (
                    <Badge
                      variant="outline"
                      className={cn('border', student.status && statusColors[student.status])}
                    >
                      {statusLabels[student.status]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">---</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                      <Button
                        key={status}
                        variant={student.status === status ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-8 w-8',
                          student.status === status && status === 'present' && 'bg-green-500 hover:bg-green-600',
                          student.status === status && status === 'absent' && 'bg-red-500 hover:bg-red-600',
                          student.status === status && status === 'late' && 'bg-amber-500 hover:bg-amber-600',
                          student.status === status && status === 'excused' && 'bg-blue-500 hover:bg-blue-600',
                        )}
                        onClick={() => onStatusChange(student.id, status)}
                        title={statusLabels[status]}
                      >
                        {status === 'present' && <Check className="h-3.5 w-3.5" />}
                        {status === 'absent' && <X className="h-3.5 w-3.5" />}
                        {status === 'late' && <Clock className="h-3.5 w-3.5" />}
                        {status === 'excused' && <AlertCircle className="h-3.5 w-3.5" />}
                      </Button>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
