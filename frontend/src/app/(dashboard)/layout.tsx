"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { direction } = useTranslation();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn(
        "min-h-screen bg-muted/30",
        direction === "rtl" && "rtl"
      )}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "transition-all duration-300",
          isMobile
            ? "ml-0"
            : sidebarCollapsed
            ? "md:ml-[72px]"
            : "md:ml-[280px]"
        )}
      >
        <Navbar onMenuToggle={() => setMobileOpen(true)} />

        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="border-t py-4 px-4 lg:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FEE-MENOUF. All rights reserved.</p>
            <p>Faculty of Engineering - Menoufia University</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
