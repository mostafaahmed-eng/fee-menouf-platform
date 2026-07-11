"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-university-gold-400 to-amber-500 mb-6 shadow-lg"
        >
          <GraduationCap className="h-12 w-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-7xl font-bold mb-2 bg-gradient-to-r from-university-gold-400 to-amber-500 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-lg font-semibold text-muted-foreground mb-1">
            الصفحة غير موجودة
          </p>
          <p className="text-lg font-semibold text-muted-foreground mb-6">
            Page Not Found
          </p>
          <p className="text-muted-foreground mb-2">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
          <p className="text-muted-foreground mb-8 text-sm">
            The page you are looking for does not exist or has been moved.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button asChild size="lg">
            <Link href="/">
              <Home className="ms-2 h-4 w-4" />
              الصفحة الرئيسية / Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">
              <ArrowLeft className="ms-2 h-4 w-4" />
              تسجيل الدخول / Login
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-xs text-muted-foreground"
        >
          كلية الهندسة - جامعة المنوفية &copy; {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}
