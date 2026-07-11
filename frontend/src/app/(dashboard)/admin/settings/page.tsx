'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Bell,
  Shield,
  Save,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { direction } = useTranslation();
  const [settings, setSettings] = useState({
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

  const handleSave = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

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
              <Input value={settings.academicYear} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الفصل الدراسي الحالي</Label>
              <Input value={settings.currentSemester} onChange={(e) => setSettings({ ...settings, currentSemester: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للوحدات لكل فصل</Label>
              <Input type="number" value={settings.maxCreditsPerSemester} onChange={(e) => setSettings({ ...settings, maxCreditsPerSemester: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نسبة الحضور الدنيا (%)</Label>
              <Input type="number" value={settings.attendanceThreshold} onChange={(e) => setSettings({ ...settings, attendanceThreshold: +e.target.value })} />
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
              <Switch checked={settings.registrationOpen} onCheckedChange={(v) => setSettings({ ...settings, registrationOpen: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">نشر الدرجات</Label><p className="text-xs text-muted-foreground">تمكين نشر الدرجات للطلاب</p></div>
              <Switch checked={settings.gradePublishingEnabled} onCheckedChange={(v) => setSettings({ ...settings, gradePublishingEnabled: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">المساعد الذكي</Label><p className="text-xs text-muted-foreground">تفعيل المساعد بالذكاء الاصطناعي</p></div>
              <Switch checked={settings.aiAssistantEnabled} onCheckedChange={(v) => setSettings({ ...settings, aiAssistantEnabled: v })} />
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
              <Switch checked={settings.notificationEmail} onCheckedChange={(v) => setSettings({ ...settings, notificationEmail: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">إشعارات SMS</Label><p className="text-xs text-muted-foreground">إرسال إشعارات عبر الرسائل النصية</p></div>
              <Switch checked={settings.notificationSms} onCheckedChange={(v) => setSettings({ ...settings, notificationSms: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" size="lg">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
