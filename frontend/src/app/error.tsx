"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ar = {
  title: "حدث خطأ ما",
  description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
  retry: "إعادة المحاولة",
  home: "العودة للرئيسية",
};

const en = {
  title: "Something went wrong",
  description: "An unexpected error occurred. Please try again.",
  retry: "Try Again",
  home: "Go Home",
};

type Lang = typeof ar;

function getLang(): Lang {
  if (typeof window === "undefined") return en;
  const dir = document.documentElement.dir;
  return dir === "rtl" ? ar : en;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<Lang>(en);

  useEffect(() => {
    setLang(getLang());
  }, []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRTL = lang === ar;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6"
        >
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-2">{lang.title}</h1>
        <p className="text-muted-foreground mb-8">{lang.description}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={reset}>
            <RefreshCw className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            {lang.retry}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
              {lang.home}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
