'use client';

import { useTranslation } from '@/lib/i18n/use-translation';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Trash2, Users, BookOpen, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Department } from '@/lib/types';

export default function DepartmentsPage() {
  const { direction } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ code: '', nameAr: '', nameEn: '', description: '' });

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ['admin', 'departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/departments', formData);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء القسم بنجاح');
      setOpen(false); resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/departments/${id}`)));
    },
    onSuccess: () => { toast.success('تم حذف الأقسام المحددة'); setSelectedIds([]); queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }); },
    onError: () => toast.error('حدث خطأ في حذف الأقسام'),
  });

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0 || !departments) return;
    const selected = departments.filter((d) => selectedIds.includes(d.id));
    const csv = [
      ['الكود', 'الاسم (عربي)', 'الاسم (إنجليزي)', 'رئيس القسم'].join(','),
      ...selected.map((d) => [d.code, d.nameAr, d.nameEn, d.headId || ''].join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'departments-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => setFormData({ code: '', nameAr: '', nameEn: '', description: '' });

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة الأقسام</h1>
          <p className="text-muted-foreground">عرض وإدارة أقسام الكلية</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> قسم جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editDept ? 'تعديل قسم' : 'قسم جديد'}</DialogTitle>
              <DialogDescription>أدخل بيانات القسم</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS" />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder="هندسة الحاسبات" />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} placeholder="Computer Engineering" />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف القسم" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                {editDept ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div>
          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium ml-auto">{selectedIds.length} قسم(أقسام) محددة</span>
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="gap-1">
                <Download className="h-3 w-3" /> تصدير
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1" disabled={bulkDeleteMutation.isPending}>
                {bulkDeleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                حذف
              </Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map((dept) => (
            <DepartmentCard key={dept.id} dept={dept} selectedIds={selectedIds} toggleSelect={toggleSelect} />
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

function DepartmentCard({ dept, selectedIds, toggleSelect }: { dept: Department; selectedIds: string[]; toggleSelect: (id: string) => void }) {
  const { data: deptStats } = useQuery({
    queryKey: ['department', dept.id, 'statistics'],
    queryFn: async () => {
      const { data } = await api.get(`/departments/${dept.id}/statistics`);
      return data.data;
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <Link href={`/admin/departments/${dept.id}`}>
        <Card className={`h-full transition-colors hover:border-primary/50 ${selectedIds.includes(dept.id) ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 ml-2"
                  checked={selectedIds.includes(dept.id)}
                  onChange={() => toggleSelect(dept.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{dept.nameAr}</CardTitle>
                  <CardDescription>{dept.nameEn}</CardDescription>
                </div>
              </div>
              <Badge>{dept.code}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{deptStats?.totalStudents ?? '—'} طالب — {deptStats?.totalDoctors ?? '—'} دكتور</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{deptStats?.totalCourses ?? '—'} مادة</span>
              </div>
              <p className="text-xs text-muted-foreground">رئيس القسم: {dept.headId || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
