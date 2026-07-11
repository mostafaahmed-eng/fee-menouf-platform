"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { getDashboardRoute } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";

const routeLabels: Record<string, { en: string; ar: string }> = {
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  students: { en: "Students", ar: "الطلاب" },
  courses: { en: "Courses", ar: "المقررات" },
  attendance: { en: "Attendance", ar: "الحضور" },
  grades: { en: "Grades", ar: "الدرجات" },
  schedule: { en: "Schedule", ar: "الجدول" },
  registrations: { en: "Registrations", ar: "التسجيلات" },
  reports: { en: "Reports", ar: "التقارير" },
  settings: { en: "Settings", ar: "الإعدادات" },
  profile: { en: "Profile", ar: "الملف الشخصي" },
  administration: { en: "Administration", ar: "الإدارة" },
  messages: { en: "Messages", ar: "الرسائل" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  new: { en: "New", ar: "جديد" },
  edit: { en: "Edit", ar: "تعديل" },
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isRTL } = useTranslation();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label =
      routeLabels[segment]?.[isRTL ? "ar" : "en"] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
    >
      <Link
        href={user ? getDashboardRoute(user.role) : "/admin"}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, _index) => (
        <React.Fragment key={crumb.href}>
          {isRTL ? (
            <ChevronLeft className="h-4 w-4 mx-1" />
          ) : (
            <ChevronRight className="h-4 w-4 mx-1" />
          )}
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </motion.nav>
  );
}
