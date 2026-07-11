'use client';

import { useTranslation } from '@/lib/i18n/use-translation';import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Shield, ToggleLeft, ToggleRight, Loader2, Trash2, Download, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { SystemUser } from '@/lib/types';

export default function UsersPage() {
  const { direction } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', fullNameAr: '', fullNameEn: '', password: '', role: 'STUDENT' as SystemUser['role'] });

  const { data: users, isLoading } = useQuery<SystemUser[]>({
    queryKey: ['admin', 'users', roleFilter, statusFilter, search],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { search, role: roleFilter !== 'all' ? roleFilter : undefined, isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined } });
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/users', formData);
      return data.data;
    },
    onSuccess: () => { toast.success('تم إنشاء المستخدم'); setOpen(false); setFormData({ email: '', fullNameAr: '', fullNameEn: '', password: '', role: 'STUDENT' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.post(`/users/${id}/toggle-active`);
    },
    onSuccess: () => { toast.success('تم تحديث الحالة'); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/users/${id}`)));
    },
    onSuccess: () => { toast.success('تم حذف المستخدمين المحددين'); setSelectedIds([]); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('حدث خطأ في حذف المستخدمين'),
  });

  const bulkToggleStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      await Promise.all(ids.map((id) => api.patch(`/users/${id}`, { isActive: is_active })));
    },
    onSuccess: (_, { is_active }) => { toast.success(is_active ? 'تم تفعيل المستخدمين' : 'تم تعطيل المستخدمين'); setSelectedIds([]); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filteredUsers = users?.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    return true;
  });


  const toggleSelectAll = useCallback(() => {
    if (filteredUsers && selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else if (filteredUsers) {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  }, [filteredUsers, selectedIds.length]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    bulkToggleStatusMutation.mutate({ ids: selectedIds, is_active: true });
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return;
    bulkToggleStatusMutation.mutate({ ids: selectedIds, is_active: false });
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0 || !filteredUsers) return;
    const selected = filteredUsers.filter((u) => selectedIds.includes(u.id));
    const csv = [
      ['الاسم', 'البريد الإلكتروني', 'الصلاحية', 'الحالة', 'آخر دخول'].join(','),
      ...selected.map((u) =>
        [u.fullNameEn, u.email, u.role, u.isActive ? 'نشط' : 'غير نشط', u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ar-EG') : '---'].join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    DOCTOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    STUDENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    TA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ADVISOR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    HEAD: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'مشرف عام', ADMIN: 'إداري', DOCTOR: 'دكتور', STUDENT: 'طالب', TA: 'معيد', ADVISOR: 'مرشد', HEAD: 'رئيس قسم',
  };

  return (
    <div className="space-y-6 p-4 md:p-6 rtl:text-right" dir={direction}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع مستخدمي النظام</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> مستخدم جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>مستخدم جديد</DialogTitle>
              <DialogDescription>أدخل بيانات المستخدم</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                  <Input value={formData.fullNameAr} onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                  <Input value={formData.fullNameEn} onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الصلاحية</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as SystemUser['role'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">إداري</SelectItem>
                    <SelectItem value="DOCTOR">دكتور</SelectItem>
                    <SelectItem value="STUDENT">طالب</SelectItem>
                    <SelectItem value="TA">معيد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.email || !formData.password}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="pr-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الصلاحية" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="ADMIN">إداري</SelectItem>
                <SelectItem value="DOCTOR">دكتور</SelectItem>
                <SelectItem value="STUDENT">طالب</SelectItem>
                <SelectItem value="TA">معيد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium ml-auto">{selectedIds.length} مستخدم(ين) محدد</span>
              <Button variant="outline" size="sm" onClick={handleBulkActivate} className="gap-1">
                <CheckCheck className="h-3 w-3" /> تفعيل
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDeactivate} className="gap-1">
                <X className="h-3 w-3" /> تعطيل
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="gap-1">
                <Download className="h-3 w-3" /> تصدير
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1" disabled={bulkDeleteMutation.isPending}>
                {bulkDeleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                حذف
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b text-right">
                    <th className="pb-3 font-medium w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={filteredUsers ? selectedIds.length === filteredUsers.length && filteredUsers.length > 0 : false}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">المستخدم</th>
                    <th className="pb-3 font-medium">البريد الإلكتروني</th>
                    <th className="pb-3 font-medium">الصلاحية</th>
                    <th className="pb-3 font-medium">الحالة</th>
                    <th className="pb-3 font-medium">آخر دخول</th>
                    <th className="pb-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${selectedIds.includes(user.id) ? 'bg-primary/5' : ''}`}>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="py-3">
                          <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{(user.fullNameEn?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)) || '?'}</span>
                            </Avatar>
                            <span className="font-medium">{user.fullNameEn}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : '---'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/users/${user.id}`}><Shield className="h-4 w-4" /></Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {user.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{user.isActive ? 'تعطيل' : 'تفعيل'} المستخدم</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.isActive ? 'سيتم تعطيل حساب المستخدم' : 'سيتم تفعيل حساب المستخدم'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleStatus.mutate({ id: user.id })}>
                                  تأكيد
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
