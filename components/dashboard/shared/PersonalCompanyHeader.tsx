"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  Home,
  Info,
  CheckCircle2,
  XCircle,
  X,
  Key,
  MessageSquare,
  CreditCard,
  ArrowLeftRight,
  Menu,
  FolderSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ToastNotification from "@/components/ui/toast-notification";
import type { AppNotification } from "@/types/notification";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/lib/services/notificationService";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PersonalCompanyKind = "personal" | "company";

interface PersonalCompanyHeaderProps {
  accountKind: PersonalCompanyKind;
}

export default function PersonalCompanyHeader({
  accountKind,
}: PersonalCompanyHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"activity" | "messages">("activity");
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<{
    title?: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      router.push("/datapool");
      return;
    }
    router.push(`/datapool?keyword=${encodeURIComponent(q)}`);
  }, [router, searchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    getUnreadNotificationCount().then(({ count, error }) => {
      if (!error) setUnreadCount(count);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${accountKind}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<AppNotification>) => {
          const notif = payload.new as AppNotification;
          if (notif.user_id !== userId) return;
          setUnreadCount((prev) => prev + 1);
          const toastType = notif.type?.includes("rejected")
            ? "error"
            : notif.type?.includes("accepted")
              ? "success"
              : "info";
          setRealtimeToast({
            title: notif.title || "Notification",
            message: notif.body || notif.title || "New notification",
            type: toastType,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, accountKind]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    router.push("/?toast=signout-success");
    router.refresh();
  };

  const toggleNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (!next) setNotifTab("activity");
    if (next && user) {
      setLoadingNotifications(true);
      const { data } = await getNotifications(5);
      setNotifications(data || []);
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setLoadingNotifications(false);
    }
  };

  const getNotifIconBg = (type?: string) => {
    if (type?.includes("rejected"))
      return "bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-800/40";
    if (type?.includes("accepted"))
      return "bg-green-50 dark:bg-green-900/20 ring-green-100 dark:ring-green-800/40";
    return "bg-cyan-50 dark:bg-cyan-900/20 ring-cyan-100 dark:ring-cyan-800/40";
  };

  const getNotifIcon = (type?: string) => {
    if (type?.includes("rejected"))
      return <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />;
    if (type?.includes("accepted"))
      return (
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
      );
    if (type?.includes("system"))
      return <Key className="w-4 h-4 text-cyan-500 shrink-0" />;
    return <Info className="w-4 h-4 text-cyan-500 shrink-0" />;
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  const isHomeActive = pathname === "/dashboard/home";
  const isDataPoolActive = pathname?.startsWith("/datapool") ?? false;
  const isFinancesActive =
    pathname?.startsWith("/dashboard/billing") ||
    pathname?.startsWith("/dashboard/wallet");

  const navButtonClass = (active: boolean) =>
    cn(
      "btn-gelatine flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
      active
        ? "text-cyan-600 dark:text-cyan-400 bg-white dark:bg-transparent"
        : "text-gray-600 dark:text-gray-300",
    );
  const mobileMenuItemClass = (active: boolean) =>
    cn(
      "gap-2.5 cursor-pointer",
      active && "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300",
    );

  const roleLabel = accountKind === "company" ? "Company" : "Personal";

  return (
    <>
      {realtimeToast && (
        <ToastNotification
          title={realtimeToast.title}
          message={realtimeToast.message}
          type={realtimeToast.type}
          duration={5000}
          onClose={() => setRealtimeToast(null)}
        />
      )}

      <header className="bg-white dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-y-2 rounded-2xl px-3 py-2 sm:px-6 sm:py-3 flex-shrink-0 shadow-sm">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5 lg:gap-7">
          <Link
            href="/dashboard/home"
            className="btn-gelatine shrink-0 flex items-center"
          >
            <div className="relative h-9 w-[104px] sm:h-10 sm:w-[120px] dark:hidden">
              <Image
                src="/logo-dark.png"
                alt="DataW"
                fill
                className="object-contain object-left"
                sizes="120px"
              />
            </div>
            <div className="relative hidden h-9 w-[104px] sm:h-10 sm:w-[120px] dark:block">
              <Image
                src="/logo.png"
                alt="DataW"
                fill
                className="object-contain object-left"
                sizes="120px"
                loading="eager"
              />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            <Link href="/dashboard/home" className={navButtonClass(isHomeActive)}>
              <Home className="w-3.5 h-3.5 opacity-70" />
              Home
            </Link>

            <Link href="/datapool" className={navButtonClass(isDataPoolActive)}>
              <FolderSearch className="w-3.5 h-3.5 opacity-70" />
              Data Pool
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={navButtonClass(isFinancesActive)}>
                  Manage Finances
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-2"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/billing")}
                  className="gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                  Billing &amp; Subscription
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/wallet")}
                  className="gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                  Transactions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Open navigation menu"
                className={cn(
                  "btn-gelatine h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg lg:hidden",
                  mobileMenuOpen
                    ? "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50",
                )}
              >
                <Menu className="w-[18px] h-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/home")}
                className={mobileMenuItemClass(isHomeActive)}
              >
                <Home className="w-3.5 h-3.5 text-cyan-500" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/datapool")}
                className={mobileMenuItemClass(isDataPoolActive)}
              >
                <FolderSearch className="w-3.5 h-3.5 text-cyan-500" />
                Data Pool
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/billing")}
                className={mobileMenuItemClass(
                  pathname?.startsWith("/dashboard/billing") ?? false,
                )}
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                Billing &amp; Subscription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/wallet")}
                className={mobileMenuItemClass(
                  pathname?.startsWith("/dashboard/wallet") ?? false,
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                Transactions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative hidden md:block flex-1 max-w-[240px] lg:max-w-sm">
            <div
              className={cn(
                "flex items-center h-9 rounded-lg border bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
                searchQuery
                  ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-500/15 bg-white dark:bg-gray-700"
                  : "border-transparent",
              )}
            >
              <span className="pl-3 flex items-center shrink-0">
                <Search
                  className={cn(
                    "w-4 h-4 transition-colors",
                    searchQuery
                      ? "text-cyan-500"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                />
              </span>
              <input
                type="text"
                placeholder="Search data pool…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-2.5 pr-1 py-0 h-full outline-none min-w-0"
              />
              <span className="pr-2 flex items-center gap-1 shrink-0">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none">
                    ↵
                  </kbd>
                )}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="btn-gelatine h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </Button>

          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              onClick={toggleNotifications}
              aria-label="Notifications"
              className="btn-gelatine relative h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full px-0.5 leading-none ring-2 ring-white dark:ring-gray-800">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
                <div className="px-4 pt-3 pb-0 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <Badge className="text-[9px] h-4 px-1.5 py-0 bg-cyan-500 text-white border-0">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {loadingNotifications ? (
                      <Skeleton className="h-3.5 w-16 rounded" />
                    ) : notifications.length > 0 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await markAllNotificationsAsRead();
                          setUnreadCount(0);
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, read: true })),
                          );
                        }}
                        className="text-[11px] font-medium text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>

                  <div className="flex gap-0.5">
                    {(["activity", "messages"] as const).map((tab) => {
                      const label =
                        tab === "activity" ? "Activity" : "Messages";
                      const isActive = notifTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setNotifTab(tab)}
                          className={cn(
                            "px-3.5 py-1.5 text-xs font-medium rounded-t-lg transition-all duration-150 relative",
                            isActive
                              ? "text-cyan-600 dark:text-cyan-400 bg-gray-50 dark:bg-gray-800 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500 after:rounded-full"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
                  {loadingNotifications ? (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-2.5">
                          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-3/4 rounded" />
                            <Skeleton className="h-3 w-full rounded" />
                            <Skeleton className="h-2.5 w-1/3 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const filtered =
                        notifTab === "messages"
                          ? notifications.filter(
                              (n) =>
                                n.type?.includes("message") ||
                                n.type?.includes("chat"),
                            )
                          : notifications.filter(
                              (n) =>
                                !n.type?.includes("message") &&
                                !n.type?.includes("chat"),
                            );

                      if (filtered.length === 0) {
                        return (
                          <div className="px-4 py-8 text-center">
                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                              {notifTab === "messages" ? (
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Bell className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-foreground/60">
                              {notifTab === "messages"
                                ? "No message notifications"
                                : "All caught up!"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {notifTab === "messages"
                                ? "New messages will appear here."
                                : "No activity notifications yet."}
                            </p>
                          </div>
                        );
                      }

                      return filtered.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "px-4 py-3 transition-colors",
                            notif.read
                              ? ""
                              : "bg-cyan-50/60 dark:bg-cyan-900/10",
                          )}
                        >
                          <div className="flex gap-2.5">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                notifTab === "messages"
                                  ? "bg-cyan-50 dark:bg-cyan-900/20 ring-cyan-100 dark:ring-cyan-800/40"
                                  : getNotifIconBg(notif.type),
                              )}
                            >
                              {notifTab === "messages" ? (
                                <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                              ) : (
                                getNotifIcon(notif.type)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground leading-tight">
                                {notif.title || notif.type}
                              </p>
                              {notif.body && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                  {notif.body}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground/50 mt-1">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1 shrink-0" />
                            )}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/dashboard/notifications");
                      }}
                      className="btn-gelatine flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                      View all notifications
                      <span className="text-gray-400">→</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="btn-gelatine flex items-center h-8 sm:h-9 rounded-lg hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                  <AvatarImage src={profile?.avatar_url || "/default-avatar.svg"} />
                  <AvatarFallback className="p-0 overflow-hidden">
                    <img
                      src="/default-avatar.svg"
                      alt={initials}
                      className="w-full h-full object-cover"
                    />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-800" />
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/40 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700 shadow-sm">
                      <AvatarImage src={profile?.avatar_url || "/default-avatar.svg"} />
                      <AvatarFallback className="p-0 overflow-hidden">
                        <img
                          src="/default-avatar.svg"
                          alt={initials}
                          className="w-full h-full object-cover"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="mt-2 text-[9px] h-4 px-1.5 py-0 capitalize bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                  >
                    {roleLabel}
                  </Badge>
                </div>

                <div className="py-1">
                  <a
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Profile &amp; Settings
                  </a>
                  <a
                    href="/dashboard/support"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    Help &amp; Support
                  </a>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-3 w-full md:hidden">
          <div
            className={cn(
              "flex items-center h-9 rounded-lg border bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
              searchQuery
                ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-500/15 bg-white dark:bg-gray-700"
                : "border-transparent",
            )}
          >
            <span className="pl-3 flex items-center shrink-0">
              <Search
                className={cn(
                  "w-4 h-4 transition-colors",
                  searchQuery
                    ? "text-cyan-500"
                    : "text-gray-400 dark:text-gray-500",
                )}
              />
            </span>
            <input
              type="text"
              placeholder="Search data pool…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchQuery("");
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-2.5 pr-1 py-0 h-full outline-none min-w-0"
            />
            <span className="pr-2 flex items-center gap-1 shrink-0">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                </button>
              ) : null}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
