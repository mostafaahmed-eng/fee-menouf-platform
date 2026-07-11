'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CreateSemester() {
  const { direction } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nameAr: '', nameEn: '', type: 'FALL',
    startDate: '', endDate: '',
    registrationStart: '', registrationEnd: '',
    academicYearId: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/academic/semesters', formData);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء الفصل الدراسي');
      router.push('/admin/semesters');
    },
    onError: () => toast.error('حدث خطأ'),
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/semesters"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">فصل دراسي جديد</h1>
        <p className="text-muted-foreground">إنشاء فصل دراسي جديد للعام الأكاديمي</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الفصل</CardTitle>
          <CardDescription>أدخل تفاصيل الفصل الدراسي الجديد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم (عربي)</Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder="الفصل الدراسي الأول" />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} placeholder="First Semester" />
            </div>
            <div className="space-y-2">
              <Label>العام الأكاديمي</Label>
              <Input value={formData.academicYearId} onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })} placeholder="معرف العام الأكاديمي" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ النهاية</Label>
              <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>بداية التسجيل</Label>
              <Input type="date" value={formData.registrationStart} onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نهاية التسجيل</Label>
              <Input type="date" value={formData.registrationEnd} onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.nameAr} className="gap-2">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إنشاء الفصل
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/semesters">إلغاء</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
