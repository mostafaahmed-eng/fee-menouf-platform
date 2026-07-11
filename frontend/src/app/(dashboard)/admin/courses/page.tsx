'use client';

import { useTranslation } from '@/lib/i18n/use-translation';import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search, Upload, Loader2, Trash2, Download } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Course } from '@/lib/types';

export default function AdminCoursesPage() {
  const { direction } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '', nameAr: '', nameEn: '', credits: 3, departmentId: '',
    level: 1, semester: 1, capacity: 50, isElective: false,
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin', 'courses', search],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { search } });
      return data.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['admin', 'departments', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data.data;
    },
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/courses/${id}`)));
    },
    onSuccess: () => { toast.success('تم حذف المواد المحددة'); setSelectedIds([]); queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }); },
    onError: () => toast.error('حدث خطأ في حذف المواد'),
  });

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0 || !courses) return;
    const selected = courses.filter((c: Course) => selectedIds.includes(c.id));
    const csv = [
      ['الكود', 'الاسم (عربي)', 'الاسم (إنجليزي)', 'الوحدات', 'السعة', 'القسم'].join(','),
      ...selected.map((c: Course) => [c.code, c.nameAr, c.nameEn, c.credits, c.capacity, c.departmentId].join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'courses-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { level: _level, semester: _semester, isElective: _isElective, ...payload } = formData;
      const { data } = await api.post('/courses', payload);
      return data.data;
    },
    onSuccess: () => { toast.success('تم إنشاء المادة'); setOpen(false); },
    onError: () => toast.error('حدث خطأ'),
  });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة المواد</h1>
          <p className="text-muted-foreground">إنشاء وتعديل المواد الدراسية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> استيراد دفعة</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> مادة جديدة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>مادة جديدة</DialogTitle>
                <DialogDescription>أدخل بيانات المادة الدراسية</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكود</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS101" />
                </div>
                <div className="space-y-2">
                  <Label>الوحدات</Label>
                  <Input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>
                      {departments?.map((d: { id: string; nameAr: string }) => (
                        <SelectItem key={d.id} value={d.id}>{d.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المستوى</Label>
                  <Select value={String(formData.level)} onValueChange={(v) => setFormData({ ...formData, level: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((l) => <SelectItem key={l} value={String(l)}>المستوى {l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الفصل</Label>
                  <Select value={String(formData.semester)} onValueChange={(v) => setFormData({ ...formData, semester: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">الأول</SelectItem>
                      <SelectItem value="2">الثاني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السعة</Label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.code || !formData.nameAr}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  إنشاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بكود أو اسم المادة..." className="pr-9" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium ml-auto">{selectedIds.length} مادة(مواد) محددة</span>
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="gap-1">
                <Download className="h-3 w-3" /> تصدير
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1" disabled={bulkDeleteMutation.isPending}>
                {bulkDeleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                حذف
              </Button>
            </div>
          )}
          {courses?.map((course: Course) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center justify-between rounded-lg border p-4 ${selectedIds.includes(course.id) ? 'border-primary/50 bg-primary/5' : ''}`}>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedIds.includes(course.id)}
                  onChange={() => toggleSelect(course.id)}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{course.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{course.code} - {course.nameEn}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{course.credits} وحدات</span>
                    <span>{course.departmentId}</span>
                    <Badge variant="outline" className="text-xs">
                      {course.capacity ? `0/${course.capacity}` : `${course.credits} و.م`}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">تعديل</Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
