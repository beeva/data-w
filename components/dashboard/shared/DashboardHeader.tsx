"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient, supabase } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { searchProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import {
  Sun,
  Moon,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Wallet,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  Loader2,
  MapPin,
  DollarSign,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [realtimeToast, setRealtimeToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
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

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    if (showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults]);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load unread count on mount / auth change
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const loadUnread = async () => {
      const { count, error } = await getUnreadNotificationCount();
      if (!error) {
        setUnreadCount(count);
      }
    };

    loadUnread();
  }, [userId]);

  // Load wallet balance
  useEffect(() => {
    if (!userId) return;
    getWalletBalance(userId).then(({ balance }) => setWalletBalance(balance));
  }, [userId]);

  // Realtime subscription: update notification count when new notifications arrive
  useEffect(() => {
    if (!userId) return;

    // const supabase = createClient();
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
          // Guard: only process notifications for this user
          if (notif.user_id !== userId) return;

          setUnreadCount((prev) => prev + 1);
          const toastType = notif.type?.includes("rejected") ? "error"
            : notif.type?.includes("accepted") ? "success"
            : "info";
          setRealtimeToast({
            message: notif.body || notif.title || "New notification",
            type: toastType,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    // Redirect with a query flag so home page can show a UI toast
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

  return (
    <>
    {realtimeToast && (
      <ToastNotification
        message={realtimeToast.message}
        type={realtimeToast.type}
        duration={5000}
        onClose={() => setRealtimeToast(null)}
      />
    )}
    <header className="h-12 bg-white dark:bg-gray-800 flex items-center justify-between rounded-2xl px-2 sm:px-4 flex-shrink-0">
      {/* Left side - Collapse button and Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
          className="h-8 w-8"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>

        {/* Search */}
        <div className="relative hidden md:block flex-1 max-w-md" ref={searchRef}>
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
          {searchLoading && (
            <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin z-10" />
          )}
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            className="pl-8 h-8 text-sm w-full bg-white dark:bg-gray-800"
          />

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              {searchLoading && searchResults.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <Search className="w-4 h-4 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    No projects found for &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-muted-foreground">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {searchResults.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        setSearchResults([]);
                        const isRequester = profile?.role === "requester";
                        router.push(
                          isRequester
                            ? `/dashboard/projects/${project.id}/workshop`
                            : `/dashboard/projects/find`
                        );
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <FolderKanban className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{project.title}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[8px] px-1 py-0 shrink-0",
                                project.status === "open"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : project.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : project.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <DollarSign className="w-2.5 h-2.5" />
                              ${project.budget.toFixed(0)}
                            </span>
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">
                              {project.category}
                            </Badge>
                            {project.location?.address && (
                              <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                                <MapPin className="w-2.5 h-2.5" />
                                {project.location.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1.5">
        {/* Wallet */}
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/wallet")}
          aria-label="Wallet"
          className="h-8 gap-1.5 px-2 sm:px-2.5"
        >
          <Wallet className="w-4 h-4" />
          {walletBalance !== null && (
            <span className="text-xs font-semibold tabular-nums hidden sm:inline">
              ${walletBalance.toFixed(2)}
            </span>
          )}
        </Button>

        {/* Dark/Light Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="h-8 w-8"
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
            size="icon"
            onClick={toggleNotifications}
            className="relative h-8 w-8"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-40 text-sm">
              <div className="px-3 pb-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Notifications
                </span>
                {loadingNotifications && (
                  <span className="text-[10px] text-muted-foreground">
                    Loading...
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && !loadingNotifications ? (
                  <div className="px-3 py-4 text-[11px] text-muted-foreground">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0",
                        notif.read
                          ? "bg-transparent"
                          : "bg-cyan-50 dark:bg-cyan-900/20"
                      )}
                    >
                      <p className="text-xs font-medium text-foreground">
                        {notif.title || notif.type}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <Button
            variant="ghost"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 h-auto p-1"
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-foreground">
                  {profile?.full_name || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {profile?.role || "Member"}
                </p>
              </div>
              <a
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                )}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </a>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1.5 pt-1.5">
                <a
                  href="/"
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                  )}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help & Support
                </a>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  )}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
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
