"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Bell, Globe } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const [notifSettings, setNotifSettings] = React.useState<Record<string, boolean>>({
    email: true,
    push: true,
    grades: true,
    attendance: true,
    schedule: true,
  });

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("notif-settings");
    if (stored) {
      try { setNotifSettings(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const toggleNotif = (key: string) => {
    const next = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(next);
    localStorage.setItem("notif-settings", JSON.stringify(next));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="notifications">{t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("settings.notifications")}
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", title: "Email Notifications", desc: "Receive notifications via email" },
                { key: "push", title: "Push Notifications", desc: "Receive push notifications in browser" },
                { key: "grades", title: "Grade Updates", desc: "Get notified when grades are published" },
                { key: "attendance", title: "Attendance Alerts", desc: "Get alerts about attendance records" },
                { key: "schedule", title: "Schedule Changes", desc: "Get notified about schedule changes" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifSettings[item.key]}
                    onClick={() => toggleNotif(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      notifSettings[item.key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        notifSettings[item.key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.theme")}</CardTitle>
              <CardDescription>Customize the appearance of the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:bg-accent ${
                    mounted && theme === "light" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <Sun className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium">Light</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:bg-accent ${
                    mounted && theme === "dark" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Dark</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("settings.language")}
              </CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLocale("en")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:bg-accent ${
                    locale === "en" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <span className="text-2xl mb-1 block">🇬🇧</span>
                  <p className="text-sm font-medium">English</p>
                </button>
                <button
                  onClick={() => setLocale("ar")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:bg-accent ${
                    locale === "ar" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <span className="text-2xl mb-1 block">🇪🇬</span>
                  <p className="text-sm font-medium">العربية</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
