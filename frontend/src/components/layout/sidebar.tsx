"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { useTranslation } from "@/lib/i18n/use-translation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateInitials } from "@/lib/utils";
import { getDashboardRoute } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Calendar,
  FileText,
  Settings,
  Bell,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Shield,
  UserCircle,
  Building2,
  BarChart3,
} from "lucide-react";

interface MenuItem {
  title: string;
  titleAr: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    titleAr: "لوحة التحكم",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STUDENT", "TA", "ADVISOR", "HEAD"],
  },
  {
    title: "Students",
    titleAr: "الطلاب",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Courses",
    titleAr: "المقررات",
    href: "/student/courses",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Courses",
    titleAr: "المقررات",
    href: "/faculty/courses",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Courses",
    titleAr: "المقررات",
    href: "/admin/courses",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Course Registration",
    titleAr: "تسجيل المقررات",
    href: "/student/course-registration",
    icon: <BookMarked className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Attendance",
    titleAr: "الحضور",
    href: "/student/attendance",
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Attendance",
    titleAr: "الحضور",
    href: "/faculty/attendance",
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Grades",
    titleAr: "الدرجات",
    href: "/student/grades",
    icon: <GraduationCap className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Grades",
    titleAr: "الدرجات",
    href: "/faculty/grades",
    icon: <GraduationCap className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Schedule",
    titleAr: "الجدول",
    href: "/student/schedule",
    icon: <Calendar className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "History",
    titleAr: "السجل الأكاديمي",
    href: "/student/history",
    icon: <FileText className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Notifications",
    titleAr: "الإشعارات",
    href: "/student/notifications",
    icon: <Bell className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Materials",
    titleAr: "المواد التعليمية",
    href: "/faculty/materials",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Announcements",
    titleAr: "الإعلانات",
    href: "/faculty/announcements",
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Analytics",
    titleAr: "التحليلات",
    href: "/faculty/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["DOCTOR"],
  },
  {
    title: "Departments",
    titleAr: "الأقسام",
    href: "/admin/departments",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Programs",
    titleAr: "البرامج",
    href: "/admin/programs",
    icon: <GraduationCap className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Semesters",
    titleAr: "الفصول الدراسية",
    href: "/admin/semesters",
    icon: <Calendar className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Classrooms",
    titleAr: "القاعات",
    href: "/admin/classrooms",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Schedules",
    titleAr: "الجداول",
    href: "/admin/schedules",
    icon: <Calendar className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Reports",
    titleAr: "التقارير",
    href: "/admin/reports",
    icon: <FileText className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN", "DOCTOR", "HEAD"],
  },
  {
    title: "Settings",
    titleAr: "الإعدادات",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Settings",
    titleAr: "الإعدادات",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["STUDENT", "DOCTOR", "TA", "ADVISOR", "HEAD"],
  },
  {
    title: "AI Assistant",
    titleAr: "المساعد الذكي",
    href: "/ai-assistant",
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STUDENT", "TA", "ADVISOR", "HEAD"],
  },
  {
    title: "Academic Advisor",
    titleAr: "المستشار الأكاديمي",
    href: "/ai-assistant/advisor",
    icon: <UserCircle className="h-5 w-5" />,
    roles: ["STUDENT"],
  },
  {
    title: "Scheduler",
    titleAr: "منظم الجدول",
    href: "/ai-assistant/scheduler",
    icon: <Calendar className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Risk Prediction",
    titleAr: "التنبؤ بالمخاطر",
    href: "/ai-assistant/risk-prediction",
    icon: <Shield className="h-5 w-5" />,
    roles: ["ADMIN", "SUPER_ADMIN", "DOCTOR"],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isRTL } = useTranslation();

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.role);
  });

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href={user ? getDashboardRoute(user.role) : "/login"} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-university-gold-400 text-university-blue-900 font-bold text-sm">
            FE
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-semibold text-sm whitespace-nowrap"
            >
              FEE-MENOUF
            </motion.span>
          )}
        </Link>
        {!isMobile && (
          <button
            onClick={onToggle}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
            tabIndex={0}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2" role="navigation" aria-label={isRTL ? "القائمة الرئيسية" : "Main navigation"}>
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onMobileClose()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { isMobile && onMobileClose(); } }}
                tabIndex={0}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                aria-label={isRTL ? item.titleAr : item.title}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sidebar-primary",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <span className="flex-shrink-0" aria-hidden="true">{Icon}</span>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {isRTL ? item.titleAr : item.title}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {!collapsed && user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {generateInitials(user.fullNameEn)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullNameEn}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
            role="presentation"
            aria-hidden="true"
          />
        )}
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              initial={{ x: isRTL ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 300 : -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-0 z-50 h-full shadow-xl",
                isRTL ? "right-0" : "left-0"
              )}
              role="navigation"
              aria-label={isRTL ? "القائمة الجانبية" : "Sidebar navigation"}
            >
              {sidebarContent}
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-30 h-full hidden md:block",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
