'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useAuth } from '@/lib/hooks/use-auth';
import type { User } from '@/lib/types/user.types';
import {
  User as UserIcon,
  Mail,
  Phone,
  IdCard,
  GraduationCap,
  Building2,
  BookOpen,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

const profileSchema = z.object({
  fullNameAr: z.string().min(1, 'الاسم مطلوب'),
  fullNameEn: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمة المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function getErrorMessage(err: unknown): string | undefined {
  const axiosError = err as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.detail || 'حدث خطأ غير متوقع';
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { direction } = useTranslation();
  const { user: authUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/auth/profile').then((r) => r.data.data),
  });

  const studentId = profile?.student?.id || authUser?.student?.id;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      fullNameAr: profile?.fullNameAr ?? '',
      fullNameEn: profile?.fullNameEn ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      api.patch(`/students/${studentId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      setEditing(false);
      toast.success('تم تحديث الملف الشخصي');
    },
    onError: (err: unknown) => {
      toast.error('فشل التحديث', {
        description: getErrorMessage(err),
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('تم تغيير كلمة المرور');
    },
    onError: (err: unknown) => {
      toast.error('فشل تغيير كلمة المرور', {
        description: getErrorMessage(err),
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('profilePicture', file);
      return api.patch(`/students/${studentId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast.success('تم تحديث الصورة الشخصية');
    },
    onError: (err: unknown) => {
      toast.error('فشل تحديث الصورة', {
        description: getErrorMessage(err),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={direction}>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl lg:col-span-1" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

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
      >
        <h1 className="text-2xl md:text-3xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground">إدارة معلوماتك الشخصية</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="text-3xl bg-primary/10">
                    {profile?.fullNameAr?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                    }}
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold mt-4">
                {profile?.fullNameAr}
              </h2>
              <p className="text-muted-foreground">{profile?.fullNameEn}</p>
              <Badge variant="secondary" className="mt-2">
                {profile?.student?.studentId}
              </Badge>
              <div className="w-full mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile?.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="personal">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">
                <UserIcon className="h-4 w-4 ml-1" />
                المعلومات الشخصية
              </TabsTrigger>
              <TabsTrigger value="academic">
                <GraduationCap className="h-4 w-4 ml-1" />
                المعلومات الأكاديمية
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="h-4 w-4 ml-1" />
                تغيير كلمة المرور
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">البيانات الشخصية</CardTitle>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      تعديل
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) =>
                        updateMutation.mutate(data),
                      )}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullNameAr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم بالعربية</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={!editing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fullNameEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم بالإنجليزية</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  disabled={!editing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>البريد الإلكتروني</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  disabled={!editing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم الهاتف</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  disabled={!editing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>
                      {editing && (
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 ml-1" />
                            حفظ
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditing(false);
                              form.reset();
                            }}
                          >
                            إلغاء
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">البيانات الأكاديمية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <IdCard className="h-4 w-4" />
                        <span>الرقم الجامعي</span>
                      </div>
                      <p className="font-bold font-mono">{profile?.student?.studentId}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Building2 className="h-4 w-4" />
                        <span>القسم</span>
                      </div>
                      <p className="font-bold">{profile?.student?.department?.nameAr}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <BookOpen className="h-4 w-4" />
                        <span>البرنامج</span>
                      </div>
                      <p className="font-bold">{profile?.student?.program?.nameAr}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>المستوى</span>
                      </div>
                      <p className="font-bold">{profile?.student?.level}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تغيير كلمة المرور</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit((data) =>
                        passwordMutation.mutate(data),
                      )}
                      className="space-y-4 max-w-md"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور الحالية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  dir="ltr"
                                />
                                <button
                                  type="button"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showNewPassword ? 'text' : 'password'}
                                  dir="ltr"
                                />
                                <button
                                  type="button"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تأكيد كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={passwordMutation.isPending}
                      >
                        <Lock className="h-4 w-4 ml-1" />
                        تغيير كلمة المرور
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
