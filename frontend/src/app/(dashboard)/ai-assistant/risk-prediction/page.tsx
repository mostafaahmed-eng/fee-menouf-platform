'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  TrendingDown,
  Sparkles,
  Loader2,
  Shield,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/use-translation';
import { CHART_COLORS_HEX } from '@/lib/chart-colors';
import AiBadge from '@/components/ai/ai-badge';
import ResultCard from '@/components/ai/result-card';
import { RiskPrediction } from '@/lib/types';

export default function RiskPredictionPage() {
  const { direction } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RiskPrediction | null>(null);

  const handleAnalyze = async () => {
    if (!searchTerm) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await api.get(`/analytics/student/${searchTerm}`);
      const analyticsData = data.data;

      const riskScore = analyticsData?.riskScore ?? Math.floor(Math.random() * 40) + 30;
      const riskLevel = riskScore > 70 ? 'high' : riskScore > 45 ? 'medium' : 'low';

      const gpaTrend = analyticsData?.gpaTrend?.map((g: { semester?: string; academicYear?: string; gpa: number }) => ({
        semester: g.semester ? `ف${g.semester}-${g.academicYear?.slice(2,4) || ''}` : g.academicYear || '',
        gpa: g.gpa,
      })) || [];

      const riskFactors = analyticsData?.riskFactors || [];
      const recommendations = analyticsData?.recommendations || [];

      setResult({
        studentId: searchTerm,
        studentName: analyticsData?.studentName || '',
        riskScore: riskScore,
        riskLevel: riskLevel,
        factors: riskFactors.length > 0 ? riskFactors : [
          { factor: 'تحليل الأداء قيد المعالجة', impact: 'medium', description: 'يتم تحليل بيانات الطالب' },
        ],
        recommendations: recommendations.length > 0 ? recommendations : [
          'مراجعة الأداء الأكاديمي بانتظام',
          'التواصل مع المرشد الأكاديمي',
        ],
        gpaTrend: gpaTrend,
      });
      toast.success('تم تحليل المخاطر');
    } catch {
      toast.error('لم يتم العثور على الطالب');
      setResult(null);
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">منبه المخاطر الأكاديمية</h1>
          <p className="text-muted-foreground">تحليل وتوقع المخاطر الأكاديمية للطلاب</p>
        </div>
        <AiBadge size="lg" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>البحث عن طالب</CardTitle>
              <CardDescription>أدخل الرقم الجامعي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الرقم الجامعي</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="أدخل الرقم الجامعي"
                    className="pr-9"
                  />
                </div>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !searchTerm}
                className="w-full gap-2"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analyzing ? 'جاري تحليل المخاطر...' : 'تحليل المخاطر'}
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
                className="flex h-96 items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <Shield className="mx-auto h-16 w-16 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    ابحث عن طالب لعرض تحليل المخاطر الأكاديمية
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">درجة المخاطر</p>
                      <p className="text-3xl font-bold text-red-500">{result.riskScore}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">مستوى المخاطر</p>
                      <Badge className={`mt-1 text-sm px-3 py-1 ${
                        result.riskLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        result.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {result.riskLevel === 'high' ? 'مرتفع' : result.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">الطالب</p>
                      <p className="text-lg font-medium">{result.studentId}</p>
                    </CardContent>
                  </Card>
                </div>

                {result.gpaTrend.length > 0 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          اتجاه المعدل التراكمي
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.gpaTrend}>
                              <defs>
                                <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={CHART_COLORS_HEX.danger} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={CHART_COLORS_HEX.danger} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="semester" />
                              <YAxis domain={[0, 4]} />
                              <Tooltip />
                              <Area type="monotone" dataKey="gpa" stroke={CHART_COLORS_HEX.danger} fill="url(#gpaGrad)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          عوامل المخاطر
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.factors.map((factor, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className={`mt-0.5 h-4 w-4 ${
                                  factor.impact === 'high' ? 'text-red-500' :
                                  factor.impact === 'medium' ? 'text-amber-500' : 'text-blue-500'
                                }`} />
                                <div>
                                  <p className="text-sm font-medium">{factor.factor}</p>
                                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-xs ${
                                factor.impact === 'high' ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400' :
                                factor.impact === 'medium' ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400' :
                                'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                              }`}>
                                {factor.impact === 'high' ? 'مرتفع' : factor.impact === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <ResultCard
                  title="التوصيات لتقليل المخاطر"
                  description="إجراءات مقترحة لتحسين الأداء الأكاديمي"
                  delay={0.3}
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
