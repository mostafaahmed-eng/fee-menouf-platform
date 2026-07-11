'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function SchedulerPage() {
  const { direction } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    schedule: Array<{ day: string; time: string; course: string; doctor: string; room: string; type: string }>;
    conflicts: Array<{ course: string; day: string; time: string; with: string }>;
  } | null>(null);

  const [params, setParams] = useState({
    semester: '',
    maxPerDay: 6,
    preferMorning: true,
    avoidFriday: true,
    gapMinutes: 15,
  });

  const handleGenerate = async () => {
    if (!params.semester) return;
    setGenerating(true);
    setProgress(0);
    setResult(null);
    try {
      setProgress(20);
      const res = await api.post('/scheduling/generate-lecture', {
        semesterId: params.semester,
        courseIds: [],
        preferences: JSON.stringify({
          maxPerDay: params.maxPerDay,
          preferMorning: params.preferMorning,
          avoidFriday: params.avoidFriday,
          gapMinutes: params.gapMinutes,
        }),
      });
      setProgress(100);
      const data = res.data.data;
      setResult({
        schedule: data?.schedule || [],
        conflicts: data?.conflicts || [],
      });
      setGenerating(false);
      toast.success(data?.message || 'تم إنشاء الجدول الذكي بنجاح');
    } catch {
      setGenerating(false);
      setResult({
        schedule: [],
        conflicts: [],
      });
      toast.error('فشل إنشاء الجدول');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">محسن الجدول الذكي</h1>
          <p className="text-muted-foreground">إنشاء جدول محاضرات مثالي باستخدام الذكاء الاصطناعي</p>
        </div>
        <AiBadge size="lg" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلمات الجدولة</CardTitle>
              <CardDescription>حدد القيود والتفضيلات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الفصل الدراسي</Label>
                <Select value={params.semester} onValueChange={(v) => setParams({ ...params, semester: v })}>
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
                  <Label className="text-sm">الحد الأقصى للمحاضرات يومياً</Label>
                  <span className="text-sm font-medium">{params.maxPerDay}</span>
                </div>
                <Slider value={[params.maxPerDay]} onValueChange={([v]) => setParams({ ...params, maxPerDay: v })} min={2} max={8} step={1} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">الفجوة بين المحاضرات (دقائق)</Label>
                  <span className="text-sm font-medium">{params.gapMinutes}</span>
                </div>
                <Slider value={[params.gapMinutes]} onValueChange={([v]) => setParams({ ...params, gapMinutes: v })} min={0} max={60} step={5} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">تفضيل الفترة الصباحية</Label>
                  <p className="text-xs text-muted-foreground">جدولة المحاضرات صباحاً</p>
                </div>
                <Switch checked={params.preferMorning} onCheckedChange={(v) => setParams({ ...params, preferMorning: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">تجنب الجمعة</Label>
                  <p className="text-xs text-muted-foreground">لا يوجد محاضرات يوم الجمعة</p>
                </div>
                <Switch checked={params.avoidFriday} onCheckedChange={(v) => setParams({ ...params, avoidFriday: v })} />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !params.semester}
                className="w-full gap-2"
                size="lg"
              >
                {generating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {generating ? 'جاري الإنشاء...' : 'إنشاء جدول ذكي'}
              </Button>
            </CardContent>
          </Card>

          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <Progress value={progress} className="h-3" />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {progress < 30 && 'جاري تحليل البيانات...'}
                      {progress >= 30 && progress < 60 && 'جاري جدولة المحاضرات...'}
                      {progress >= 60 && progress < 90 && 'جاري تحسين الجدول...'}
                      {progress >= 90 && 'الانتهاء...'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence>
            {!result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-96 items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <Calendar className="mx-auto h-16 w-16 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    حدد المعلمات واضغط على "إنشاء جدول ذكي"
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">تم إنشاء الجدول بنجاح</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate}>
                          <RefreshCw className="h-4 w-4" /> إعادة
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.conflicts && result.conflicts.length > 0 && (
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">تعارضات تحتاج إلى مراجعة</span>
                      </div>
                      <div className="space-y-2">
                        {result.conflicts.map((c, i) => (
                          <div key={i} className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-xs">
                            <span className="font-medium">{c.course}</span> - {c.day} {c.time}
                            <p className="text-muted-foreground">التعارض مع: {c.with}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.schedule && result.schedule.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>الجدول المقترح</CardTitle>
                      <CardDescription>جدول المحاضرات المولد بالذكاء الاصطناعي</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-5">
                        {dayNames.map((day) => (
                          <div key={day}>
                            <h4 className="mb-2 text-sm font-medium">{day}</h4>
                            <div className="space-y-2">
                              {result.schedule
                                .filter((s) => s.day === day)
                                .map((slot, i) => (
                                  <div
                                    key={i}
                                    className="rounded-lg border p-2 text-xs space-y-1"
                                  >
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{slot.time}</span>
                                    </div>
                                    <p className="font-medium">{slot.course}</p>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span>{slot.doctor}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{slot.room}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                      {slot.type}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!result.schedule || result.schedule.length === 0) && (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground py-12">
                      لم يتم إنشاء جدول. يرجى المحاولة مرة أخرى.
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
