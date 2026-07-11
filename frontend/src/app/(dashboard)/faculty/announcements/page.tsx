'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Megaphone, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Announcement } from '@/lib/types';

export default function AnnouncementsPage() {
  const { direction } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const { data: courses } = useQuery({
    queryKey: ['faculty', 'courses', 'announcements'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['faculty', 'announcements', selectedCourse],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${selectedCourse}/announcements`);
      return data.data;
    },
    enabled: !!selectedCourse,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${selectedCourse}/announcements`, formData);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم نشر الإعلان بنجاح');
      setOpen(false);
      setFormData({ title: '', content: '' });
    },
    onError: () => toast.error('حدث خطأ أثناء نشر الإعلان'),
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">الإعلانات</h1>
        <p className="text-muted-foreground">إدارة الإعلانات الخاصة بالمواد</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>اختر المادة</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((c: { id: string; nameAr: string; code: string }) => (
                <SelectItem key={c.id} value={c.id}>{c.nameAr} ({c.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>جميع الإعلانات</CardTitle>
              <CardDescription>{announcements?.length || 0} إعلان</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> إعلان جديد</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إعلان جديد</DialogTitle>
                  <DialogDescription>نشر إعلان للطلاب المسجلين في المادة</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="عنوان الإعلان" />
                  </div>
                  <div className="space-y-2">
                    <Label>المحتوى</Label>
                    <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="محتوى الإعلان..." rows={5} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.title}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    نشر
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann: Announcement) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{ann.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{ann.content}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{ann.doctorId || '—'}</span>
                            <span>{new Date(ann.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد إعلانات بعد</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
