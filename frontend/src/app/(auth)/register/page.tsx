"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth-schema";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabels, roleLabelsAr, getDashboardRoute } from "@/lib/auth";
import type { UserRole } from "@/lib/types/user.types";
import { GraduationCap, Mail, Lock, User, Phone } from "lucide-react";

const SELF_REGISTER_ROLES: UserRole[] = ["STUDENT", "DOCTOR", "TA", "ADVISOR"];
const roleOptions = SELF_REGISTER_ROLES.map((role) => ({
  value: role,
  labelEn: roleLabels[role],
  labelAr: roleLabelsAr[role],
}));

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { t, isRTL } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullNameAr: "",
      fullNameEn: "",
      email: "",
      password: "",
      role: undefined,
      phone: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      toast.success("Account created!", {
        description: "Welcome to FEE-MENOUF Platform.",
      });
      const { user } = useAuth.getState();
      router.push(user ? getDashboardRoute(user.role) : "/admin");
    } catch (err) {
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-university-blue-900 via-university-blue-800 to-university-blue-950 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-university-gold-400 mb-4"
          >
            <GraduationCap className="h-8 w-8 text-university-blue-900" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("auth.register")}
          </h1>
          <p className="text-blue-200 text-sm">
            {t("auth.registerDescription")}
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              {t("auth.signUp")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth.registerDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("auth.selectRole")}
                </label>
                <Select
                  onValueChange={(value) =>
                    setValue("role", value as "STUDENT" | "DOCTOR" | "TA" | "ADVISOR")
                  }
                  value={selectedRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {isRTL ? role.labelAr : role.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <Input
                label={t("auth.name") + " (العربية)"}
                placeholder="محمد أحمد"
                icon={<User className="h-4 w-4" />}
                error={errors.fullNameAr?.message}
                {...register("fullNameAr")}
              />

              <Input
                label={t("auth.name") + " (English)"}
                placeholder="John Doe"
                icon={<User className="h-4 w-4" />}
                error={errors.fullNameEn?.message}
                {...register("fullNameEn")}
              />

              <Input
                label={t("auth.email")}
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label={t("auth.phone")}
                type="tel"
                placeholder="+201234567890"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                label={t("auth.password")}
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                helperText={t("auth.passwordRequirements")}
                {...register("password")}
              />

              <Button
                type="submit"
                className="w-full h-11"
                loading={isSubmitting}
              >
                {t("auth.signUp")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
