'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, BookOpen, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
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
import { Program } from '@/lib/types';

export default function ProgramsPage() {
  const { direction } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', nameAr: '', nameEn: '', departmentId: '', degree: '', duration: 4, totalCredits: 160 });
  const queryClient = useQueryClient();

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ['admin', 'programs'],
    queryFn: async () => {
      const { data } = await api.get('/programs');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/programs', formData);
      return data.data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء البرنامج بنجاح');
      setOpen(false);
      setFormData({ code: '', nameAr: '', nameEn: '', departmentId: '', degree: '', duration: 4, totalCredits: 160 });
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">البرامج الأكاديمية</h1>
          <p className="text-muted-foreground">إدارة البرامج الدراسية في الكلية</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFormData({ code: '', nameAr: '', nameEn: '', departmentId: '', degree: '', duration: 4, totalCredits: 160 }); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> برنامج جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>برنامج جديد</DialogTitle>
              <DialogDescription>أدخل بيانات البرنامج الأكاديمي</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكود</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS" />
                </div>
                <div className="space-y-2">
                  <Label>الدرجة العلمية</Label>
                  <Input value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} placeholder="بكالوريوس" />
                </div>
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
                <Label>القسم</Label>
                  <Input value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} placeholder="معرف القسم" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المدة (سنوات)</Label>
                  <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>إجمالي الوحدات</Label>
                  <Input type="number" value={formData.totalCredits} onChange={(e) => setFormData({ ...formData, totalCredits: +e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs?.map((prog) => (
            <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
              <Link href={`/admin/programs/${prog.id}`}>
                <Card className={`h-full transition-colors hover:border-primary/50 cursor-pointer ${selectedIds.includes(prog.id) ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 ml-2"
                          checked={selectedIds.includes(prog.id)}
                          onChange={() => toggleSelect(prog.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{prog.nameAr}</CardTitle>
                          <CardDescription>{prog.nameEn}</CardDescription>
                        </div>
                      </div>
                      <Badge>{prog.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{prog.department?.nameAr || prog.department?.nameEn} - {prog.degree}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{prog.duration} سنوات - {prog.totalCredits} وحدة</span>
                      </div>
                      <Badge variant="success" className="mt-1">نشط</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
