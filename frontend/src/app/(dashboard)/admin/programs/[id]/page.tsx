'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, BookOpen, Calendar, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Program } from '@/lib/types';

export default function ProgramDetail() {
  const { direction } = useTranslation();
  const params = useParams();
  const programId = params.id as string;

  const { data: program, isLoading } = useQuery<Program>({
    queryKey: ['admin', 'program', programId],
    queryFn: async () => {
      const { data } = await api.get(`/programs/${programId}`);
      return data.data;
    },
    enabled: !!programId,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/programs"><ArrowLeft className="h-4 w-4 ml-1" /> العودة للبرامج</Link>
        </Button>
        <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">البرنامج غير موجود</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/programs"><ArrowLeft className="h-4 w-4 ml-1" /> العودة للبرامج</Link>
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{program.nameAr}</CardTitle>
                <CardDescription>{program.nameEn}</CardDescription>
              </div>
              <Badge className="mr-auto">{program.code}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">القسم</p>
                  <p className="text-lg font-bold">{program.department?.nameAr || program.department?.nameEn || program.departmentId}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <GraduationCap className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">الدرجة</p>
                  <p className="text-lg font-bold">{program.degree}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">المدة</p>
                  <p className="text-lg font-bold">{program.duration} سنوات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">الوحدات</p>
                  <p className="text-lg font-bold">{program.totalCredits}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
