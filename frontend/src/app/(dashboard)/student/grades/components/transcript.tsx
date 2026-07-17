'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, GraduationCap } from 'lucide-react';
import type { Grade } from '@/lib/types';

interface TranscriptProps {
  grades?: Grade[];
  cgpa?: number;
  totalCredits?: number;
  studentName?: string;
  studentId?: string;
  isLoading?: boolean;
}

const gradeLetterColors: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-600',
  'A': 'bg-emerald-500/15 text-emerald-600',
  'A-': 'bg-emerald-500/10 text-emerald-600',
  'B+': 'bg-blue-500/15 text-blue-600',
  'B': 'bg-blue-500/15 text-blue-600',
  'B-': 'bg-blue-500/10 text-blue-600',
  'C+': 'bg-amber-500/15 text-amber-600',
  'C': 'bg-amber-500/15 text-amber-600',
  'C-': 'bg-amber-500/10 text-amber-600',
  'D+': 'bg-orange-500/15 text-orange-600',
  'D': 'bg-orange-500/15 text-orange-600',
  'F': 'bg-red-500/15 text-red-600',
};

export default function Transcript({
  grades,
  cgpa,
  totalCredits,
  studentName,
  studentId,
  isLoading,
}: TranscriptProps) {
  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const groupedBySemester = (grades ?? []).reduce<
    Record<string, Grade[]>
  >((acc, g) => {
    const key = `${g.academicYear} - ${g.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            السجل الأكاديمي
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="h-4 w-4 ml-1" />
            طباعة
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">الاسم</p>
                <p className="font-medium">{studentName || '---'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">الرقم الجامعي</p>
                <p className="font-medium">{studentId || '---'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CGPA</p>
                <p className="font-medium text-lg text-primary">{Number(cgpa ?? 0).toFixed(2) || '---'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">إجمالي الساعات</p>
                <p className="font-medium">{totalCredits || 0}</p>
              </div>
            </div>
          </div>

          {Object.entries(groupedBySemester).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedBySemester).map(([semester, semGrades]) => {
                const semGpa =
                  semGrades.length > 0
                    ? Number(
                        semGrades.reduce((sum, g) => sum + g.gpaPoints * g.credits, 0) /
                        semGrades.reduce((sum, g) => sum + g.credits, 0)
                      ).toFixed(2)
                    : '0.00';
                return (
                  <div key={semester}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{semester}</h3>
                      <Badge variant="secondary" className="text-xs">
                        GPA: {semGpa}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs">
                            <th className="text-right py-2 px-2">الكود</th>
                            <th className="text-right py-2 px-2">المقرر</th>
                            <th className="text-right py-2 px-2">الساعات</th>
                            <th className="text-right py-2 px-2">التقدير</th>
                            <th className="text-right py-2 px-2">النقاط</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semGrades.map((g) => (
                            <tr key={g.id} className="border-b last:border-0">
                              <td className="py-2 px-2 font-mono text-muted-foreground">
                                {g.courseCode}
                              </td>
                              <td className="py-2 px-2">{g.course?.nameAr || g.courseNameAr}</td>
                              <td className="py-2 px-2">{g.credits}</td>
                              <td className="py-2 px-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    gradeLetterColors[g.gradeLetter] ?? ''
                                  }`}
                                >
                                  {g.gradeLetter}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-mono">{g.gpaPoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              لا توجد بيانات
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
