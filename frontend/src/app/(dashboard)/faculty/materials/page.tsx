'use client';


import { useTranslation } from '@/lib/i18n/use-translation';import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, Download, FileText, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { CourseMaterial } from '@/lib/types';

const typeLabels: Record<string, string> = {
  lecture: 'محاضرة',
  lab: 'معمل',
  assignment: 'واجب',
  reference: 'مرجع',
};

export default function MaterialsPage() {
  const { direction } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'lecture' as CourseMaterial['type'],
    file: null as File | null,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['faculty', 'courses', 'materials'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });

  const { data: materials, isLoading: matsLoading } = useQuery({
    queryKey: ['faculty', 'materials', selectedCourse],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${selectedCourse}/materials`);
      return data.data;
    },
    enabled: !!selectedCourse,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('type', formData.type);
      if (formData.file) fd.append('file', formData.file);
      const { data } = await api.post(`/courses/${selectedCourse}/materials`, fd);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم رفع المادة بنجاح');
      setOpen(false);
      setFormData({ title: '', description: '', type: 'lecture', file: null });
    },
    onError: () => toast.error('حدث خطأ أثناء رفع المادة'),
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty"><ArrowLeft className="h-4 w-4 ml-1" /> العودة</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mt-2">المواد الدراسية</h1>
        <p className="text-muted-foreground">رفع وإدارة المواد التعليمية</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>اختر المادة</CardTitle>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المادة لعرض موادها" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((c: { id: string; nameAr: string; code: string }) => (
                  <SelectItem key={c.id} value={c.id}>{c.nameAr} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>المواد المرفوعة</CardTitle>
              <CardDescription>الملفات والمواد التعليمية المرفوعة</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Upload className="h-4 w-4" /> رفع مادة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>رفع مادة تعليمية</DialogTitle>
                  <DialogDescription>رفع ملف أو مادة تعليمية للمادة</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="عنوان المادة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف المادة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>النوع</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as CourseMaterial['type'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">محاضرة</SelectItem>
                        <SelectItem value="lab">معمل</SelectItem>
                        <SelectItem value="assignment">واجب</SelectItem>
                        <SelectItem value="reference">مرجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الملف</Label>
                    <Input
                      type="file"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={uploadMutation.isPending || !formData.title}
                  >
                    {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    رفع
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {matsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : materials && materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((mat: CourseMaterial) => (
                  <motion.div
                    key={mat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{mat.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{typeLabels[mat.type]}</Badge>
                          <span>{new Date(mat.uploadedAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد مواد مرفوعة بعد</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
