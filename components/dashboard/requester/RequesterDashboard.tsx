"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  completeProjectWithCollectorFeedbacks,
  getProjectsByRequester,
  updateProjectStatus,
  type RequesterCollectorFeedbackInput,
} from "@/lib/services/projectService";
import { getNotifications } from "@/lib/services/notificationService";
import { getSubmissionsByProject } from "@/lib/services/submissionService";
import { getAssignmentsByProject } from "@/lib/services/proposalService";
import type { Project, ProjectStatus } from "@/types/project";
import type { AppNotification } from "@/types/notification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Bell,
  ArrowRight,
  FileCheck,
  Eye,
  Timer,
  Zap,
  Pause,
  Play,
  Users,
  Camera,
  Video,
  Mic,
  FileText,
  ClipboardList,
  MapPin,
  Activity,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  Image,
  ImagePlus,
  Palette,
  Paintbrush,
  LayoutGrid,
  PenTool,
  Film,
  Music,
  Type,
  ListChecks,
  Radio,
  Gauge,
  LifeBuoy,
  BookOpen,
  MessageSquare,
  Settings,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CompleteProjectDialog, {
  type CollectorCompletionFeedback,
  type CollectorFeedbackTarget,
} from "./CompleteProjectDialog";
import CreateProjectDialog from "./CreateProjectDialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

