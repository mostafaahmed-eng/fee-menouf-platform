'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import type { AcademicSemester } from '@/lib/types';

interface SemesterCardProps {
  semester: AcademicSemester;
  index: number;
}

export default function SemesterCard({ semester, index }: SemesterCardProps) {
  const [expanded, setExpanded] = useState(index === 0);

  const total = semester.courses.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className="cursor-pointer overflow-hidden"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {semester.academicYear} - {semester.semester}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {total} مقرر{total > 1 ? 'ات' : ''} | {semester.totalCredits}{' '}
                  ساعة معتمدة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left">
                <Badge variant="secondary" className="text-xs">
                  GPA: {semester.gpa?.toFixed(2) ?? '0.00'}
                </Badge>
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t space-y-2">
                  {semester.courses.map((course) => (
                    <div
                      key={course.courseCode}
                      className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {course.courseCode}
                        </span>
                        <span className={!course.isPassed ? 'text-red-600 dark:text-red-400' : ''}>
                          {course.courseNameAr}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {course.credits} س.م
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            !course.isPassed
                              ? 'border-red-400 text-red-600'
                              : ''
                          }`}
                        >
                          {course.gradeLetter}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
