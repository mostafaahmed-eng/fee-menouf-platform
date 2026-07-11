'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Semester } from '@/lib/types';

export default function SemestersPage() {
  const { direction } = useTranslation();
  const { data: semesters, isLoading } = useQuery<Semester[]>({
    queryKey: ['admin', 'semesters'],
    queryFn: async () => {
      const { data } = await api.get('/academic/semesters');
      return data.data;
    },
  });



  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة الفصول الدراسية</h1>
          <p className="text-muted-foreground">إدارة الفصول الدراسية والسنوات الأكاديمية</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/admin/semesters/create"><Plus className="h-4 w-4" /> فصل جديد</Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {semesters?.map((sem) => (
            <motion.div key={sem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={sem.isActive ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{sem.nameAr}</h3>
                          {sem.isActive && <Badge>الحالي</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{sem.nameEn} - {sem.type}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>البداية: {new Date(sem.startDate).toLocaleDateString('ar-EG')}</span>
                          <span>النهاية: {new Date(sem.endDate).toLocaleDateString('ar-EG')}</span>
                          <span>التسجيل: {new Date(sem.registrationStart).toLocaleDateString('ar-EG')} - {new Date(sem.registrationEnd).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sem.isActive ? 'default' : 'secondary'}>
                        {sem.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
