'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS_HEX } from '@/lib/chart-colors';
import type { GpaRecord } from '@/lib/types';

interface GpaChartProps {
  data?: GpaRecord[];
  isLoading?: boolean;
}

export default function GpaChart({ data, isLoading }: GpaChartProps) {
  if (isLoading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تطور GPA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            لا توجد بيانات متاحة
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((r) => ({
    semester: `${r.academicYear} - ${r.semester}`,
    GPA: r.gpa,
    CGPA: r.cgpa,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تطور GPA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="semester"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={[0, 4]}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="GPA"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="CGPA"
                  stroke={CHART_COLORS_HEX.primary}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: CHART_COLORS_HEX.primary, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
