'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateClassroom() {
  const { direction } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '', name: '', building: '', floor: 1,
    capacity: 30, type: 'LECTURE_HALL',
    hasProjector: false, hasComputers: false,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/classrooms', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء القاعة');
      router.push('/admin/classrooms');
    },
    onError: () => toast.error('حدث خطأ'),
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/classrooms"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">قاعة جديدة</h1>
        <p className="text-muted-foreground">إضافة قاعة محاضرات أو معمل جديد</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات القاعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الكود</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="HALL-101" />
            </div>
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="قاعة 101" />
            </div>
            <div className="space-y-2">
              <Label>المبنى</Label>
              <Input value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} placeholder="المبنى الرئيسي" />
            </div>
            <div className="space-y-2">
              <Label>الطابق</Label>
              <Input type="number" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>السعة</Label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LECTURE_HALL">محاضرة</SelectItem>
                  <SelectItem value="LAB">معمل</SelectItem>
                  <SelectItem value="SEMINAR_ROOM">ندوة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <h3 className="font-medium">المميزات</h3>
            <div className="flex items-center justify-between">
              <Label>بروجيكتور</Label>
              <Switch checked={formData.hasProjector} onCheckedChange={(v) => setFormData({ ...formData, hasProjector: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>أجهزة حاسب</Label>
              <Switch checked={formData.hasComputers} onCheckedChange={(v) => setFormData({ ...formData, hasComputers: v })} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.code} className="gap-2">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إنشاء القاعة
            </Button>
            <Button variant="outline" asChild><Link href="/admin/classrooms">إلغاء</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
