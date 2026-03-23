"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getProjectsByRequester } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import {
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  Loader2,
  MapPin,
  DollarSign,
  FolderKanban,
  Info,
  CheckCircle2,
  XCircle,
  X,
  TrendingUp,
  Key,
  MessageSquare,
  CreditCard,
  PlusCircle,
  ArrowLeftRight,
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
import { getUnreadMessagesCount } from "@/lib/services/chatService";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RequesterHeader() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifTab, setNotifTab] = useState<"activity" | "messages">("activity");
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<{
    title?: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Search state: requester's own projects
  const [searchQuery, setSearchQuery] = useState("");
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchResults =
    searchQuery.trim().length < 2
      ? []
      : myProjects
          .filter(
            (p) =>
              p.title
                .toLowerCase()
                .includes(searchQuery.trim().toLowerCase()) ||
              (p.category
                ?.toLowerCase()
                .includes(searchQuery.trim().toLowerCase()) ??
                false),
          )
          .slice(0, 8);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (query.trim().length < 2) {
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);
    searchTimerRef.current = setTimeout(() => {
      setSearchLoading(false);
    }, 150);
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
      setMyProjects([]);
      return;
    }
    getProjectsByRequester(userId).then(({ data }) => {
      if (data) setMyProjects(data);
    });
  }, [userId]);

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
    if (!userId) {
      setUnreadMessagesCount(0);
      return;
    }
    if (pathname?.startsWith("/dashboard/messages")) {
      setUnreadMessagesCount(0);
      return;
    }
    getUnreadMessagesCount(userId, "requester").then(({ count, error }) => {
      if (!error) setUnreadMessagesCount(count);
    });
  }, [userId, pathname]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`messages-unread-requester-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const message = payload.new as {
            requester_id?: string;
            collector_id?: string;
            sender_id?: string;
          };
          if (pathname?.startsWith("/dashboard/messages")) return;
          const involvesCurrentUser =
            message.requester_id === userId || message.collector_id === userId;
          if (!involvesCurrentUser || message.sender_id === userId) return;
          setUnreadMessagesCount((prev) => prev + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pathname]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-requester-${userId}`)
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

  const isProjectsActive = pathname?.startsWith("/dashboard/projects");
  const isFinancesActive =
    pathname?.startsWith("/dashboard/billing") ||
    pathname?.startsWith("/dashboard/wallet");
  const isMessagesActive = pathname?.startsWith("/dashboard/messages");

  const navButtonClass = (active: boolean) =>
    cn(
      "btn-gelatine flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
      active
        ? "text-cyan-600 dark:text-cyan-400 bg-white dark:bg-transparent"
        : "text-gray-600 dark:text-gray-300",
    );

  const goToProject = (project: Project) => {
    setShowSearchResults(false);
    setSearchQuery("");
    router.push(`/dashboard/projects/${project.id}/workshop`);
  };

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

      <header className="h-16 bg-white dark:bg-gray-800/50 flex items-center justify-between rounded-2xl px-4 sm:px-6 flex-shrink-0 shadow-sm">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-5 lg:gap-7">
          <Link
            href="/dashboard/home"
            className="btn-gelatine shrink-0 flex items-center"
          >
            <Image
              src="/logo-dark.png"
              alt="DataW"
              width={120}
              height={48}
              className="dark:hidden h-10 w-auto"
            />
            <Image
              src="/logo.png"
              alt="DataW"
              width={120}
              height={48}
              className="hidden dark:block h-10 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            <Link
              href="/dashboard/projects/active"
              className={navButtonClass(isProjectsActive)}
            >
              My Projects
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

            <Link
              href="/dashboard/messages"
              className={navButtonClass(isMessagesActive)}
            >
              Messages
              {unreadMessagesCount > 0 && (
                <span className="ml-1.5 min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Right: Search + Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="relative hidden md:block flex-1 max-w-[240px] lg:max-w-sm"
            ref={searchRef}
          >
            <div
              className={cn(
                "flex items-center h-9 rounded-lg border bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
                showSearchResults || searchQuery
                  ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-500/15 bg-white dark:bg-gray-700"
                  : "border-transparent",
              )}
            >
              <span className="pl-3 flex items-center shrink-0">
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                ) : (
                  <Search
                    className={cn(
                      "w-4 h-4 transition-colors",
                      searchQuery
                        ? "text-cyan-500"
                        : "text-gray-400 dark:text-gray-500",
                    )}
                  />
                )}
              </span>
              <input
                type="text"
                placeholder="Search your projects…"
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
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Enter" && searchResults.length > 0) {
                    goToProject(searchResults[0]);
                  }
                }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-2.5 pr-1 py-0 h-full outline-none min-w-0"
              />
              <span className="pr-2 flex items-center gap-1 shrink-0">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
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

            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700/80 z-50 overflow-hidden">
                {searchLoading && searchResults.length === 0 ? (
                  <div className="py-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
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
                        No projects match
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Try a different keyword
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-cyan-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {searchResults.length} project
                          {searchResults.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 italic truncate max-w-[120px]">
                        &ldquo;{searchQuery}&rdquo;
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto pb-1">
                      {searchResults.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className="group w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                          onClick={() => goToProject(project)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-800/40 flex items-center justify-center shrink-0">
                              <FolderKanban className="w-3.5 h-3.5 text-cyan-500" />
                            </div>
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
                                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                                  )}
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                  <DollarSign className="w-2.5 h-2.5" />
                                  {project.budget?.toFixed?.(0) ??
                                    project.budget}
                                </span>
                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="truncate">
                                  {project.category ?? "—"}
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
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-xs">
                              →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                      <p className="text-[10px] text-muted-foreground/70 text-center">
                        Press{" "}
                        <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1 text-[9px] font-medium bg-white dark:bg-gray-800">
                          ↵
                        </kbd>{" "}
                        to open &middot;{" "}
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

          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="btn-gelatine h-9 w-9 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
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
              className="btn-gelatine relative h-9 w-9 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
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
              className="btn-gelatine flex items-center h-9 rounded-lg hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <Avatar className="w-9 h-9">
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
                  {profile?.role && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-[9px] h-4 px-1.5 py-0 capitalize bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                    >
                      {profile.role}
                    </Badge>
                  )}
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
      </header>
    </>
  );
}
