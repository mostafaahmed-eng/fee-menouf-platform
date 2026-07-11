'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Notification } from '@/lib/types';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  GraduationCap,
  CalendarCheck,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  registration: {
    label: 'تسجيل',
    icon: FileText,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  grade: {
    label: 'درجة',
    icon: GraduationCap,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  exam: {
    label: 'امتحان',
    icon: CalendarCheck,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  attendance: {
    label: 'حضور',
    icon: UserCheck,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  warning: {
    label: 'إنذار',
    icon: AlertTriangle,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
};

export default function NotificationsPage() {
  const { direction } = useTranslation();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', filterType, filterRead],
    queryFn: () =>
      api
        .get('/notifications', {
          params: {
            ...(filterType !== 'all' && { type: filterType }),
            ...(filterRead !== 'all' && { isRead: filterRead === 'read' }),
          },
        })
        .then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('تم تحديد الكل كمقروء');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount =
    notifications?.filter((n) => !n.isRead).length ?? 0;

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'registration', label: 'تسجيل' },
    { key: 'grade', label: 'درجات' },
    { key: 'exam', label: 'امتحانات' },
    { key: 'attendance', label: 'حضور' },
    { key: 'warning', label: 'إنذارات' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 space-y-6"
      dir={direction}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground">
              جميع الإشعارات والتنبيهات
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-sm px-2.5">
              {unreadCount} جديد
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 ml-1" />
            تحديد الكل كمقروء
          </Button>
        )}
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filterType === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <div className="mr-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilterRead(filterRead === 'all' ? 'unread' : 'all')
            }
          >
            <Filter className="h-4 w-4 ml-1" />
            {filterRead === 'all' ? 'الكل' : 'غير مقروء'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type] ?? typeConfig.warning;
              const Icon = config.icon;
              const isExpanded = expandedId === n.id;

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !n.isRead
                        ? 'border-r-4 border-r-primary bg-primary/5'
                        : 'opacity-70'
                    }`}
                    onClick={() => {
                      if (!n.isRead) markReadMutation.mutate(n.id);
                      setExpandedId(isExpanded ? null : n.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${config.color}`}
                            >
                              {config.label}
                            </Badge>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <span className="text-xs text-muted-foreground mr-auto">
                              {new Date(n.createdAt).toLocaleDateString(
                                'ar-EG',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          </div>
                          <p className="font-medium">{n.title}</p>
                          <p
                            className={`text-sm text-muted-foreground mt-0.5 ${
                              isExpanded ? '' : 'line-clamp-1'
                            }`}
                          >
                            {n.message}
                          </p>
                          {n.metadata && isExpanded && (
                            <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                              <pre className="whitespace-pre-wrap font-sans">
                                {JSON.stringify(n.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <div className="text-muted-foreground shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            لا توجد إشعارات
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            ستظهر الإشعارات هنا عند ورودها
          </p>
        </div>
      )}
    </motion.div>
  );
}
