"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { searchProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import { Sun, Moon, Search, PanelLeftClose, PanelLeftOpen, Bell, Wallet, User, HelpCircle, LogOut, Loader2, MapPin, DollarSign, FolderKanban, CheckCheck, Info, CheckCircle2, XCircle, X, TrendingUp, Key } from "lucide-react";
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
import { getWalletBalance } from "@/lib/services/walletService";

interface DashboardHeaderProps {
  onSidebarToggle: () => void;
  collapsed: boolean;
}

export default function DashboardHeader({
  onSidebarToggle,
  collapsed,
}: DashboardHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);

    searchTimerRef.current = setTimeout(async () => {
      const { data } = await searchProjects(query.trim(), 8);
      setSearchResults(data || []);
      setSearchLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    if (showSearchResults)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults]);

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
    getWalletBalance(userId).then(({ balance }) => setWalletBalance(balance));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
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
  }, [userId]);

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
    if (next && user) {
      setLoadingNotifications(true);
      const { data } = await getNotifications(20);
      setNotifications(data || []);
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setLoadingNotifications(false);
    }
  };

  const getNotifIcon = (type?: string) => {
    if (type?.includes("rejected"))
      return <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />;
    if (type?.includes("accepted"))
      return (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
      );
    if (type?.includes("system"))
      return <Key className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
    return <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

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

      <header className="h-14 bg-white dark:bg-gray-800/50 flex items-center justify-between rounded-2xl px-3 sm:px-4 flex-shrink-0 shadow-sm">
        {/* Left: Sidebar toggle + Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
            className="btn-gelatine h-8 w-8 shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>

          {/* Search */}
          <div
            className="relative hidden md:block flex-1 max-w-xs"
            ref={searchRef}
          >
            {/* Input wrapper */}
            <div
              className={cn(
                "flex items-center h-8 rounded-lg border bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
                showSearchResults || searchQuery
                  ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-500/15 bg-white dark:bg-gray-700"
                  : "border-transparent",
              )}
            >
              <span className="pl-2.5 flex items-center shrink-0">
                {searchLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                ) : (
                  <Search
                    className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      searchQuery
                        ? "text-cyan-500"
                        : "text-gray-400 dark:text-gray-500",
                    )}
                  />
                )}
              </span>
              <input
                type="text"
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (
                    searchQuery.trim().length >= 2 &&
                    searchResults.length > 0
                  ) {
                    setShowSearchResults(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSearchResults(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Enter" && searchResults.length > 0) {
                    const first = searchResults[0];
                    setShowSearchResults(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    const isRequester = profile?.role === "requester";
                    router.push(
                      isRequester
                        ? `/dashboard/projects/${first.id}/workshop`
                        : `/dashboard/projects/find`,
                    );
                  }
                }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-2 pr-1 py-0 h-full outline-none min-w-0"
              />
              <span className="pr-2 flex items-center gap-1 shrink-0">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none">
                    ⌘K
                  </kbd>
                )}
              </span>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700/80 z-50 overflow-hidden">
                {searchLoading && searchResults.length === 0 ? (
                  <div className="py-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse"
                      >
                        {/* Icon skeleton */}
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                        {/* Text skeleton */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800"
                              style={{ width: `${48 + i * 12}%` }}
                            />
                            <div className="h-[14px] w-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                            <div className="h-2 w-2 rounded-full bg-gray-100 dark:bg-gray-800" />
                            <div className="h-2 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-8 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground/70">
                        No results found
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Try a different keyword
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Dropdown header */}
                    <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-cyan-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {searchResults.length} result
                          {searchResults.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 italic truncate max-w-[120px]">
                        &ldquo;{searchQuery}&rdquo;
                      </span>
                    </div>

                    {/* Result list */}
                    <div className="max-h-72 overflow-y-auto pb-1">
                      {searchResults.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className="group w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                            setSearchResults([]);
                            const isRequester = profile?.role === "requester";
                            router.push(
                              isRequester
                                ? `/dashboard/projects/${project.id}/workshop`
                                : `/dashboard/projects/find`,
                            );
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Icon */}
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-800/40 flex items-center justify-center shrink-0">
                              <FolderKanban className="w-3.5 h-3.5 text-cyan-500" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs font-semibold text-foreground truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                  {project.title}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[8px] px-1.5 py-0 h-[14px] shrink-0 font-semibold rounded-full",
                                    project.status === "open"
                                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                      : project.status === "completed"
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : project.status === "paused"
                                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                                  )}
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                  <DollarSign className="w-2.5 h-2.5" />
                                  {project.budget.toFixed(0)}
                                </span>
                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="truncate">
                                  {project.category}
                                </span>
                                {project.location?.address && (
                                  <>
                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      {project.location.address}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Arrow hint */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-xs">
                              →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                      <p className="text-[10px] text-muted-foreground/70 text-center">
                        Press{" "}
                        <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1 text-[9px] font-medium bg-white dark:bg-gray-800">
                          ↵
                        </kbd>{" "}
                        to select &middot;{" "}
                        <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1 text-[9px] font-medium bg-white dark:bg-gray-800">
                          Esc
                        </kbd>{" "}
                        to close
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Wallet */}
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/wallet")}
            aria-label="Wallet"
            className="btn-gelatine h-8 gap-1.5 px-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            {walletBalance !== null && (
              <span className="text-sm font-semibold tabular-nums hidden sm:inline">
                ${walletBalance.toFixed(2)}
              </span>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="btn-gelatine h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              onClick={toggleNotifications}
              aria-label="Notifications"
              className="btn-gelatine relative h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full px-0.5 leading-none ring-2 ring-white dark:ring-gray-800">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
                {/* Panel header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Notifications
                    </span>
                    {unreadCount === 0 && notifications.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] h-4 px-1.5 py-0"
                      >
                        All read
                      </Badge>
                    )}
                  </div>
                  {loadingNotifications ? (
                    <Skeleton className="h-3.5 w-16 rounded" />
                  ) : notifications.length > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCheck className="w-3 h-3" />
                      Marked as read
                    </span>
                  ) : null}
                </div>

                {/* Notification list */}
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
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-800/40 flex items-center justify-center shrink-0">
                        <Bell className="w-3.5 h-3.5 text-cyan-500" />
                      </div>
                      <p className="text-xs font-medium text-foreground/60">
                        All caught up!
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        No notifications yet.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "px-4 py-3 transition-colors",
                          notif.read ? "" : "bg-cyan-50/60 dark:bg-cyan-900/10",
                        )}
                      >
                        <div className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                              {notif.title || notif.type}
                            </p>
                            {notif.body && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {notif.body}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground/60 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
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
                      className="btn-gelatine flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="btn-gelatine flex items-center gap-2 h-8 px-0 rounded-lg hover:bg-transparent group"
            >
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || "/default-avatar.svg"} />
                  <AvatarFallback className="p-0 overflow-hidden">
                    <img
                      src="/default-avatar.svg"
                      alt={initials}
                      className="w-full h-full object-cover"
                    />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-800" />
              </div>
            </Button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                {/* User info header */}
                <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/40 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-gray-700 shadow-sm">
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
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  {profile?.role && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-[9px] h-4 px-1.5 py-0 capitalize bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                    >
                      {profile.role}
                    </Badge>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <a
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Profile & Settings
                  </a>
                  <a
                    href="/dashboard/support"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    Help & Support
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
      </header>
    </>
  );
}
