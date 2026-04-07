"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  Server,
  Database,
  Shield,
  BarChart3,
  Loader2,
  RefreshCw,
  Bell,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  pendingSubmissions: number;
  usersByRole: Record<string, number> | null;
}

interface ActivityItem {
  activity_type: string;
  message: string;
  created_at: string;
}

function OverallHealthGauge({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const r = 40;
  const strokeWidth = 10;
  const segments = [
    {
      startDeg: 180,
      endDeg: 92,
      color: "#ef4444",
      colorMuted: "rgb(254 226 226)",
    },
    {
      startDeg: 88,
      endDeg: 36,
      color: "#eab308",
      colorMuted: "rgb(254 249 195)",
    },
    {
      startDeg: 32,
      endDeg: 0,
      color: "#22c55e",
      colorMuted: "rgb(220 252 231)",
    },
  ] as const;

  const degToXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const arcPath = (startDeg: number, endDeg: number) => {
    const s = degToXY(startDeg);
    const e = degToXY(endDeg);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  };

  const endAngleDeg = 180 - (clamped / 100) * 180;
  const displayValue = value % 1 === 0 ? `${Math.round(value)}%` : `${value}%`;

  return (
    <div className="relative w-full max-w-[160px] aspect-[100/55] min-h-[88px]">
      <svg
        viewBox="0 0 100 55"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Track: 3 sections with padding (muted colors) */}
        {segments.map((seg, i) => (
          <path
            key={`track-${i}`}
            d={arcPath(seg.startDeg, seg.endDeg)}
            fill="none"
            stroke={seg.colorMuted}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
        {/* Fill: same 3 sections, filled up to value (cap at segment end so we don't draw into gap) */}
        {clamped > 0 &&
          segments.map((seg, i) => {
            const fillEnd = Math.min(
              seg.endDeg,
              Math.max(seg.endDeg, Math.min(seg.startDeg, endAngleDeg)),
            );
            if (fillEnd >= seg.startDeg) return null;
            return (
              <path
                key={`fill-${i}`}
                d={arcPath(seg.startDeg, fillEnd)}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-[12%] pointer-events-none">
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {displayValue}
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id;

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [statsRes, activityRes] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.rpc("get_admin_recent_activity", { activity_limit: 15 }),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (activityRes.error) throw activityRes.error;

      setStats(statsRes.data as AdminStats);
      setActivity((activityRes.data as ActivityItem[]) || []);
    } catch (err: any) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getActivityTitle = (activityType: string) => {
    switch (activityType) {
      case "user":
        return "New user registered";
      case "project":
        return "Project created";
      case "submission":
        return "New submission";
      case "payment":
        return "Payment completed";
      case "alert":
        return "Alert";
      default:
        return "Activity";
    }
  };

  const getActivitySubtitle = (item: ActivityItem) => {
    const title = getActivityTitle(item.activity_type);
    const prefix = title + ": ";
    let subtitle: string;
    if (item.message.startsWith(prefix)) {
      subtitle = item.message.slice(prefix.length);
    } else {
      subtitle = item.message;
    }
    if (
      item.activity_type === "user" &&
      subtitle &&
      !subtitle.endsWith("joined the platform.")
    ) {
      return `${subtitle} joined the platform.`;
    }
    return subtitle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  const totalUsers = stats?.totalUsers ?? 0;
  const usersByRole = stats?.usersByRole ?? {};
  const roleTotal =
    Object.values(usersByRole).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">
                  {totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(stats?.activeUsers ?? 0).toLocaleString()} active (30d)
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold mt-1">
                  {(stats?.totalProjects ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeProjects ?? 0} active
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  $
                  {Number(stats?.totalRevenue ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed transactions
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Submissions
                </p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {stats?.pendingSubmissions ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting review
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Distribution & Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-muted-foreground" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex flex-row items-center justify-between py-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Overall Health
              </span>
              <OverallHealthGauge value={98.5} />
            </div>

            <div className="border-t border-border/60 pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5 mb-2">
                Services
              </p>
              {[
                { icon: Database, label: "Database", status: "Healthy" },
                { icon: Server, label: "API Server", status: "Healthy" },
                { icon: Shield, label: "Security", status: "Secure" },
              ].map(({ icon: Icon, label, status }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg bg-muted/50 dark:bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background dark:bg-gray-800/80 shadow-sm">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                      aria-hidden
                    />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(["requester", "collector", "agent", "admin"] as const).map(
                (role) => {
                  const count = Number(usersByRole[role] ?? 0);
                  const pct = Math.round((count / roleTotal) * 100);
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{role}s</span>
                        <span className="font-medium">
                          {count.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline (matches requester dashboard style) */}
        <Card className="border-none shadow-md dark:bg-gray-800/50 pt-2 flex-shrink-0">
          <CardHeader className="pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Activity Timeline
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-0 pl-5 pr-0">
            <ScrollArea className="h-52 pr-5">
              {loading ? (
                <div className="space-y-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Skeleton className="w-[18px] h-[18px] rounded-full shrink-0 mt-[1px]" />
                        {i < 3 && (
                          <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1 mb-1" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-1 min-w-0",
                          i < 3 ? "pb-5" : "pb-1",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Skeleton className="h-4 flex-1 max-w-[200px]" />
                          <Skeleton className="h-3 w-12 shrink-0" />
                        </div>
                        <Skeleton className="h-3 w-full mt-2 max-w-[160px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="min-h-52 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No recent activity yet
                  </p>
                </div>
              ) : (
                <div>
                  {activity.map((item, idx) => {
                    const dotInner =
                      item.activity_type === "payment"
                        ? "bg-emerald-500"
                        : item.activity_type === "submission"
                          ? "bg-green-500"
                          : item.activity_type === "alert"
                            ? "bg-red-500"
                            : item.activity_type === "project"
                              ? "bg-purple-500"
                              : item.activity_type === "user"
                                ? "bg-blue-500"
                                : "bg-cyan-500";
                    const dotOuter =
                      item.activity_type === "payment"
                        ? "bg-emerald-500/10"
                        : item.activity_type === "submission"
                          ? "bg-green-500/10"
                          : item.activity_type === "alert"
                            ? "bg-red-500/10"
                            : item.activity_type === "project"
                              ? "bg-purple-500/10"
                              : item.activity_type === "user"
                                ? "bg-blue-500/10"
                                : "bg-cyan-500/10";
                    const isLast = idx === activity.length - 1;
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center mt-[1px]",
                              dotOuter,
                            )}
                          >
                            <span
                              className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                dotInner,
                              )}
                            />
                          </span>
                          {!isLast && (
                            <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1 mb-1" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "flex-1 min-w-0",
                            !isLast ? "pb-5" : "pb-1",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug text-foreground">
                              {getActivityTitle(item.activity_type)}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-px">
                              {formatTimeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                            {getActivitySubtitle(item)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="w-5 h-5" />
              <span>View Projects</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Shield className="w-5 h-5" />
              <span>Security</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
