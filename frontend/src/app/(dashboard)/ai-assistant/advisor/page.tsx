'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AiBadge from '@/components/ai/ai-badge';
import ResultCard from '@/components/ai/result-card';
import CourseRecommendations from './components/course-recommendations';
import GraduationPath from './components/graduation-path';
import { CourseRecommendation, GraduationPath as GraduationPathType } from '@/lib/types';

export default function AdvisorPage() {
  const { direction } = useTranslation();
  const [studentId, setStudentId] = useState('');
  const [gpa, setGpa] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    recommendations: CourseRecommendation[];
    path: GraduationPathType[];
    totalCredits: number;
    completedCredits: number;
    requiredCredits: number;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!studentId) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const [transcriptRes, analyticsRes] = await Promise.allSettled([
        api.get(`/grades/transcript/${studentId}`),
        api.get(`/analytics/student/${studentId}`),
      ]);

      const transcript = transcriptRes.status === 'fulfilled' ? transcriptRes.value.data.data : null;
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data.data : null;

      const recommendations: CourseRecommendation[] = analytics?.recommendedCourses?.map((c: {
        code: string; nameAr: string; nameEn: string; credits: number; reason: string;
      }) => ({
        courseCode: c.code,
        courseNameAr: c.nameAr,
        courseNameEn: c.nameEn,
        credits: c.credits || 3,
        reason: c.reason || 'مادة موصى بها',
        priority: 'medium' as const,
        prerequisitesMet: true,
        conflictCheck: true,
      })) || [];

      const gpaTrend = analytics?.gpaTrend || [];
      const currentGpa = gpaTrend.length > 0 ? gpaTrend[gpaTrend.length - 1].gpa : (parseFloat(gpa) || 0);

      const path: GraduationPathType[] = transcript?.semesters?.map((s: {
        semester: string; academicYear: string; courses: Array<{ courseNameAr: string }>; totalCredits: number;
      }) => ({
        semester: s.semester,
        academicYear: s.academicYear,
        courses: s.courses?.map((c) => c.courseNameAr) || [],
        credits: s.totalCredits || 0,
        isCurrent: false,
      })) || [];

      if (recommendations.length === 0) {
        recommendations.push({
          courseCode: studentId,
          courseNameAr: 'يرجى استشارة المرشد الأكاديمي',
          courseNameEn: 'Please consult your advisor',
          credits: 3,
          reason: 'بناءً على سجلك الأكاديمي',
          priority: 'medium',
          prerequisitesMet: true,
          conflictCheck: true,
        });
      }

      const aiRes = await api.post('/ai/chat', {
        message: 'Provide academic advice for student ' + studentId + ' with GPA ' + currentGpa,
        language: 'ARABIC',
      });
      const aiResult = aiRes.data.data;
      if (aiResult?.reply) {
        toast.success(aiResult.reply);
      } else {
        toast.success('تم تحليل المسار الأكاديمي');
      }

      setResult({
        recommendations,
        path,
        totalCredits: transcript?.totalCredits || 0,
        completedCredits: transcript?.completedCredits || 0,
        requiredCredits: transcript?.requiredCredits || 160,
      });
    } catch {
      toast.error('فشل تحليل المسار الأكاديمي');
      setResult({
        recommendations: [{
          courseCode: studentId,
          courseNameAr: 'تعذر تحليل البيانات',
          courseNameEn: 'Analysis failed',
          credits: 0,
          reason: 'يرجى المحاولة مرة أخرى',
          priority: 'low',
          prerequisitesMet: false,
          conflictCheck: false,
        }],
        path: [],
        totalCredits: 0,
        completedCredits: 0,
        requiredCredits: 160,
      });
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المستشار الأكاديمي الذكي</h1>
          <p className="text-muted-foreground">توصيات ذكية للمسار الأكاديمي بناءً على أدائك</p>
        </div>
        <AiBadge size="lg" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الطالب</CardTitle>
              <CardDescription>أدخل البيانات للتحليل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الرقم الجامعي</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="أدخل الرقم الجامعي"
                    className="pr-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>المعدل التراكمي (اختياري)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="مثال: 3.2"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !studentId}
                className="w-full gap-2"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analyzing ? 'جاري التحليل...' : 'تحليل المسار الأكاديمي'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence>
            {!result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    أدخل الرقم الجامعي للحصول على التوصيات
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <ResultCard
                  title="التوصيات الدراسية"
                  description="بناءً على أدائك الأكاديمي وسجل المواد"
                  delay={0}
                >
                  <CourseRecommendations recommendations={result.recommendations} />
                </ResultCard>

                <ResultCard
                  title="العبء الدراسي المقترح"
                  description="عدد الوحدات الموصى بها للفصل القادم"
                  delay={0.2}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-violet-500">12</p>
                        <p className="text-xs text-muted-foreground">الحد الأدنى</p>
                      </CardContent>
                    </Card>
                    <Card className="border-violet-200 dark:border-violet-800">
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-primary">15</p>
                        <p className="text-xs text-muted-foreground">العبء الموصى به</p>
                        <AiBadge size="sm" className="mt-1 justify-center" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-amber-500">18</p>
                        <p className="text-xs text-muted-foreground">الحد الأقصى</p>
                      </CardContent>
                    </Card>
                  </div>
                </ResultCard>

                <ResultCard
                  title="مسار التخرج"
                  description="الخطة الدراسية المقترحة حتى التخرج"
                  delay={0.4}
                >
                  <GraduationPath
                    path={result.path}
                    totalCredits={result.totalCredits}
                    completedCredits={result.completedCredits}
                    requiredCredits={result.requiredCredits}
                  />
                </ResultCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
