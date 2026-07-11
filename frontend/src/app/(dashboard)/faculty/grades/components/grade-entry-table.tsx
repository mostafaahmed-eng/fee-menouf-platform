'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ClipboardPaste, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GradeRow {
  id: string;
  student_id: string;
  student_name: string;
  marks: number | null;
  max_marks: number;
}

interface GradeEntryTableProps {
  students: GradeRow[];
  onMarksChange: (studentId: string, marks: number | null) => void;
  onSave: () => void;
  isSaving: boolean;
  componentName: string;
}

export default function GradeEntryTable({
  students,
  onMarksChange,
  onSave,
  isSaving,
  componentName,
}: GradeEntryTableProps) {
  const [search, setSearch] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteData, setPasteData] = useState('');

  const filtered = students.filter(
    (s) =>
      (s.student_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const handlePaste = () => {
    try {
      const lines = pasteData.trim().split('\n');
      lines.forEach((line) => {
        const parts = line.split(/[\t,]+/);
        if (parts.length >= 2) {
          const studentId = parts[0].trim();
          const marks = parseFloat(parts[1].trim());
          const student = students.find((s) => s.student_id === studentId);
          if (student && !isNaN(marks)) {
            onMarksChange(student.id, Math.min(marks, student.max_marks));
          }
        }
      });
      setPasteMode(false);
      setPasteData('');
    } catch {
      // ignore parse errors
    }
  };

  const validateGrade = (marks: number | null, max: number): 'valid' | 'over' | 'empty' => {
    if (marks === null || marks === undefined) return 'empty';
    if (marks > max) return 'over';
    return 'valid';
  };

  const validCount = students.filter((s) => validateGrade(s.marks, s.max_marks) === 'valid').length;
  const totalCount = students.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{componentName}</h3>
          <Badge variant="secondary">{validCount}/{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="h-9 pr-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteMode(!pasteMode)}
            className="gap-2"
          >
            <ClipboardPaste className="h-4 w-4" />
            لصق من Excel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </Button>
        </div>
      </div>

      {pasteMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg border bg-muted/30 p-4"
        >
          <p className="mb-2 text-sm text-muted-foreground">
            الصق البيانات من Excel (كود الطالب TAB الدرجة)
          </p>
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            className="min-h-[100px] w-full rounded-md border bg-background p-2 text-sm font-mono"
            placeholder={'STU001\t85\nSTU002\t92\nSTU003\t78'}
          />
          <Button size="sm" onClick={handlePaste} className="mt-2" disabled={!pasteData.trim()}>
            تطبيق
          </Button>
        </motion.div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-right font-medium">#</th>
              <th className="p-3 text-right font-medium">كود الطالب</th>
              <th className="p-3 text-right font-medium">الاسم</th>
              <th className="p-3 text-center font-medium">
                الدرجة (من {students[0]?.max_marks || 100})
              </th>
              <th className="p-3 text-center font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, idx) => {
              const validation = validateGrade(student.marks, student.max_marks);
              return (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b transition-colors hover:bg-muted/30"
                >
                  <td className="p-3 text-muted-foreground">{idx + 1}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {student.student_id}
                  </td>
                  <td className="p-3 font-medium">{student.student_name}</td>
                  <td className="p-3 text-center">
                    <Input
                      type="number"
                      value={student.marks ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onMarksChange(
                          student.id,
                          val === '' ? null : Math.min(parseFloat(val), student.max_marks),
                        );
                      }}
                      className={cn(
                        'mx-auto h-9 w-24 text-center',
                        validation === 'over' && 'border-red-500 focus-visible:ring-red-500',
                        validation === 'valid' && 'border-green-500',
                      )}
                      min={0}
                      max={student.max_marks}
                      step={0.5}
                    />
                  </td>
                  <td className="p-3 text-center">
                    {validation === 'valid' && (
                      <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                    )}
                    {validation === 'over' && (
                      <span className="flex items-center justify-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        تجاوز الحد
                      </span>
                    )}
                    {validation === 'empty' && (
                      <span className="text-xs text-muted-foreground">---</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
