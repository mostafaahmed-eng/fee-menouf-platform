'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Bell,
  Shield,
  Save,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { SystemSettings } from '@/lib/types';

export default function SettingsPage() {
  const { direction } = useTranslation();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data.data ?? data;
    },
  });

  const [form, setForm] = useState<SystemSettings>({
    academicYear: '2025-2026',
    currentSemester: '1',
    registrationOpen: true,
    gradePublishingEnabled: true,
    maxCreditsPerSemester: 18,
    attendanceThreshold: 75,
    aiAssistantEnabled: true,
    notificationEmail: true,
    notificationSms: false,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SystemSettings) => {
      const { data } = await api.patch('/settings', payload);
      return data.data ?? data;
    },
    onSuccess: (data: SystemSettings) => {
      queryClient.setQueryData(['admin', 'settings'], data);
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir={direction}>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">إعدادات النظام</h1>
        <p className="text-muted-foreground">تكوين وإعدادات النظام العامة</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              الإعدادات الأكاديمية
            </CardTitle>
            <CardDescription>تكوين العام الدراسي والفصل الحالي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>العام الدراسي</Label>
              <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الفصل الدراسي الحالي</Label>
              <Input value={form.currentSemester} onChange={(e) => setForm({ ...form, currentSemester: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للوحدات لكل فصل</Label>
              <Input type="number" value={form.maxCreditsPerSemester} onChange={(e) => setForm({ ...form, maxCreditsPerSemester: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نسبة الحضور الدنيا (%)</Label>
              <Input type="number" value={form.attendanceThreshold} onChange={(e) => setForm({ ...form, attendanceThreshold: +e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              إعدادات التمكين
            </CardTitle>
            <CardDescription>تفعيل أو تعطيل الخدمات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">فتح التسجيل</Label><p className="text-xs text-muted-foreground">السماح للطلاب بتسجيل المواد</p></div>
              <Switch checked={form.registrationOpen} onCheckedChange={(v) => setForm({ ...form, registrationOpen: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">نشر الدرجات</Label><p className="text-xs text-muted-foreground">تمكين نشر الدرجات للطلاب</p></div>
              <Switch checked={form.gradePublishingEnabled} onCheckedChange={(v) => setForm({ ...form, gradePublishingEnabled: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">المساعد الذكي</Label><p className="text-xs text-muted-foreground">تفعيل المساعد بالذكاء الاصطناعي</p></div>
              <Switch checked={form.aiAssistantEnabled} onCheckedChange={(v) => setForm({ ...form, aiAssistantEnabled: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription>التحكم في طرق الإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">الإشعارات البريدية</Label><p className="text-xs text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p></div>
              <Switch checked={form.notificationEmail} onCheckedChange={(v) => setForm({ ...form, notificationEmail: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">إشعارات SMS</Label><p className="text-xs text-muted-foreground">إرسال إشعارات عبر الرسائل النصية</p></div>
              <Switch checked={form.notificationSms} onCheckedChange={(v) => setForm({ ...form, notificationSms: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" size="lg" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
