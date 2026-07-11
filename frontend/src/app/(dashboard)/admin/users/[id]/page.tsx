'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';

export default function UserDetail() {
  const { direction } = useTranslation();
  const params = useParams();
  const id = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data.data;
    },
  });

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users"><ArrowLeft className="h-4 w-4 ml-1" /> العودة للمستخدمين</Link>
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-20 w-20 bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{(user?.fullNameEn?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)) || '?'}</span>
            </Avatar>
            <div className="text-center sm:text-right">
              <h1 className="text-2xl font-bold">{user?.fullNameEn}</h1>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                <Badge>{user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'إداري' : user?.role === 'DOCTOR' ? 'دكتور' : user?.role === 'TA' ? 'معيد' : user?.role === 'HEAD' ? 'رئيس قسم' : 'طالب'}</Badge>
                <Badge variant={user?.isActive ? 'default' : 'secondary'}>{user?.isActive ? 'نشط' : 'غير نشط'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" /> البريد الإلكتروني</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{user?.email}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Calendar className="h-4 w-4" /> تاريخ الإنشاء</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '---'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" /> آخر دخول</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : '---'}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