function RequesterGuideOverlay({
  targetSelector,
  title,
  content,
  step,
  totalSteps,
  onClose,
  onNext,
  onBack,
}: {
  targetSelector: string | null;
  title: string;
  content: string;
  step: number;
  totalSteps: number;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom" | "left" | "right";
  } | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setTargetRect(null);
      setPopoverPos(null);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (!el) {
      setTargetRect(null);
      setPopoverPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    const popoverWidth = 320;
    const popoverHeight = 180;
    const gap = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const spaceBottom = viewportH - rect.bottom;
    const spaceTop = rect.top;
    const spaceRight = viewportW - rect.right;
    const spaceLeft = rect.left;
    let placement: "top" | "bottom" | "left" | "right" = "bottom";
    let top = 0;
    let left = 0;
    if (spaceBottom >= popoverHeight + gap) {
      placement = "bottom";
      top = rect.bottom + gap;
      left = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - popoverWidth / 2,
          viewportW - popoverWidth - 16,
        ),
      );
    } else if (spaceTop >= popoverHeight + gap) {
      placement = "top";
      top = rect.top - popoverHeight - gap;
      left = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - popoverWidth / 2,
          viewportW - popoverWidth - 16,
        ),
      );
    } else if (spaceRight >= popoverWidth + gap) {
      placement = "right";
      left = rect.right + gap;
      top = Math.max(
        16,
        Math.min(
          rect.top + rect.height / 2 - popoverHeight / 2,
          viewportH - popoverHeight - 16,
        ),
      );
    } else {
      placement = "left";
      left = rect.left - popoverWidth - gap;
      top = Math.max(
        16,
        Math.min(
          rect.top + rect.height / 2 - popoverHeight / 2,
          viewportH - popoverHeight - 16,
        ),
      );
    }
    setPopoverPos({ top, left, placement });
  }, [targetSelector]);

  const padding = 8;
  const highlightTop = targetRect ? targetRect.top - padding : 0;
  const highlightLeft = targetRect ? targetRect.left - padding : 0;
  const highlightWidth = targetRect ? targetRect.width + padding * 2 : 0;
  const highlightHeight = targetRect ? targetRect.height + padding * 2 : 0;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Full-screen transparent overlay for click-to-close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden
      />
      {/* Spotlight: box-shadow creates dimmed area with rounded inner edge; shadow follows border-radius */}
      {targetRect && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            top: highlightTop,
            left: highlightLeft,
            width: highlightWidth,
            height: highlightHeight,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
          }}
        />
      )}
      {/* Popover */}
      {popoverPos && (
        <div
          className="absolute w-80 rounded-xl shadow-2xl bg-card border border-border overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
          }}
        >
          <div className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-card-foreground text-base leading-tight">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {content}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 pb-4 pt-1">
            <span className="text-xs font-semibold text-primary">
              {step} of {totalSteps}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-8 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent border-border"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={onNext}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {step >= totalSteps ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
          {/* Caret pointing to target */}
          {targetRect && popoverPos && (
            <div
              className={cn(
                "absolute w-0 h-0 border-solid border-transparent",
                popoverPos.placement === "bottom" &&
                  "border-b-[8px] border-b-primary -top-2 left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-t-0",
                popoverPos.placement === "top" &&
                  "border-t-[8px] border-t-card -bottom-2 left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-b-0",
                popoverPos.placement === "right" &&
                  "border-r-[8px] border-r-card top-1/2 -translate-y-1/2 -left-2 border-y-[8px] border-y-transparent border-l-0",
                popoverPos.placement === "left" &&
                  "border-l-[8px] border-l-card top-1/2 -translate-y-1/2 -right-2 border-y-[8px] border-y-transparent border-r-0",
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RequesterDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [projectProgress, setProjectProgress] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [pendingCancelProjectId, setPendingCancelProjectId] = useState<
    string | null
  >(null);
  const [pendingCompleteProject, setPendingCompleteProject] =
    useState<Project | null>(null);
  const [pendingCompleteCollectors, setPendingCompleteCollectors] = useState<
    CollectorFeedbackTarget[]
  >([]);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    if (guideOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [guideOpen]);

  const GUIDE_STEPS = [
    {
      target: "sidebar",
      title: "Navigate with Ease",
      content:
        "This sidebar provides you with instant access to all the essential parts of your dashboard. Think of it as your personal shortcut menu, allowing you to quickly jump between profile, balance, and quick actions.",
    },
    {
      target: "balance",
      title: "Manage Your Budget",
      content:
        "Here you can see your available balance and total budget used across projects. Use 'View Transactions' to track all your payments and earnings.",
    },
    {
      target: "quick-actions",
      title: "Quick Actions Menu",
      content:
        "These shortcuts help you access help, settings, and support quickly without leaving the dashboard.",
    },
    {
      target: "stats",
      title: "Project Overview",
      content:
        "These stats give you a comprehensive overview of your projects. See active, paused, completed counts, pending reviews, and total budget at a glance.",
    },
    {
      target: "new-project",
      title: "Create New Projects",
      content:
        "Click here whenever you want to start a new data collection project. Define tasks, set budgets, and invite collectors.",
    },
    {
      target: "projects",
      title: "Track Your Projects",
      content:
        "This section lists all your projects with deadline, progress, and status. Click any project to open its workshop and manage submissions.",
    },
    {
      target: "budget",
      title: "Budget Allocation",
      content:
        "The budget overview shows how your budget is distributed across projects. Visualize spending and adjust your project budgets accordingly.",
    },
    {
      target: "deadlines",
      title: "Never Miss a Deadline",
      content:
        "Upcoming deadlines keep you on top of due dates. View your closest deadline and all upcoming projects to plan ahead.",
    },
  ];

  const totalGuideSteps = GUIDE_STEPS.length;

  const userId = user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [projectsRes, notificationsRes] = await Promise.all([
        getProjectsByRequester(userId),
        getNotifications(10),
      ]);
      const allProjects = projectsRes.data || [];
      setProjects(allProjects);
      setNotifications(notificationsRes.data || []);

      const activeProjs = allProjects.filter((p) => p.status === "open");
      if (activeProjs.length > 0) {
        const statsResults = await Promise.all(
          activeProjs.map((p) => getSubmissionsByProject(p.id)),
        );
        let totalPending = 0;
        const progressMap: Record<string, number> = {};

        statsResults.forEach((res, idx) => {
          const subs = res.data || [];
          const pending = subs.filter((s) => s.status === "pending").length;
          const validated = subs.filter((s) => s.status === "validated").length;
          totalPending += pending;

          const total = subs.length;
          progressMap[activeProjs[idx].id] =
            total > 0 ? Math.round((validated / total) * 100) : 0;
        });

        setPendingReviewCount(totalPending);
        setProjectProgress(progressMap);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [userId, fetchData]);

  const handleResumeProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await updateProjectStatus(
        projectId,
        user.id,
        "open" as ProjectStatus,
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as Project) : p)),
        );
      }
    } catch (err) {
      console.error("Error resuming project:", err);
    }
  };

  const handlePauseProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await updateProjectStatus(
        projectId,
        user.id,
        "paused" as ProjectStatus,
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as Project) : p)),
        );
      }
    } catch (err) {
      console.error("Error pausing project:", err);
    }
  };

  const handleCompleteProject = async (project: Project) => {
    if (!user) return;
    try {
      const { data: assignments, error: assignmentsError } =
        await getAssignmentsByProject(project.id);
      if (assignmentsError) throw assignmentsError;

      const collectors = Array.from(
        new Map(
          (assignments || [])
            .filter((assignment) => assignment.status === "active")
            .map((assignment) => [
              assignment.collector_id,
              {
                collectorId: assignment.collector_id,
                collectorName:
                  assignment.collector?.full_name?.trim() ||
                  assignment.collector?.email ||
                  "Collector",
              },
            ]),
        ).values(),
      );

      setPendingCompleteCollectors(collectors);
    } catch (err) {
      console.error("Error loading accepted collectors:", err);
      setPendingCompleteCollectors([]);
    }
    setPendingCompleteProject(project);
  };

  const confirmCompleteProject = async (
    feedbacks: CollectorCompletionFeedback[],
  ) => {
    if (!user) return;
    if (!pendingCompleteProject) return;

    try {
      const payload: RequesterCollectorFeedbackInput[] = feedbacks.map(
        (item) => ({
          collectorId: item.collectorId,
          rating: item.rating,
          feedback: item.feedback,
        }),
      );
      const { data, error } = await completeProjectWithCollectorFeedbacks(
        pendingCompleteProject.id,
        user.id,
        payload,
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === pendingCompleteProject.id ? (data as Project) : p,
          ),
        );
      }
      setPendingCompleteProject(null);
      setPendingCompleteCollectors([]);
    } catch (err) {
      console.error("Error completing project:", err);
      throw err;
    }
  };

  const handleCancelProject = (projectId: string) => {
    setPendingCancelProjectId(projectId);
  };

  const confirmCancelProject = async () => {
    if (!user) return;
    if (!pendingCancelProjectId) return;

    try {
      const { data, error } = await updateProjectStatus(
        pendingCancelProjectId,
        user.id,
        "cancelled" as ProjectStatus,
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === pendingCancelProjectId ? (data as Project) : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error cancelling project:", err);
    }
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return "No deadline";
    const days = getDaysUntilDeadline(deadline);
    if (days === null) return "—";
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days < 7) return `${days}d left`;
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem > 0 ? `${weeks}w ${rem}d` : `${weeks}w`;
  };

  const activeProjects = projects.filter((p) => p.status === "open");
  const pausedProjects = projects.filter(
    (p) => (p.status as string) === "paused",
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const cancelledProjects = projects.filter((p) => p.status === "cancelled");
  const upcomingDeadlines = projects
    .filter((p) => p.deadline && p.status === "open")
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
    )
    .slice(0, 5);

  const getProjectProgress = (project: Project) => {
    return projectProgress[project.id] ?? 0;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Photography":
        return <Camera className="w-5 h-5 text-emerald-500" />;
      case "Video":
        return <Video className="w-5 h-5 text-sky-500" />;
      case "Audio":
        return <Mic className="w-5 h-5 text-purple-500" />;
      case "Text":
        return <FileText className="w-5 h-5 text-amber-500" />;
      case "Survey":
        return <ClipboardList className="w-5 h-5 text-green-500" />;
      case "Location Data":
        return <MapPin className="w-5 h-5 text-teal-500" />;
      case "Sensor Data":
        return <Activity className="w-5 h-5 text-orange-500" />;
      default:
        return <FolderKanban className="w-5 h-5 text-cyan-500" />;
    }
  };

  const getCategoryProgressColor = (category: string) => {
    switch (category) {
      case "Photography":
        return "stroke-emerald-500";
      case "Video":
        return "stroke-sky-500";
      case "Audio":
        return "stroke-purple-500";
      case "Text":
        return "stroke-amber-500";
      case "Survey":
        return "stroke-green-500";
      case "Location Data":
        return "stroke-teal-500";
      case "Sensor Data":
        return "stroke-orange-500";
      default:
        return "stroke-cyan-500";
    }
  };

  const getCategoryBannerIcons = (category: string): LucideIcon[] => {
    switch (category) {
      case "Photography":
        return [
          Camera,
          Image,
          ImagePlus,
          Palette,
          Paintbrush,
          LayoutGrid,
          PenTool,
          Eye,
        ];
      case "Video":
        return [Video, Film, Camera, Image, LayoutGrid, Play, Eye];
      case "Audio":
        return [Mic, Music, Activity, Zap];
      case "Text":
        return [FileText, Type, PenTool, ClipboardList, Eye];
      case "Survey":
        return [ClipboardList, ListChecks, FileText, PenTool, CheckCircle2];
      case "Location Data":
        return [MapPin, Activity, LayoutGrid, Eye];
      case "Sensor Data":
        return [Activity, Gauge, Radio, Zap];
      default:
        return [
          FolderKanban,
          LayoutGrid,
          FileText,
          PenTool,
          Camera,
          ClipboardList,
        ];
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case "Photography":
        return "bg-emerald-500/10";
      case "Video":
        return "bg-sky-500/10";
      case "Audio":
        return "bg-purple-500/10";
      case "Text":
        return "bg-amber-500/10";
      case "Survey":
        return "bg-green-500/10";
      case "Location Data":
        return "bg-teal-500/10";
      case "Sensor Data":
        return "bg-orange-500/10";
      default:
        return "bg-cyan-500/10";
    }
  };

  const totalBudgetSpent = projects
    .filter((p) => p.status === "open" || p.status === "completed")
    .reduce((sum, p) => sum + p.budget, 0);

  const currentStepConfig = GUIDE_STEPS[guideStep];
  const targetSelector = currentStepConfig?.target
    ? `[data-guide="${currentStepConfig.target}"]`
    : null;

  const guideOverlay =
    guideOpen && typeof document !== "undefined" && currentStepConfig
      ? createPortal(
          <RequesterGuideOverlay
            targetSelector={targetSelector}
            title={currentStepConfig.title}
            content={currentStepConfig.content}
            step={guideStep + 1}
            totalSteps={totalGuideSteps}
            onClose={() => setGuideOpen(false)}
            onNext={() => {
              if (guideStep >= totalGuideSteps - 1) {
                setGuideOpen(false);
              } else {
                setGuideStep((s) => s + 1);
              }
            }}
            onBack={() =>
              setGuideStep((s) => (s <= 0 ? totalGuideSteps - 1 : s - 1))
            }
          />,
          document.body,
        )
      : null;

  return (
    <div className="p-2">
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={fetchData}
      />
      {guideOverlay}
      <div className="flex flex-col lg:flex-row gap-6 pt-2">
        {/* Left panel – User info (like collector) */}
        <aside
          data-guide="sidebar"
          className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4"
        >
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-6">
              <div className="flex flex-col items-start gap-3">
                <div className="flex gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile?.avatar_url || "/default-avatar.svg"} />
                      <AvatarFallback className="p-0 overflow-hidden text-2xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                        <img
                          src="/default-avatar.svg"
                          alt={initials}
                          className="w-full h-full object-cover"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-400 border-[4px] border-white dark:border-gray-800" />
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center">
                    <h2 className="font-semibold text-base text-foreground leading-tight">
                      {displayName}
                    </h2>
                    <Badge className="text-[10px] capitalize bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-0">
                      Requester
                    </Badge>

                    {profile?.location?.address ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate text-sm w-24 md:w-32">
                          {[profile.location.city, profile.location.country]
                            .filter(Boolean)
                            .join(", ") || profile.location.address}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate text-sm w-32">
                          No location set
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile completion */}
                {(() => {
                  const fields = [
                    { label: "Phone number", done: !!profile?.phone },
                    { label: "Bio", done: !!profile?.bio },
                    { label: "Location", done: !!profile?.location?.address },
                  ];
                  const baseScore = profile?.full_name ? 40 : 0;
                  const extraScore = fields.filter((f) => f.done).length * 20;
                  const pct = baseScore + extraScore;
                  const missing = fields.filter((f) => !f.done);
                  if (pct === 100) return null;
                  return (
                    <div className="w-full pt-3 mt-1 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-foreground">
                          Profile completion
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            pct === 100
                              ? "text-emerald-500"
                              : pct >= 60
                                ? "text-cyan-500"
                                : "text-amber-500"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-1.5 bg-gray-100 dark:bg-gray-700"
                      />
                      {missing.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/settings")}
                            className="mt-1.5 w-full text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline text-left"
                          >
                            Complete your profile →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {profile?.subscription_tier !== "pro" && (
                  <div className="mt-1 w-full flex flex-col gap-2">
                    <Link
                      href="/dashboard/billing"
                      className="btn-gelatine w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Upgrade to Pro
                    </Link>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Get more projects, higher limits, and priority support.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance card */}
          <Card
            data-guide="balance"
            className="dark:bg-gray-800/50 border-none shadow-sm"
          >
            <CardContent className="px-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Available Balance
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground mb-0.5">
                ${(profile?.balance ?? 0).toFixed(2)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mb-3">
                <TrendingUp className="w-3 h-3" />
                <span>
                  ${totalBudgetSpent.toLocaleString()} total budget used
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm h-10 rounded-xl dark:bg-[#18212F] hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                onClick={() => router.push("/dashboard/wallet")}
              >
                View Transactions
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card
            data-guide="quick-actions"
            className="dark:bg-gray-800/50 border-none shadow-sm"
          >
            <CardContent className="px-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    icon: LifeBuoy,
                    label: "Help Center",
                    href: "/dashboard/faq",
                  },
                  {
                    icon: BookOpen,
                    label: "Requester Guide",
                    isGuide: true,
                  },
                  {
                    icon: MessageSquare,
                    label: "Contact Support",
                    href: "/dashboard/support",
                  },
                  {
                    icon: Settings,
                    label: "Account Settings",
                    href: "/dashboard/settings",
                  },
                ].map(({ icon: Icon, label, href, isGuide }) =>
                  isGuide ? (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        requestAnimationFrame(() => {
                          setGuideStep(0);
                          setGuideOpen(true);
                        });
                      }}
                      className="flex w-full items-center gap-3 px-2 py-2 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group text-left"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 font-medium">{label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ) : (
                    <Link
                      key={label}
                      href={href!}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 font-medium">{label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right – main content */}
        <section className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-xs text-muted-foreground">
                Here&apos;s what&apos;s happening with your projects
              </p>
            </div>
            <Button
              data-guide="new-project"
              onClick={() => setCreateProjectOpen(true)}
              size="sm"
              className="btn-gelatine gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600 text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>

          {/* Stats Row */}
          {(() => {
            const stats = [
              {
                label: "Active",
                value: activeProjects.length,
                subtitle: "Active projects",
                icon: FolderKanban,
                iconColor: "text-cyan-500",
                iconBg: "bg-cyan-500/10",
              },
              {
                label: "Paused",
                value: pausedProjects.length,
                subtitle: "Paused projects",
                icon: Pause,
                iconColor: "text-yellow-500",
                iconBg: "bg-yellow-500/10",
              },
              {
                label: "Completed",
                value: completedProjects.length,
                subtitle: "Completed projects",
                icon: CheckCircle2,
                iconColor: "text-green-500",
                iconBg: "bg-green-500/10",
              },
              {
                label: "Pending Review",
                value: pendingReviewCount,
                subtitle: "Awaiting review",
                icon: Eye,
                iconColor: "text-yellow-500",
                iconBg: "bg-yellow-500/10",
              },
              {
                label: "Total Budget",
                value: `$${totalBudgetSpent.toLocaleString()}`,
                subtitle: "Total budget used",
                icon: DollarSign,
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-500/10",
              },
            ] as const;

            if (loading) {
              return (
                <div
                  data-guide="stats"
                  className="grid grid-cols-2 lg:grid-cols-5 gap-6"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card
                      key={i}
                      className="bg-white dark:bg-gray-800/50 border-none shadow-md"
                    >
                      <CardContent className="px-4">
                        <div className="flex items-end justify-between">
                          <div className="space-y-2 flex-1 min-w-0">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-3 w-20 mt-2" />
                          </div>
                          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }

            return (
              <div
                data-guide="stats"
                className="grid grid-cols-2 lg:grid-cols-5 gap-6"
              >
                {stats.map(
                  ({
                    label,
                    value,
                    subtitle,
                    icon: Icon,
                    iconColor,
                    iconBg,
                  }) => (
                    <Card
                      key={label}
                      className="bg-white dark:bg-gray-800/50 border-none shadow-md"
                    >
                      <CardContent className="px-4">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {label}
                            </p>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {subtitle}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                              iconBg,
                            )}
                          >
                            <Icon className={cn("w-6 h-6", iconColor)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            );
          })()}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-stretch">
            {/* Left Column - Projects */}
            <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
              {/* Projects with Tabs */}
              {(() => {
                const COL =
                  "minmax(0,0.7fr) 130px minmax(0,1fr) 80px 112px 44px";

                return (
                  <Card
                    data-guide="projects"
                    className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden pt-2 flex flex-col"
                  >
                    {/* Header */}
                    <CardHeader className="pt-4 pl-5 pr-0">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base font-medium flex items-center gap-1.5 flex-shrink-0">
                          Projects
                        </CardTitle>
                        {projects.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-transparent flex-shrink-0 px-0"
                            onClick={() =>
                              router.push("/dashboard/projects/active")
                            }
                          >
                            Manage All <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    {loading ? (
                      <>
                        <div className="flex flex-col gap-0">
                          <div
                            className="grid items-center px-5 py-5 bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/40 flex-shrink-0"
                            style={{ gridTemplateColumns: COL }}
                          >
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Project Name
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Deadline
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Progress
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Balance
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Status
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                              Action
                            </span>
                          </div>
                          <div className="max-h-[256px] overflow-y-auto overflow-x-hidden dashboard-scrollbar">
                            <div className="flex flex-col pb-4">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="grid items-center px-5 py-3 border-b border-gray-100 dark:border-gray-700/30"
                                  style={{ gridTemplateColumns: COL }}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                    <div className="min-w-0 space-y-1.5">
                                      <Skeleton className="h-4 w-32" />
                                      <Skeleton className="h-3 w-20" />
                                    </div>
                                  </div>
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                  <div className="flex items-center gap-3 pr-4">
                                    <Skeleton className="h-4 w-9" />
                                    <Skeleton className="h-2.5 flex-1 rounded-full" />
                                    <Skeleton className="h-3 w-10" />
                                  </div>
                                  <Skeleton className="h-4 w-12" />
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                  <div className="flex justify-end">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : projects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-3">
                          <FolderKanban className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          No projects yet
                        </p>
                        <Button
                          size="sm"
                          className="btn-gelatine h-7 text-[10px] bg-primary hover:bg-primary/90 text-white mt-2"
                          onClick={() => setCreateProjectOpen(true)}
                        >
                          Create Project
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Table header row — sticky outside the scroll area */}
                        <div className="flex flex-col gap-0">
                          <div
                            className="grid items-center px-5 py-5 bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/40 flex-shrink-0"
                            style={{ gridTemplateColumns: COL }}
                          >
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Project Name
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Deadline
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Progress
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Balance
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Status
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                              Action
                            </span>
                          </div>

                          <div className="max-h-[256px] overflow-y-auto overflow-x-hidden dashboard-scrollbar">
                            <div className="flex flex-col">
                              {projects.map((project) => {
                                const progress = getProjectProgress(project);
                                const daysLeft = getDaysUntilDeadline(
                                  project.deadline,
                                );
                                const isActive = project.status === "open";
                                const isPaused =
                                  (project.status as string) === "paused";
                                const isDone = project.status === "completed";
                                const isCancelled =
                                  project.status === "cancelled";
                                const displayProgress = isDone ? 100 : progress;

                                const barColor = isActive
                                  ? "bg-violet-500"
                                  : isPaused
                                    ? "bg-amber-400"
                                    : isDone
                                      ? "bg-emerald-500"
                                      : "bg-gray-300 dark:bg-gray-600";

                                const pctColor = isActive
                                  ? "text-violet-600 dark:text-violet-400"
                                  : isPaused
                                    ? "text-amber-600 dark:text-amber-400"
                                    : isDone
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-gray-400";

                                return (
                                  <div
                                    key={project.id}
                                    className={cn(
                                      "grid items-center px-5 py-3 border-b border-gray-100 dark:border-gray-700/30 cursor-pointer transition-colors group hover:bg-gray-50/80 dark:hover:bg-gray-700/20",
                                    )}
                                    style={{ gridTemplateColumns: COL }}
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/projects/${project.id}/workshop`,
                                      )
                                    }
                                  >
                                    {/* 1 — Project Name */}
                                    <div className="flex items-center gap-3 min-w-0 pr-4">
                                      <div
                                        className={cn(
                                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white",
                                          getCategoryBg(project.category),
                                        )}
                                      >
                                        {getCategoryIcon(project.category)}
                                      </div>
                                      <div className="min-w-0">
                                        <p
                                          className={cn(
                                            "text-sm font-semibold leading-snug truncate",
                                          )}
                                        >
                                          {project.title}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                          {project.category}
                                        </p>
                                      </div>
                                    </div>

                                    {/* 2 — Deadline */}
                                    <div>
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
                                          isCancelled
                                            ? "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-700/50 dark:text-gray-500 dark:border-gray-700"
                                            : daysLeft !== null && daysLeft <= 3
                                              ? "bg-red-50 text-red-600 border-red-200/60 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/40"
                                              : daysLeft !== null &&
                                                  daysLeft <= 7
                                                ? "bg-orange-50 text-orange-600 border-orange-200/60 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/40"
                                                : project.deadline === null
                                                  ? "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-700"
                                                  : "bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/40",
                                        )}
                                      >
                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                        {formatDeadline(project.deadline)}
                                      </span>
                                    </div>

                                    {/* 3 — Progress */}
                                    <div className="flex items-center gap-3 pr-4">
                                      <span
                                        className={cn(
                                          "text-sm font-medium w-9 flex-shrink-0 tabular-nums",
                                        )}
                                      >
                                        {isCancelled
                                          ? "—"
                                          : `${displayProgress}%`}
                                      </span>
                                      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-0">
                                        {!isCancelled && (
                                          <div
                                            className={cn(
                                              "h-full rounded-full transition-all duration-500",
                                              barColor,
                                            )}
                                            style={{
                                              width: `${displayProgress}%`,
                                            }}
                                          />
                                        )}
                                      </div>
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                                        <Users className="w-3 h-3" />
                                        {isDone
                                          ? `${project.max_collectors}/${project.max_collectors}`
                                          : `0/${project.max_collectors}`}
                                      </span>
                                    </div>

                                    {/* 4 — Balance */}
                                    <div
                                      className={cn(
                                        "text-xs font-medium tabular-nums",
                                      )}
                                    >
                                      $
                                      {project.budget >= 1000
                                        ? `${(project.budget / 1000).toFixed(1)}k`
                                        : project.budget}
                                    </div>

                                    {/* 5 — Status */}
                                    <div>
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                                          isActive
                                            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                            : isPaused
                                              ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                              : isDone
                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "bg-red-500/10 text-red-600 dark:text-red-400",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                            isActive
                                              ? "bg-cyan-500"
                                              : isPaused
                                                ? "bg-yellow-500"
                                                : isDone
                                                  ? "bg-emerald-500"
                                                  : "bg-red-500",
                                          )}
                                        />
                                        {isActive
                                          ? "Active"
                                          : isPaused
                                            ? "Paused"
                                            : isDone
                                              ? "Done"
                                              : "Cancelled"}
                                      </span>
                                    </div>

                                    {/* 6 — Actions */}
                                    <div
                                      className="flex items-center justify-end"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {isDone || isCancelled ? (
                                        <span className="text-[10px] text-muted-foreground pr-3" />
                                      ) : (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="btn-gelatine p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-muted-foreground hover:text-foreground">
                                              <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="w-44"
                                          >
                                            {isActive && (
                                              <DropdownMenuItem
                                                className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                onClick={() =>
                                                  handlePauseProject(project.id)
                                                }
                                              >
                                                <Pause className="w-3.5 h-3.5" />
                                                Pause Project
                                              </DropdownMenuItem>
                                            )}
                                            {isPaused && (
                                              <DropdownMenuItem
                                                className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                onClick={() =>
                                                  handleResumeProject(
                                                    project.id,
                                                  )
                                                }
                                              >
                                                <Play className="w-3.5 h-3.5" />
                                                Resume Project
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                              onClick={() =>
                                                handleCompleteProject(project)
                                              }
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              Mark as Done
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                              onClick={() =>
                                                handleCancelProject(project.id)
                                              }
                                            >
                                              <XCircle className="w-3.5 h-3.5" />
                                              Cancel Project
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })()}

              {/* Budget Overview — modern horizontal bar chart + legend */}
              <Card
                data-guide="budget"
                className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden pt-2 flex-1 min-h-0 flex flex-col"
              >
                <CardHeader className="pt-4 pl-5 pr-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-medium text-foreground">
                      Budget Overview
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-5 px-5 flex flex-col flex-1 min-h-0">
                  {loading ? (
                    <div className="grid grid-cols-5 gap-6">
                      <div className="col-span-3 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-8 w-full rounded"
                            style={{ width: `${100 - i * 15}%` }}
                          />
                        ))}
                      </div>
                      <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="w-2.5 h-2.5 rounded-full" />
                              <Skeleton className="h-4 flex-1 max-w-24" />
                            </div>
                            <Skeleton className="h-5 w-16 pl-4" />
                            <Skeleton className="h-3 w-10 pl-4" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : totalBudgetSpent === 0 ? (
                    <div className="flex flex-1 min-h-0 flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-3">
                        <DollarSign className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No budget data yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a project to see budget allocation
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const CHART_COLORS = [
                        "#8b5cf6",
                        "#06b6d4",
                        "#84cc16",
                        "#6b7280",
                        "#f97316",
                        "#fbbf24",
                      ];
                      const budgetColors = [
                        "bg-violet-500",
                        "bg-cyan-500",
                        "bg-lime-500",
                        "bg-gray-500",
                        "bg-orange-500",
                        "bg-amber-400",
                      ] as const;
                      const projectsWithBudget = projects
                        .filter(
                          (p) =>
                            p.status === "open" || p.status === "completed",
                        )
                        .sort((a, b) => b.budget - a.budget)
                        .slice(0, 6);
                      const chartData = projectsWithBudget.map((project, i) => {
                        const pct =
                          totalBudgetSpent > 0
                            ? Math.round(
                                (project.budget / totalBudgetSpent) * 100,
                              )
                            : 0;
                        return {
                          id: project.id,
                          name: project.title,
                          label: project.title,
                          amount: project.budget,
                          pct: Math.max(pct, 1),
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                          colorClass: budgetColors[i % budgetColors.length],
                          count: projectsWithBudget.length - i,
                        };
                      });

                      const MAX_BARS = 6;
                      const BAR_INTERVAL_PX = 60;
                      const BOTTOM_AXIS_HEIGHT = 28;
                      const barCount = Math.min(chartData.length, MAX_BARS);
                      const chartHeight =
                        barCount * BAR_INTERVAL_PX + BOTTOM_AXIS_HEIGHT;

                      return (
                        <div className="grid grid-cols-5 gap-6">
                          <div className="col-span-3">
                            <ResponsiveContainer
                              width="100%"
                              height={chartHeight}
                              initialDimension={{
                                width: 600,
                                height: Math.max(chartHeight, 1),
                              }}
                            >
                              <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{
                                  top: 0,
                                  right: 8,
                                  left: 0,
                                  bottom: 20,
                                }}
                              >
                                <CartesianGrid
                                  horizontal={false}
                                  vertical={true}
                                  strokeDasharray="3 3"
                                  stroke="hsl(var(--muted-foreground) / 0.3)"
                                />
                                <XAxis
                                  type="number"
                                  domain={[0, 100]}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{
                                    fontSize: 10,
                                    fill: "hsl(var(--muted-foreground))",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="count"
                                  width={24}
                                  tick={{
                                    fontSize: 12,
                                    fill: "hsl(var(--muted-foreground))",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickMargin={0}
                                />
                                <Bar
                                  dataKey="pct"
                                  barSize={Math.min(32, BAR_INTERVAL_PX - 8)}
                                  radius={[0, 8, 8, 0]}
                                >
                                  {chartData.map((_, index) => (
                                    <Cell
                                      key={chartData[index].id}
                                      fill={chartData[index].fill}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Legend — color dot, project name, amount & % */}
                          <div className="shrink-0 col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            {chartData.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-0.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "w-2.5 h-2.5 rounded-full shrink-0",
                                      item.colorClass,
                                    )}
                                  />
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {item.label}
                                  </span>
                                </div>
                                <p className="text-lg font-medium text-foreground pl-4 tabular-nums">
                                  ${item.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground pl-4">
                                  {item.pct}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Notifications & Deadlines */}
            <div className="flex flex-col gap-6 min-h-0">
              {/* Upcoming Deadlines */}
              <Card
                data-guide="deadlines"
                className="dark:bg-gray-800/50 border-none shadow-md pt-2 flex flex-col"
              >
                <CardContent className="pt-3 px-5 flex flex-col">
                  {loading ? (
                    <div className="overflow-hidden">
                      <Skeleton className="min-h-[5.5rem] rounded-xl w-full" />
                      <div className="pt-3 pb-4 space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </div>
                        <Skeleton className="h-9 w-full mt-4 rounded-md" />
                      </div>
                    </div>
                  ) : upcomingDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center mb-3">
                        <Timer className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No upcoming deadlines yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a project to see upcoming deadlines
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Closest Deadline — highlight card */}
                      {(() => {
                        const closest = upcomingDeadlines[0];
                        const daysLeft = getDaysUntilDeadline(closest.deadline);
                        const deadlineLabel =
                          daysLeft === null
                            ? "—"
                            : daysLeft === 0
                              ? "Today"
                              : daysLeft === 1
                                ? "1 day left"
                                : `${daysLeft} days left`;
                        const deadlineDateStr = closest.deadline
                          ? new Date(closest.deadline).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              },
                            )
                          : "—";
                        const bannerIcons = getCategoryBannerIcons(
                          closest.category,
                        );
                        const iconPositions: [string, string][] = [
                          ["5%", "10%"],
                          ["18%", "5%"],
                          ["32%", "18%"],
                          ["48%", "8%"],
                          ["62%", "22%"],
                          ["78%", "12%"],
                          ["92%", "28%"],
                          ["8%", "42%"],
                          ["22%", "48%"],
                          ["52%", "45%"],
                          ["68%", "52%"],
                          ["82%", "58%"],
                          ["12%", "72%"],
                          ["28%", "78%"],
                          ["45%", "72%"],
                          ["58%", "78%"],
                          ["75%", "72%"],
                          ["88%", "65%"],
                        ];
                        const iconSizes = [
                          12, 18, 14, 22, 16, 20, 13, 24, 15, 19, 17, 21, 14,
                          16, 20, 12, 18, 22, 15,
                        ];
                        const iconRotations = [
                          -15, 10, -22, 8, -8, 18, -12, 5, 14, -6, 20, -10, 7,
                          -18, 11, -9, 16, -14, 9,
                        ];
                        const totalIcons = iconPositions.length;

                        return (
                          <div className="overflow-hidden">
                            <div
                              className={cn(
                                "relative min-h-[5.5rem] px-4 py-4 flex items-center justify-end rounded-xl overflow-hidden bg-primary/10",
                              )}
                            >
                              {Array.from({ length: totalIcons }).map(
                                (_, i) => {
                                  const Icon =
                                    bannerIcons[i % bannerIcons.length];
                                  return (
                                    <span
                                      key={i}
                                      className="absolute text-primary opacity-50"
                                      style={{
                                        left: iconPositions[i][0],
                                        top: iconPositions[i][1],
                                        transform: `rotate(${iconRotations[i]}deg)`,
                                      }}
                                    >
                                      <Icon
                                        className="flex-shrink-0"
                                        size={iconSizes[i]}
                                      />
                                    </span>
                                  );
                                },
                              )}
                              <div className="relative z-[1] w-14 h-14 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 backdrop-blur-sm flex items-center justify-center shadow-sm [&_svg]:w-7 [&_svg]:h-7 [&_svg]:text-primary">
                                {getCategoryIcon(closest.category)}
                              </div>
                            </div>
                            <div className="pt-3 pb-4">
                              <h3 className="text-base font-semibold text-foreground">
                                Upcoming Deadline
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {closest.title}
                              </p>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {deadlineDateStr}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Deadline date
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Timer className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {deadlineLabel}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Time left
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/projects/${closest.id}/workshop`,
                                  )
                                }
                              >
                                View Project
                              </Button>
                            </div>
                          </div>
                        );
                      })()}

                      {upcomingDeadlines.length > 1 && (
                        <>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            All upcoming
                          </p>
                          <div className="space-y-3">
                            {upcomingDeadlines.slice(1, 4).map((project) => {
                              const created = project.created_at
                                ? new Date(project.created_at).getTime()
                                : Date.now();
                              const deadline = new Date(
                                project.deadline!,
                              ).getTime();
                              const now = Date.now();
                              const totalDays = Math.max(
                                1,
                                Math.ceil(
                                  (deadline - created) / (1000 * 60 * 60 * 24),
                                ),
                              );
                              const daysLeft = getDaysUntilDeadline(
                                project.deadline,
                              );
                              const elapsedDays = Math.max(
                                0,
                                Math.ceil(
                                  (now - created) / (1000 * 60 * 60 * 24),
                                ),
                              );
                              const progressPercent = Math.min(
                                100,
                                Math.round((elapsedDays / totalDays) * 100),
                              );
                              const progressColor = getCategoryProgressColor(
                                project.category,
                              );
                              const circumference = 2 * Math.PI * 22;
                              const strokeDashoffset =
                                circumference -
                                (progressPercent / 100) * circumference;

                              return (
                                <div
                                  key={project.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/projects/${project.id}/workshop`,
                                    )
                                  }
                                  onKeyDown={(e) =>
                                    (e.key === "Enter" || e.key === " ") &&
                                    router.push(
                                      `/dashboard/projects/${project.id}/workshop`,
                                    )
                                  }
                                  className="flex items-center gap-3 rounded-lg transition-colors group cursor-pointer py-2"
                                >
                                  <div className="relative flex-shrink-0">
                                    <svg
                                      className="w-12 h-12 -rotate-90"
                                      viewBox="0 0 48 48"
                                      aria-hidden
                                    >
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="22"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-muted/30 dark:text-muted-foreground/20"
                                      />
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="22"
                                        fill="none"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className={cn(
                                          "transition-all duration-500",
                                          progressColor,
                                        )}
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                                      {progressPercent}%
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {project.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {daysLeft === null
                                        ? "—"
                                        : daysLeft === 0
                                          ? "Due today"
                                          : daysLeft === 1
                                            ? "1 day left"
                                            : `${daysLeft} days left`}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="btn-gelatine h-8 w-8 flex-shrink-0 rounded-md opacity-70 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/dashboard/projects/${project.id}/workshop`,
                                      );
                                    }}
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="border-none shadow-md dark:bg-gray-800/50 pt-2 flex-shrink-0">
                <CardHeader className="pt-4 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      Activity Timeline
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-0 pl-5 pr-0">
                  <ScrollArea className="h-[256px] pr-5">
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
                    ) : notifications.length === 0 ? (
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
                        {notifications.map((notif, idx) => {
                          const dotInner =
                            notif.type === "payment_completed"
                              ? "bg-emerald-500"
                              : notif.type === "submission_validated" ||
                                  notif.type === "proposal_accepted"
                                ? "bg-green-500"
                                : notif.type === "submission_rejected" ||
                                    notif.type === "proposal_rejected"
                                  ? "bg-red-500"
                                  : notif.type === "project_created" ||
                                      notif.type === "project_updated"
                                    ? "bg-purple-500"
                                    : notif.type === "proposal_submitted" ||
                                        notif.type === "proposal_received" ||
                                        notif.type === "assignment_created"
                                      ? "bg-blue-500"
                                      : "bg-cyan-500";
                          const dotOuter =
                            notif.type === "payment_completed"
                              ? "bg-emerald-500/10"
                              : notif.type === "submission_validated" ||
                                  notif.type === "proposal_accepted"
                                ? "bg-green-500/10"
                                : notif.type === "submission_rejected" ||
                                    notif.type === "proposal_rejected"
                                  ? "bg-red-500/10"
                                  : notif.type === "project_created" ||
                                      notif.type === "project_updated"
                                    ? "bg-purple-500/10"
                                    : notif.type === "proposal_submitted" ||
                                        notif.type === "proposal_received" ||
                                        notif.type === "assignment_created"
                                      ? "bg-blue-500/10"
                                      : "bg-cyan-500/10";
                          const isLast = idx === notifications.length - 1;
                          return (
                            <div
                              key={notif.id}
                              className="flex gap-4 cursor-pointer"
                            >
                              {/* Left: dot + connecting line */}
                              <div className="flex flex-col items-center">
                                {/* outer glow ring + inner solid dot */}
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
                              {/* Right: content */}
                              <div
                                className={cn(
                                  "flex-1 min-w-0",
                                  !isLast ? "pb-5" : "pb-1",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium leading-snug text-foreground">
                                    {notif.title || notif.body}
                                  </p>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-px">
                                    {formatTimeAgo(notif.created_at)}
                                  </span>
                                </div>
                                {notif.title && notif.body && (
                                  <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                                    {notif.body}
                                  </p>
                                )}
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
          </div>
        </section>
      </div>
      <ConfirmationDialog
        open={!!pendingCancelProjectId}
        onOpenChange={(open) => {
          if (!open) setPendingCancelProjectId(null);
        }}
        title="Cancel project?"
        description="Collectors will no longer be able to submit proposals to this project."
        confirmText="Cancel Project"
        cancelText="Keep Project"
        confirmTone="danger"
        onConfirm={confirmCancelProject}
      />
      <CompleteProjectDialog
        open={!!pendingCompleteProject}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCompleteProject(null);
            setPendingCompleteCollectors([]);
          }
        }}
        projectTitle={pendingCompleteProject?.title || ""}
        collectors={pendingCompleteCollectors}
        onSubmit={confirmCompleteProject}
      />
    </div>
  );
}
