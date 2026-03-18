"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  completeProjectWithCollectorFeedbacks,
  getProjectsByRequester,
  updateProjectStatus,
  type RequesterCollectorFeedbackInput,
} from "@/lib/services/projectService";
import { getSubmissionsByProject } from "@/lib/services/submissionService";
import {
  getAssignmentsByProject,
  getProposalsByProject,
} from "@/lib/services/proposalService";
import type { Project, ProjectStatus } from "@/types/project";
import EditProjectDialog from "@/components/dashboard/requester/EditProjectDialog";
import CompleteProjectDialog, {
  type CollectorCompletionFeedback,
  type CollectorFeedbackTarget,
} from "./CompleteProjectDialog";
import CreateProjectDialog from "./CreateProjectDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsUnderlineList,
  TabsUnderlineTrigger,
} from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Plus,
  FolderKanban,
  FileText,
  Camera,
  Video,
  Mic,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  Users,
  MapPin,
} from "lucide-react";
import { Photography1Svg } from "@/components/svg/photography/photography_1";
import { Photography2Svg } from "@/components/svg/photography/photography_2";
import { Photography3Svg } from "@/components/svg/photography/photography_3";
import { Photography4Svg } from "@/components/svg/photography/photography_4";
import { Photography5Svg } from "@/components/svg/photography/photography_5";
import { Video1Svg } from "@/components/svg/video/video_1";
import { Video2Svg } from "@/components/svg/video/video_2";
import { Video3Svg } from "@/components/svg/video/video_3";
import { Video4Svg } from "@/components/svg/video/video_4";
import { Video5Svg } from "@/components/svg/video/video_5";
import { Audio1Svg } from "@/components/svg/audio/audio_1";
import { Audio2Svg } from "@/components/svg/audio/audio_2";
import { Audio3Svg } from "@/components/svg/audio/audio_3";
import { Audio4Svg } from "@/components/svg/audio/audio_4";
import { Audio5Svg } from "@/components/svg/audio/audio_5";
import { Text1Svg } from "@/components/svg/text/text_1";
import { Text2Svg } from "@/components/svg/text/text_2";
import { Text3Svg } from "@/components/svg/text/text_3";
import { Text4Svg } from "@/components/svg/text/text_4";
import { Text5Svg } from "@/components/svg/text/text_5";
import { Survey1Svg } from "@/components/svg/survey/survey_1";
import { Survey2Svg } from "@/components/svg/survey/survey_2";
import { Survey3Svg } from "@/components/svg/survey/survey_3";
import { Survey4Svg } from "@/components/svg/survey/survey_4";
import { Survey5Svg } from "@/components/svg/survey/survey_5";
import { Location1Svg } from "@/components/svg/location-data/location_1";
import { Location2Svg } from "@/components/svg/location-data/location_2";
import { Location3Svg } from "@/components/svg/location-data/location_3";
import { Location4Svg } from "@/components/svg/location-data/location_4";
import { Location5Svg } from "@/components/svg/location-data/location_5";
import { Sensor1Svg } from "@/components/svg/sensor-data/sensor_1";
import { Sensor2Svg } from "@/components/svg/sensor-data/sensor_2";
import { Sensor3Svg } from "@/components/svg/sensor-data/sensor_3";
import { Sensor4Svg } from "@/components/svg/sensor-data/sensor_4";
import { Sensor5Svg } from "@/components/svg/sensor-data/sensor_5";
import { Other1Svg } from "@/components/svg/other/other_1";
import { Other2Svg } from "@/components/svg/other/other_2";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";
import { cn, getCategoryColor } from "@/lib/utils";

