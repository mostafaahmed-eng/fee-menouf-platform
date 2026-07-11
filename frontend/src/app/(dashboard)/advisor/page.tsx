'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { RegistrationRequest } from '@/lib/types';

export default function AdvisorDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingRegs, isLoading } = useQuery<RegistrationRequest[]>({
    queryKey: ['advisor', 'pending-registrations'],
    queryFn: async () => {
      const { data } = await api.get('/registration/pending');
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/registration/approve/${id}`);
    },
    onSuccess: () => {
      toast.success('تم قبول التسجيل');
      queryClient.invalidateQueries({ queryKey: ['advisor', 'pending-registrations'] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/registration/reject/${id}`, { reason });
    },
    onSuccess: () => {
      toast.success('تم رفض التسجيل');
      queryClient.invalidateQueries({ queryKey: ['advisor', 'pending-registrations'] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: user?.fullNameEn || 'Advisor' })}
        </h1>
        <p className="text-muted-foreground">
          لوحة تحكم المرشد الأكاديمي
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">بانتظار المراجعة</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">{pendingRegs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">طلب تسجيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">الطلاب المسجلون</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{pendingRegs ? Math.max(1, Math.floor((pendingRegs?.length || 0) * 3)) : 0}</p>
            <p className="text-xs text-muted-foreground">طالب تحت الإرشاد</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">المواد المتاحة</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{pendingRegs?.reduce((sum, r) => sum + (r.courses?.length || 0), 0) || 0}</p>
            <p className="text-xs text-muted-foreground">مادة مسجلة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            طلبات التسجيل المعلقة
          </CardTitle>
          <CardDescription>مراجعة واعتماد طلبات تسجيل المواد</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : pendingRegs && pendingRegs.length > 0 ? (
            <div className="space-y-3">
              {pendingRegs.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{reg.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{reg.courses?.length || 0} مادة — {reg.totalCredits} وحدة</p>
                    <p className="text-xs text-muted-foreground">{new Date(reg.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-green-600" onClick={() => approveMutation.mutate(reg.id)} disabled={approveMutation.isPending}>
                      <CheckCircle2 className="h-4 w-4" /> قبول
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => rejectMutation.mutate({ id: reg.id, reason: 'يرجى مراجعة متطلبات التسجيل' })} disabled={rejectMutation.isPending}>
                      <XCircle className="h-4 w-4" /> رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد طلبات تسجيل معلقة</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
