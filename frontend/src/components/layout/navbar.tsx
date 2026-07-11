"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useTheme } from "next-themes";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { generateInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Moon,
  Sun,
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  Globe,
  ChevronDown,

  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL, locale, setLocale, direction } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Array<{ id: string; type: string; label: string; description?: string; href: string }>>([]);
  const [searching, setSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const doSearch = async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/search", { params: { q: debouncedSearch } });
        setSearchResults(data.data?.results || data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    doSearch();
  }, [debouncedSearch]);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSelect = (result: { id: string; type: string; label: string; href: string }) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(result.href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setShowResults(false); (e.target as HTMLInputElement).blur(); }
    if (e.key === "Enter" && searchResults.length > 0) { handleSearchSelect(searchResults[0]); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = searchRef.current?.querySelectorAll<HTMLButtonElement>("[data-search-item]");
      if (!items?.length) return;
      const current = document.activeElement;
      const idx = Array.from(items).indexOf(current as HTMLButtonElement);
      const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      items[next]?.focus();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
  };

  const notifications = [
    { id: "1", title: "New course material available", type: "info", time: "5m ago" },
    { id: "2", title: "Attendance marked for today", type: "success", time: "1h ago" },
    { id: "3", title: "Assignment submission due tomorrow", type: "warning", time: "3h ago" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6",
        direction === "rtl" && "flex-row-reverse"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className={cn("flex-1 flex items-center gap-4", isRTL && "flex-row-reverse")}>
        {!isMobile && (
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onKeyDown={handleSearchKeyDown}
              className="ps-9 h-9 bg-muted/50 border-none focus-visible:bg-background"
            />
            {searching && (
              <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <AnimatePresence>
              {showResults && (searchResults.length > 0 || searching) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 w-full rounded-lg border bg-popover p-1 shadow-md"
                >
                  {searching ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      Searching...
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          data-search-item
                          onClick={() => handleSearchSelect(result)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSearchSelect(result); }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <span className="text-xs font-medium uppercase text-muted-foreground w-12 shrink-0">
                            {result.type}
                          </span>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="truncate font-medium">{result.label}</p>
                            {result.description && (
                              <p className="truncate text-xs text-muted-foreground">{result.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="relative"
        >
          <Globe className="h-5 w-5" />
          <span className="absolute -bottom-0.5 text-[8px] font-bold">
            {locale === "en" ? "AR" : "EN"}
          </span>
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                0
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              {t("nav.notifications")}
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
                {t("common.viewAll")}
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium">{notif.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{notif.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user ? generateInitials(user.fullNameEn) : "U"}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user?.fullNameEn}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.fullNameEn}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="ms-2 h-4 w-4" />
              {t("nav.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="ms-2 h-4 w-4" />
              {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="ms-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