const PHOTOGRAPHY_SVGS = [
  Photography1Svg,
  Photography2Svg,
  Photography3Svg,
  Photography4Svg,
  Photography5Svg,
] as const;
const VIDEO_SVGS = [
  Video1Svg,
  Video2Svg,
  Video3Svg,
  Video4Svg,
  Video5Svg,
] as const;
const AUDIO_SVGS = [
  Audio1Svg,
  Audio2Svg,
  Audio3Svg,
  Audio4Svg,
  Audio5Svg,
] as const;
const TEXT_SVGS = [Text1Svg, Text2Svg, Text3Svg, Text4Svg, Text5Svg] as const;
const SURVEY_SVGS = [
  Survey1Svg,
  Survey2Svg,
  Survey3Svg,
  Survey4Svg,
  Survey5Svg,
] as const;
const LOCATION_SVGS = [
  Location1Svg,
  Location2Svg,
  Location3Svg,
  Location4Svg,
  Location5Svg,
] as const;
const SENSOR_SVGS = [
  Sensor1Svg,
  Sensor2Svg,
  Sensor3Svg,
  Sensor4Svg,
  Sensor5Svg,
] as const;
const OTHER_SVGS = [Other1Svg, Other2Svg] as const;

function AnimatedCount({
  value,
  duration = 700,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;

    prevRef.current = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

function getProjectIconIndex(projectId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; accent: string; bg: string }
> = {
  Photography: {
    icon: <Camera className="w-4 h-4" />,
    accent: "#10b981",
    bg: "bg-emerald-500/10",
  },
  Video: {
    icon: <Video className="w-4 h-4" />,
    accent: "#0ea5e9",
    bg: "bg-sky-500/10",
  },
  Audio: {
    icon: <Mic className="w-4 h-4" />,
    accent: "#a855f7",
    bg: "bg-purple-500/10",
  },
  Text: {
    icon: <FileText className="w-4 h-4" />,
    accent: "#f59e0b",
    bg: "bg-amber-500/10",
  },
  Survey: {
    icon: <ClipboardList className="w-4 h-4" />,
    accent: "#22c55e",
    bg: "bg-green-500/10",
  },
  "Location Data": {
    icon: <LocateFixed className="w-4 h-4" />,
    accent: "#14b8a6",
    bg: "bg-teal-500/10",
  },
  "Sensor Data": {
    icon: <Activity className="w-4 h-4" />,
    accent: "#f97316",
    bg: "bg-orange-500/10",
  },
  Other: {
    icon: <Package className="w-4 h-4" />,
    accent: "#06b6d4",
    bg: "bg-cyan-500/10",
  },
};
const DEFAULT_CATEGORY_META = CATEGORY_META["Other"];

export default function ActiveProjectsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pendingCancelProjectId, setPendingCancelProjectId] = useState<
    string | null
  >(null);
  const [pendingCompleteProject, setPendingCompleteProject] =
    useState<Project | null>(null);
  const [pendingCompleteCollectors, setPendingCompleteCollectors] = useState<
    CollectorFeedbackTarget[]
  >([]);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        totalTarget: number;
        totalSubmissions: number;
        validated: number;
        pending: number;
        rejected: number;
        progress: number;
        spent: number;
        pendingPayment: number;
        proposalCount: number;
        pendingProposals: number;
      }
    >
  >({});
  const userId = user?.id;

  const fetchProjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await getProjectsByRequester(userId);

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProjects();
  }, [userId, authLoading]);

  // Fetch real submission stats for all projects
  useEffect(() => {
    if (projects.length === 0) return;

    const fetchAllStats = async () => {
      const statsMap: Record<string, (typeof projectStats)[string]> = {};

      await Promise.all(
        projects.map(async (project) => {
          try {
            const [{ data: submissionsData }, { data: proposalsData }] =
              await Promise.all([
                getSubmissionsByProject(project.id),
                getProposalsByProject(project.id),
              ]);

            const submissions = submissionsData || [];
            const proposals = proposalsData || [];

            const validated = submissions.filter(
              (s) => s.status === "validated",
            ).length;
            const pending = submissions.filter(
              (s) => s.status === "pending",
            ).length;
            const rejected = submissions.filter(
              (s) => s.status === "rejected",
            ).length;
            const totalSubmissions = submissions.length;
            const totalTarget = Math.max(project.max_collectors * 10, 1);
            const progress = Math.min(
              Math.round((validated / totalTarget) * 100),
              100,
            );

            const perUnit = project.budget / totalTarget;
            const spent = validated * perUnit;
            const pendingPayment = pending * perUnit;

            const proposalCount = proposals.length;
            const pendingProposals = proposals.filter(
              (p) => p.status !== "accepted" && p.status !== "rejected",
            ).length;

            statsMap[project.id] = {
              totalTarget,
              totalSubmissions,
              validated,
              pending,
              rejected,
              progress,
              spent: Math.round(spent * 100) / 100,
              pendingPayment: Math.round(pendingPayment * 100) / 100,
              proposalCount,
              pendingProposals,
            };
          } catch {
            statsMap[project.id] = {
              totalTarget: project.max_collectors * 10,
              totalSubmissions: 0,
              validated: 0,
              pending: 0,
              rejected: 0,
              progress: 0,
              spent: 0,
              pendingPayment: 0,
              proposalCount: 0,
              pendingProposals: 0,
            };
          }
        }),
      );

      setProjectStats(statsMap);
    };

    fetchAllStats();
  }, [projects]);

  const handlePauseProject = async (projectId: string) => {
    if (!user) return;

    try {
      setError("");

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
    } catch (err: any) {
      console.error("Error pausing project:", err);
      setError(err.message || "Failed to pause project");
    }
  };

  const handleResumeProject = async (projectId: string) => {
    if (!user) return;

    try {
      setError("");

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
    } catch (err: any) {
      console.error("Error resuming project:", err);
      setError(err.message || "Failed to resume project");
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
      if (collectors.length === 0) {
        setError("No accepted collectors found for this project.");
      }
    } catch (err: any) {
      console.error("Error loading accepted collectors:", err);
      setPendingCompleteCollectors([]);
      setError(err.message || "Failed to load accepted collectors");
    }
    setPendingCompleteProject(project);
  };

  const confirmCompleteProject = async (
    feedbacks: CollectorCompletionFeedback[],
  ) => {
    if (!user) return;
    if (!pendingCompleteProject) return;

    try {
      setError("");

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
    } catch (err: any) {
      console.error("Error completing project:", err);
      setError(err.message || "Failed to complete project");
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
      setError("");

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
    } catch (err: any) {
      console.error("Error cancelling project:", err);
      setError(err.message || "Failed to cancel project");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-0 text-[10px] font-medium px-2 py-0.5">
            <Clock className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-[10px] font-medium px-2 py-0.5">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[10px] font-medium px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-0 text-[10px] font-medium px-2 py-0.5">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getProjectProgress = (project: Project) => {
    return (
      projectStats[project.id] || {
        totalTarget: project.max_collectors * 10,
        totalSubmissions: 0,
        validated: 0,
        pending: 0,
        rejected: 0,
        progress: 0,
        spent: 0,
        pendingPayment: 0,
        proposalCount: 0,
        pendingProposals: 0,
      }
    );
  };

  // Filter projects by status
  const activeProjects = projects.filter((p) => p.status === "open");
  const pausedProjects = projects.filter(
    (p) => (p.status as string) === "paused",
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const cancelledProjects = projects.filter((p) => p.status === "cancelled");

  if (loading) {
    return (
      <div className="space-y-6 py-4 md:py-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="bg-white dark:bg-gray-800/50 border-none shadow-md"
            >
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-2 min-w-0">
                    <Skeleton className="h-2.5 w-12 rounded" />
                    <Skeleton className="h-8 w-10 rounded-md" />
                    <Skeleton className="h-2.5 w-20 rounded mt-1" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabbed list skeleton */}
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 shadow-sm overflow-hidden pt-3">
          {/* Tab bar */}
          <div className="flex gap-1 px-4 md:px-6 border-b border-gray-200 dark:border-gray-800">
            {[88, 72, 96, 80].map((w, i) => (
              <Skeleton
                key={i}
                className="h-10 rounded-none rounded-t-md"
                style={{ width: w }}
              />
            ))}
          </div>
          {/* Project rows */}
          <div className="p-4 md:p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-stretch gap-4 rounded-xl bg-white dark:bg-gray-800 p-4"
              >
                {/* Category icon */}
                <Skeleton className="w-12 h-12 rounded-xl shrink-0 mt-0.5" />

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Title + status badge */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-44 max-w-[60%] rounded" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  {/* Price · Deadline */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  {/* Category chip + meta chips */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>

                {/* Right: progress circle + created */}
                <div className="shrink-0 flex flex-col items-end justify-between gap-2 pl-1">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderProjectCard = (
    project: Project,
    showPauseResume: "pause" | "resume" | "none" = "none",
  ) => {
    const stats = getProjectProgress(project);
    const isPaused = (project.status as string) === "paused";
    const isCompleted = project.status === "completed";
    const isCancelled = project.status === "cancelled";
    const progressPct = isCompleted ? 100 : stats.progress;
    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset =
      circumference - (progressPct / 100) * circumference;

    const catMeta = CATEGORY_META[project.category] || DEFAULT_CATEGORY_META;
    const svgPool =
      project.category === "Photography"
        ? PHOTOGRAPHY_SVGS
        : project.category === "Video"
          ? VIDEO_SVGS
          : project.category === "Audio"
            ? AUDIO_SVGS
            : project.category === "Text"
              ? TEXT_SVGS
              : project.category === "Survey"
                ? SURVEY_SVGS
                : project.category === "Location Data"
                  ? LOCATION_SVGS
                  : project.category === "Sensor Data"
                    ? SENSOR_SVGS
                    : OTHER_SVGS;
    const SvgIcon = svgPool[getProjectIconIndex(project.id, svgPool.length)];

    return (
      <div
        key={project.id}
        className={cn(
          "group relative flex items-stretch gap-4 rounded-xl border border-transparent p-4 transition-all",
          !isCancelled && "cursor-pointer",
          "bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm",
          isPaused &&
            "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
          isCompleted && "bg-muted/40 dark:bg-muted/20",
          isCancelled &&
            "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30 opacity-80",
        )}
        onClick={() => {
          if (!isCancelled) {
            router.push(`/dashboard/projects/${project.id}/workshop`);
          }
        }}
      >
        {/* Category icon — same as FindProjects */}
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5",
            catMeta.bg,
          )}
          style={{ color: catMeta.accent }}
        >
          <span className="w-8 h-8 flex items-center justify-center">
            <SvgIcon color={catMeta.accent} />
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3
              className={cn(
                "text-base font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate",
                isCancelled && "line-through text-muted-foreground",
              )}
            >
              {project.title}
            </h3>
            {stats.pendingProposals > 0 && !isCancelled && !isCompleted && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="tabular-nums">
                  <AnimatedCount value={stats.pendingProposals} />
                </span>
                {stats.pendingProposals === 1 ? "new proposal" : "new proposals"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold text-muted-foreground">
                ${project.budget.toFixed(2)}
              </span>
            </span>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-medium text-muted-foreground">
                {formatDate(project.deadline)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md",
                catMeta.bg,
              )}
              style={{ color: catMeta.accent }}
            >
              {catMeta.icon && (
                <span className="scale-75 origin-center">{catMeta.icon}</span>
              )}
              {project.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {project.max_collectors} collector
              {project.max_collectors !== 1 ? "s" : ""}
            </span>

            {project.location?.address &&
              (() => {
                const parts = project.location.address
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                const city =
                  parts.length >= 2 ? parts[parts.length - 2] : parts[0];
                const country =
                  parts.length >= 2 ? parts[parts.length - 1] : null;
                const label = country ? `${city}, ${country}` : city;
                return (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </span>
                );
              })()}
          </div>
        </div>

        {/* Right: progress + created time */}
        <div className="shrink-0 flex flex-col items-end justify-between gap-2 pl-1">
          {!isCancelled && (
            <div className="relative w-11 h-11 shrink-0">
              <svg
                className="w-11 h-11 -rotate-90"
                viewBox="0 0 44 44"
                aria-hidden
              >
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/40"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary transition-all duration-300"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-foreground">
                {progressPct}%
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground text-right">
            Created {formatDate(project.created_at)}
          </span>
          {!isCompleted && !isCancelled && showPauseResume !== "none" && (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-[11px] border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:text-emerald-200"
                onClick={() => handleCompleteProject(project)}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Complete
              </Button>
              {showPauseResume === "pause" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[11px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={() => handlePauseProject(project.id)}
                >
                  <Pause className="w-3.5 h-3.5 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => handleResumeProject(project.id)}
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Resume
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-[11px] border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300 dark:border-rose-900/50 dark:text-rose-300 dark:hover:text-rose-200"
                onClick={() => handleCancelProject(project.id)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyState = (type: string) => {
    const configs = {
      active: {
        message: "No active projects yet",
        detail: "Create a project to start collecting data.",
        showCreate: true,
      },
      paused: {
        message: "No paused projects",
        detail: "Paused projects will appear here.",
        showCreate: false,
      },
      completed: {
        message: "No completed projects yet",
        detail: "Completed projects will show here.",
        showCreate: false,
      },
      cancelled: {
        message: "No cancelled projects",
        detail: "Cancelled projects will appear here.",
        showCreate: false,
      },
    };
    const config = configs[type as keyof typeof configs];

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-24 h-24">
          <EmptyDataSvg />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {config.message}
        </h3>
        <p className="text-sm text-muted-foreground">{config.detail}</p>
        {config.showCreate && (
          <Button
            size="sm"
            className="mt-1 gap-2"
            onClick={() => setCreateProjectOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 py-4 md:py-6">
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={fetchProjects}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track your data collection projects
          </p>
        </div>
        <Button
          size="sm"
          className="btn-gelatine gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600 text-white hover:opacity-90 transition-opacity shadow-sm"
          onClick={() => setCreateProjectOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
          <CardContent className="px-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Active
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {activeProjects.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Active projects
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/10">
                <FolderKanban className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
          <CardContent className="px-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Paused
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {pausedProjects.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Paused projects
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-yellow-500/10">
                <Pause className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
          <CardContent className="px-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Completed
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {completedProjects.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Completed projects
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
          <CardContent className="px-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Cancelled
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {cancelledProjects.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Cancelled projects
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Projects List */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 shadow-sm overflow-hidden pt-3">
        <Tabs defaultValue="active" className="w-full">
          <TabsUnderlineList className="px-4 md:px-6 border-b border-gray-200 dark:border-gray-800">
            <TabsUnderlineTrigger
              value="active"
              className="data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-400"
            >
              Active ({activeProjects.length})
            </TabsUnderlineTrigger>
            <TabsUnderlineTrigger
              value="paused"
              className="data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:border-amber-400 dark:data-[state=active]:text-amber-400"
            >
              Paused ({pausedProjects.length})
            </TabsUnderlineTrigger>
            <TabsUnderlineTrigger
              value="completed"
              className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:border-emerald-400 dark:data-[state=active]:text-emerald-400"
            >
              Completed ({completedProjects.length})
            </TabsUnderlineTrigger>
            <TabsUnderlineTrigger
              value="cancelled"
              className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:border-rose-400 dark:data-[state=active]:text-rose-400"
            >
              Cancelled ({cancelledProjects.length})
            </TabsUnderlineTrigger>
          </TabsUnderlineList>

          <div className="p-4 md:p-6">
            <TabsContent value="active" className="mt-0 space-y-4">
              {activeProjects.length === 0
                ? renderEmptyState("active")
                : activeProjects.map((project) =>
                    renderProjectCard(project, "pause"),
                  )}
            </TabsContent>

            <TabsContent value="paused" className="mt-0 space-y-4">
              {pausedProjects.length === 0
                ? renderEmptyState("paused")
                : pausedProjects.map((project) =>
                    renderProjectCard(project, "resume"),
                  )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0 space-y-4">
              {completedProjects.length === 0
                ? renderEmptyState("completed")
                : completedProjects.map((project) =>
                    renderProjectCard(project, "none"),
                  )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-0 space-y-4">
              {cancelledProjects.length === 0
                ? renderEmptyState("cancelled")
                : cancelledProjects.map((project) =>
                    renderProjectCard(project, "none"),
                  )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setEditingProject(null);
            }
          }}
          onSuccess={() => {
            fetchProjects();
          }}
        />
      )}
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
    </div>
  );
}
