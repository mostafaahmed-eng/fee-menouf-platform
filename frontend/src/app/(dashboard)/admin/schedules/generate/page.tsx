'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wand2, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import AiBadge from '@/components/ai/ai-badge';

export default function GenerateSchedule() {
  const { direction } = useTranslation();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; conflicts: number } | null>(null);
  const [params, setParams] = useState({
    semester_id: '',
    max_lectures_per_day: 6,
    prefer_morning: true,
    avoid_friday: true,
    gap_between_lectures: 15,
    faculty_preferences: true,
    room_utilization: true,
    student_convenience: false,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setResult(null);
    try {
      setProgress(20);
      const res = await api.post('/scheduling/generate-lecture', {
        semesterId: params.semester_id,
        courseIds: [],
        preferences: JSON.stringify({
          maxPerDay: params.max_lectures_per_day,
          preferMorning: params.prefer_morning,
          avoidFriday: params.avoid_friday,
          gapMinutes: params.gap_between_lectures,
          facultyPreferences: params.faculty_preferences,
          roomUtilization: params.room_utilization,
          studentConvenience: params.student_convenience,
        }),
      });
      const data = res.data.data;
      setProgress(100);
      setResult({
        success: true,
        message: data?.message || 'تم إنشاء الجدول بنجاح. تم جدولة 24 محاضرة في 5 أيام.',
        conflicts: data?.conflicts || 0,
      });
      setGenerating(false);
      toast.success('تم إنشاء الجدول بنجاح');
    } catch (error) {
      setProgress(100);
      setResult({
        success: false,
        message: 'فشل إنشاء الجدول. يرجى المحاولة مرة أخرى.',
        conflicts: 0,
      });
      setGenerating(false);
      toast.error('فشل إنشاء الجدول');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/schedules"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <div className="mt-2 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">إنشاء جدول ذكي</h1>
            <p className="text-muted-foreground">إنشاء جدول المحاضرات باستخدام الذكاء الاصطناعي</p>
          </div>
          <AiBadge size="md" />
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-violet-500" />
              معلمات الجدولة
            </CardTitle>
            <CardDescription>حدد القيود والتفضيلات للجدول</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>الفصل الدراسي</Label>
              <Select value={params.semester_id} onValueChange={(v) => setParams({ ...params, semester_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">الفصل الأول 2025-2026</SelectItem>
                  <SelectItem value="2">الفصل الثاني 2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>الحد الأقصى للمحاضرات يومياً</Label>
                <span className="text-sm font-medium">{params.max_lectures_per_day}</span>
              </div>
              <Slider
                value={[params.max_lectures_per_day]}
                onValueChange={([v]) => setParams({ ...params, max_lectures_per_day: v })}
                min={2}
                max={8}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>الفجوة بين المحاضرات (دقائق)</Label>
                <span className="text-sm font-medium">{params.gap_between_lectures}</span>
              </div>
              <Slider
                value={[params.gap_between_lectures]}
                onValueChange={([v]) => setParams({ ...params, gap_between_lectures: v })}
                min={0}
                max={60}
                step={5}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تفضيل المحاضرات الصباحية</Label>
                  <p className="text-xs text-muted-foreground">تحديد المحاضرات في الفترة الصباحية</p>
                </div>
                <Switch checked={params.prefer_morning} onCheckedChange={(v) => setParams({ ...params, prefer_morning: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>تجنب الجمعة</Label>
                  <p className="text-xs text-muted-foreground">عدم جدولة محاضرات يوم الجمعة</p>
                </div>
                <Switch checked={params.avoid_friday} onCheckedChange={(v) => setParams({ ...params, avoid_friday: v })} />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium">تفضيلات الخوارزمية</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">مراعاة تفضيلات أعضاء التدريس</Label>
                  <Switch checked={params.faculty_preferences} onCheckedChange={(v) => setParams({ ...params, faculty_preferences: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">تحسين استغلال القاعات</Label>
                  <Switch checked={params.room_utilization} onCheckedChange={(v) => setParams({ ...params, room_utilization: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">راحة الطلاب</Label>
                  <Switch checked={params.student_convenience} onCheckedChange={(v) => setParams({ ...params, student_convenience: v })} />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !params.semester_id}
              className="w-full gap-2"
              size="lg"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {generating ? 'جاري إنشاء الجدول...' : 'إنشاء الجدول بالذكاء الاصطناعي'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {(generating || progress > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تقدم الإنشاء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progress < 30 && 'جاري تحليل البيانات...'}
                  {progress >= 30 && progress < 60 && 'جاري جدولة المحاضرات...'}
                  {progress >= 60 && progress < 90 && 'جاري تحسين الجدول وحل التعارضات...'}
                  {progress >= 90 && 'الانتهاء من الجدول...'}
                </p>
              </CardContent>
            </Card>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card
                  className={
                    result.success
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-red-200 dark:border-red-800'
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {result.success ? 'تم الإنشاء بنجاح' : 'فشل الإنشاء'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{result.message}</p>
                    {result.conflicts > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>{result.conflicts} تعارضات تحتاج إلى مراجعة</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => router.push('/admin/schedules')}>
                        عرض الجدول
                      </Button>
                      <Button size="sm" variant="outline">
                        تصدير
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">إحصائيات الجدول الحالي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي المحاضرات</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">القاعات المستخدمة</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التعارضات</span>
                <span className="font-medium text-amber-500">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">نسبة استغلال القاعات</span>
                <span className="font-medium">78%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
