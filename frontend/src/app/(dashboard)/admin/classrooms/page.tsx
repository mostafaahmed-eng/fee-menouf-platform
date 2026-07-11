'use client';


import { useTranslation } from '@/lib/i18n/use-translation';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Plus, Monitor } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Classroom } from '@/lib/types';

export default function ClassroomsPage() {
  const { direction } = useTranslation();
  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ['admin', 'classrooms'],
    queryFn: async () => {
      const { data } = await api.get('/classrooms');
      return data.data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/classrooms/${id}`, { isActive });
    },
    onSuccess: () => { toast.success('تم تحديث الحالة'); },
  });

  const typeLabels: Record<string, string> = {
    LECTURE_HALL: 'محاضرة', LAB: 'معمل', SEMINAR_ROOM: 'ندوة',
  };

  const typeColors: Record<string, string> = {
    LECTURE_HALL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LAB: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    SEMINAR_ROOM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة القاعات</h1>
          <p className="text-muted-foreground">إدارة قاعات المحاضرات والمعامل</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/admin/classrooms/create"><Plus className="h-4 w-4" /> قاعة جديدة</Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms?.map((room) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <CardDescription>{room.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={typeColors[room.type]}>{typeLabels[room.type]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{room.building} - الطابق {room.floor}</span>
                  </div>
                  <p className="text-sm">السعة: <strong>{room.capacity}</strong> طالب</p>
                  <div className="flex items-center gap-3 text-xs">
                    {room.hasProjector && <Badge variant="secondary"><Monitor className="h-3 w-3 ml-1" /> بروجيكتور</Badge>}
                    {room.hasComputers && <Badge variant="secondary"><Monitor className="h-3 w-3 ml-1" /> أجهزة</Badge>}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={room.isActive ? 'default' : 'secondary'}>
                      {room.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => toggleActive.mutate({ id: room.id, isActive: !room.isActive })}>
                      {room.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
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
