"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Users,
  TrendingUp,
  Shield,
  Calendar,
  ArrowRight,
  Star,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    icon: BookOpen,
    title: "Course Management",
    titleAr: "إدارة المقررات",
    description: "Comprehensive course catalog with scheduling, materials, and assignment tracking.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    titleAr: "تتبع الحضور",
    description: "Real-time attendance monitoring with automatic reports and notifications.",
  },
  {
    icon: TrendingUp,
    title: "Grade Analytics",
    titleAr: "تحليل الدرجات",
    description: "Detailed grade analysis with GPA calculation and performance insights.",
  },
  {
    icon: Users,
    title: "Student Portal",
    titleAr: "بوابة الطالب",
    description: "Self-service portal for registration, schedules, and academic records.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    titleAr: "جدولة ذكية",
    description: "Intelligent timetable generation with conflict resolution.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    titleAr: "منصة آمنة",
    description: "Enterprise-grade security with role-based access control.",
  },
];

const stats = [
  { value: "5,000+", label: "Students", labelAr: "طالب" },
  { value: "200+", label: "Faculty Members", labelAr: "عضو هيئة تدريس" },
  { value: "150+", label: "Courses", labelAr: "مقرر دراسي" },
  { value: "98%", label: "Satisfaction Rate", labelAr: "نسبة الرضا" },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-university-blue-800 text-university-gold-400 font-bold">
                FE
              </div>
              <span className="font-semibold text-lg">FEE-MENOUF</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {["Features", "About", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t bg-background md:hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {["Features", "About", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-university-blue-900 via-university-blue-800 to-university-blue-950" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </motion.div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="gold" size="lg" className="mb-4">
                Smart University Platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Faculty of Engineering
                <br />
                <span className="text-university-gold-400">Menoufia University</span>
              </h1>
              <p className="text-lg text-blue-200 mb-8 max-w-lg">
                A comprehensive academic management platform designed to streamline
                university operations, enhance learning experiences, and drive
                academic excellence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-university-gold-400 text-university-blue-900 hover:bg-university-gold-500" asChild>
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-full aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-university-gold-400/20 to-transparent rounded-3xl" />
                  <div className="relative grid grid-cols-2 gap-4">
                    {[
                      { icon: GraduationCap, label: "Academics", value: "Excellence" },
                      { icon: Users, label: "Community", value: "10,000+" },
                      { icon: BookOpen, label: "Programs", value: "25+" },
                      { icon: Star, label: "Ranking", value: "Top 10" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                      >
                        <item.icon className="h-6 w-6 text-university-gold-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{item.value}</p>
                        <p className="text-sm text-blue-200">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-white/50" />
        </motion.div>
      </section>

      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <Badge variant="gold" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for managing every aspect of academic life
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  custom={i}
                >
                  <Card className="group card-hover h-full">
                    <CardContent className="p-6">
                      <div className="rounded-lg w-12 h-12 flex items-center justify-center bg-university-blue-800/10 dark:bg-university-blue-800/30 text-university-blue-800 dark:text-university-gold-400 mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-university-blue-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                custom={i}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-university-gold-400 mb-2">
                  {stat.value}
                </p>
                <p className="text-blue-200">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="contact" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <Badge variant="gold" className="mb-4">Contact</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of students and faculty members already using
              FEE-MENOUF Platform
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-university-blue-800 text-university-gold-400 font-bold">
                  FE
                </div>
                <span className="font-semibold">FEE-MENOUF</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Faculty of Engineering - Menoufia University.
                Empowering academic excellence through innovative technology.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Features", "About", "Contact"] },
              { title: "Support", links: ["Help Center", "Documentation", "API Status"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FEE-MENOUF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
