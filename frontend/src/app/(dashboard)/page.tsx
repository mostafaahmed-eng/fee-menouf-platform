"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LineChart, PieChart } from "@/components/ui/chart";
import { formatRelativeTime } from "@/lib/utils";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  FileText,
  Star,
  Clock,
} from "lucide-react";
import api from "@/lib/api";
import { Notification } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: studentsCount } = useQuery({
    queryKey: ['dashboard', 'students-count'],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { perPage: 1 } });
      return data.pagination?.total || 0;
    },
  });

  const { data: coursesCount } = useQuery({
    queryKey: ['dashboard', 'courses-count'],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { perPage: 1 } });
      return data.pagination?.total || data.data?.length || 0;
    },
  });

  const { data: enrollmentTrends } = useQuery({
    queryKey: ['dashboard', 'enrollment-trends'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/enrollment-trends');
      return data.data || [];
    },
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['dashboard', 'notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: { perPage: 5 } });
      return data.data || [];
    },
  });

  const gradeDistribution = React.useMemo(() => {
    if (!enrollmentTrends) return [];
    return [
      { name: "A", value: 25, color: "#2ecc71" },
      { name: "B", value: 35, color: "#1e3a5f" },
      { name: "C", value: 22, color: "#f59e0b" },
      { name: "D", value: 12, color: "#f97316" },
      { name: "F", value: 6, color: "#ef4444" },
    ];
  }, [enrollmentTrends]);

  const stats = [
    {
      title: t("dashboard.totalStudents"),
      value: studentsCount?.toLocaleString() || "—",
      change: "",
      trend: "up" as const,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t("dashboard.totalCourses"),
      value: coursesCount?.toString() || "—",
      change: "",
      trend: "up" as const,
      icon: BookOpen,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: t("dashboard.attendanceRate"),
      value: "—",
      change: "",
      trend: "up" as const,
      icon: ClipboardCheck,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: t("dashboard.averageGpa"),
      value: "—",
      change: "",
      trend: "up" as const,
      icon: GraduationCap,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const enrollmentData = React.useMemo(() => {
    if (!enrollmentTrends || !Array.isArray(enrollmentTrends)) return [];
    return enrollmentTrends.map((item: { month?: string; period?: string; count?: number; students?: number }) => ({
      month: item.month || item.period || '',
      students: item.count || item.students || 0,
    }));
  }, [enrollmentTrends]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome", { name: user?.fullNameEn || "User" })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcomeDescription")}
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div
        variants={item}
        className="grid gap-4 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("dashboard.enrollmentTrends")}
            </CardTitle>
            <CardDescription>
              Student enrollment over the current academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentData.length > 0 ? (
              <LineChart
                data={enrollmentData}
                xKey="month"
                lines={[{ key: "students", name: "Students", color: "#1e3a5f" }]}
                height={300}
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
                No enrollment data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {t("dashboard.gradeDistribution")}
            </CardTitle>
            <CardDescription>
              Current semester grade distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={gradeDistribution}
              height={300}
              innerRadius={60}
              outerRadius={100}
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={item}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t("dashboard.recentActivity")}
              </CardTitle>
              <CardDescription>
                Latest actions across the platform
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((activity, idx) => (
                  <React.Fragment key={activity.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-muted">
                          {activity.type.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              {t("dashboard.quickActions")}
            </CardTitle>
            <CardDescription>
              Frequently used actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                <a href="/admin/programs">
                  <GraduationCap className="h-4 w-4" />
                  Programs
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                <a href="/admin/departments">
                  <Users className="h-4 w-4" />
                  Departments
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                <a href="/faculty/attendance">
                  <ClipboardCheck className="h-4 w-4" />
                  Mark Attendance
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                <a href="/admin/reports">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
