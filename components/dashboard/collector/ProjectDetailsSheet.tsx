"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/types/project";
import type { Proposal } from "@/types/proposal";
import type { UserProfile } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsUnderlineList,
  TabsUnderlineTrigger,
} from "@/components/ui/tabs";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import SubmitProposalDialog from "./SubmitProposalDialog";
import { getProfileById } from "@/lib/services/profileService";
import {
  getCollectorFeedbackByProjects,
  getRequesterFeedbackByProjects,
  getRequesterProjectHistory,
  type CollectorFeedback,
  type ProjectFeedback,
  type RequesterHistoryProject,
} from "@/lib/services/projectService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PieChart, Pie, Cell } from "recharts";
import {
  Calendar,
  DollarSign,
  Heart,
  MapPin,
  Star,
  Users,
  Ruler,
  Tag,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Video,
  Mic,
  FileText,
  LocateFixed,
  Activity,
  Package,
  Bookmark,
  Eye,
  LogIn,
  UserPlus,
  AlertCircle,
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function getProjectIconIndex(projectId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

function getSvgForProject(projectId: string, category: string) {
  const pool =
    category === "Photography"
      ? PHOTOGRAPHY_SVGS
      : category === "Video"
        ? VIDEO_SVGS
        : category === "Audio"
          ? AUDIO_SVGS
          : category === "Text"
            ? TEXT_SVGS
            : category === "Survey"
              ? SURVEY_SVGS
              : category === "Location Data"
                ? LOCATION_SVGS
                : category === "Sensor Data"
                  ? SENSOR_SVGS
                  : OTHER_SVGS;
  return pool[getProjectIconIndex(projectId, pool.length)];
}

interface ProjectDetailsSheetProps {
  project: Project | null;
  proposal?: Proposal | null;
  slotsFilled?: boolean;
  onProposalSuccess?: () => void;
  isSavedProject?: boolean;
  onToggleSaveProject?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, sheet always uses dark mode (e.g. when opened from landing projects page). */
  forceDarkMode?: boolean;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "No deadline";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProjectDetailsSheet({
  project,
  proposal,
  slotsFilled = false,
  onProposalSuccess,
  isSavedProject = false,
  onToggleSaveProject,
  open,
  onOpenChange,
  forceDarkMode = false,
}: ProjectDetailsSheetProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requesterProjects, setRequesterProjects] = useState<
    RequesterHistoryProject[]
  >([]);
  const [loadingRequesterProjects, setLoadingRequesterProjects] =
    useState(false);
  const [requesterProfile, setRequesterProfile] = useState<UserProfile | null>(
    null,
  );
  const [requesterFeedbackByProject, setRequesterFeedbackByProject] = useState<
    Record<string, ProjectFeedback>
  >({});
  const [collectorFeedbackByProject, setCollectorFeedbackByProject] = useState<
    Record<string, CollectorFeedback>
  >({});
  const [currentRequesterTime, setCurrentRequesterTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  );

  useEffect(() => {
    if (!project?.requester_id || !open) return;

    let mounted = true;
    const loadRequesterData = async () => {
      setLoadingRequesterProjects(true);
      const [historyRes, profileRes] = await Promise.all([
        getRequesterProjectHistory(project.requester_id, project.id),
        getProfileById(project.requester_id),
      ]);
      if (mounted) {
        const historyProjects = historyRes.data ?? [];
        setRequesterProjects(historyProjects);
        setRequesterProfile(profileRes.data ?? null);
        if (historyProjects.length > 0 && user?.id) {
          const historyProjectIds = historyProjects.map((p) => p.id);
          const [requesterFeedbackRes, collectorFeedbackRes] =
            await Promise.all([
              getRequesterFeedbackByProjects(historyProjectIds),
              getCollectorFeedbackByProjects(historyProjectIds, user.id),
            ]);
          if (mounted) {
            setRequesterFeedbackByProject(requesterFeedbackRes.data || {});
            setCollectorFeedbackByProject(collectorFeedbackRes.data || {});
          }
        } else {
          setRequesterFeedbackByProject({});
          setCollectorFeedbackByProject({});
        }
        setLoadingRequesterProjects(false);
      }
    };

    loadRequesterData();

    return () => {
      mounted = false;
    };
  }, [open, project?.id, project?.requester_id, user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentRequesterTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!project) return null;

  const hasMapCoordinates =
    typeof project.location?.lat === "number" &&
    typeof project.location?.lng === "number";
  const radiusKm =
    typeof project.location?.radius_km === "number" &&
    Number.isFinite(project.location.radius_km)
      ? Math.max(project.location.radius_km, 0)
      : 0;
  const completedProjectsCount =
    requesterProjects.filter((p) => p.status === "completed").length +
    (project.status === "completed" ? 1 : 0);
  const cancelledProjectsCount =
    requesterProjects.filter((p) => p.status === "cancelled").length +
    (project.status === "cancelled" ? 1 : 0);
  const totalSpent =
    requesterProjects.reduce((sum, p) => sum + p.budget, 0) + project.budget;

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
  const svgIdx = getProjectIconIndex(project.id, svgPool.length);
  const SvgComp = svgPool[svgIdx];
  const categoryIcon = (
    <span className="w-8 h-8 flex items-center justify-center">
      <SvgComp color={catMeta.accent} />
    </span>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col border-none shadow-none",
          forceDarkMode ? "bg-[#111827]" : "bg-white dark:bg-[#111827]",
        )}
      >
        <div className={cn(forceDarkMode && "dark")}>
          {/* Visually hidden accessible header */}
          <SheetHeader className="sr-only">
            <SheetTitle>{project.title}</SheetTitle>
            <SheetDescription>Project details for collectors.</SheetDescription>
          </SheetHeader>

          {/* Hero header */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
                  style={{ color: catMeta.accent }}
                >
                  {categoryIcon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {project.title}
                  </h2>
                  {project.location?.address && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {project.location.address}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${catMeta.bg}`}
                  style={{ color: catMeta.accent }}
                >
                  {catMeta.icon && (
                    <span className="scale-75 origin-center">
                      {catMeta.icon}
                    </span>
                  )}
                  {project.category}
                </span>
                <Badge
                  variant="outline"
                  className={`capitalize gap-1.5 ${
                    project.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : project.status === "cancelled"
                        ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                        : project.status === "paused"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      project.status === "completed"
                        ? "bg-emerald-500"
                        : project.status === "cancelled"
                          ? "bg-red-500"
                          : project.status === "paused"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                    }`}
                  />
                  {project.status}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${project.budget.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <TabsUnderlineList className="border-b border-gray-200 dark:border-gray-800">
              <TabsUnderlineTrigger value="overview">
                Overview
              </TabsUnderlineTrigger>
              <TabsUnderlineTrigger value="reviews">
                Reviews
              </TabsUnderlineTrigger>
              <TabsUnderlineTrigger value="requester">
                About
              </TabsUnderlineTrigger>
            </TabsUnderlineList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="flex-1 p-5 space-y-5 mt-0">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Description
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                >
                  <Users className="w-6 h-6" />
                  {project.max_collectors}{" "}
                  {project.max_collectors === 1 ? "collector" : "collectors"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                >
                  <Calendar className="w-5 h-5" />
                  {formatDate(project.deadline)}
                </Badge>
                {typeof project.location?.radius_km === "number" && (
                  <Badge
                    variant="outline"
                    className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                  >
                    <Ruler className="w-5 h-5" />
                    {`${project.location.radius_km} km`}
                  </Badge>
                )}
              </div>

              {/* Data types */}
              {project.requirements.data_types.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Required Data Types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requirements.data_types.map((type, idx) => (
                      <Badge
                        key={`${type}-${idx}`}
                        variant="secondary"
                        className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Formats */}
              {project.requirements.formats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Preferred Formats
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requirements.formats.map((format, idx) => (
                      <Badge
                        key={`${format}-${idx}`}
                        variant="outline"
                        className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {project.requirements.specifications && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Additional Specifications
                  </p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {project.requirements.specifications}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-1">
                {!user && !authLoading ? (
                  <>
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-600 dark:text-amber-400">
                          Sign in required
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          You need to sign in to apply for this project.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        className="w-full h-12 rounded-xl gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 [&_svg]:size-5"
                        asChild
                      >
                        <Link
                          href="/signup?role=collector"
                          className="flex items-center justify-center gap-2"
                        >
                          <UserPlus className="shrink-0" />
                          Create Account
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        className="w-full h-12 rounded-xl gap-2 bg-amber-500 text-white hover:bg-amber-500/90 [&_svg]:size-5"
                        asChild
                      >
                        <Link href="/login?redirect=/projects">
                          <LogIn className="shrink-0" />
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2.5">
                    {onToggleSaveProject && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 gap-2 bg-primary/10 hover:bg-primary/20 dark:hover:bg-primary/30 h-12 rounded-xl"
                        onClick={onToggleSaveProject}
                      >
                        {isSavedProject ? (
                          <Bookmark
                            className="w-6 h-6 text-primary"
                            fill="currentColor"
                          />
                        ) : (
                          <Bookmark className="w-6 h-6 text-primary" />
                        )}
                        <span
                          className={cn("text-base font-medium text-primary")}
                        >
                          {isSavedProject ? "Saved" : "Save"}
                        </span>
                      </Button>
                    )}
                    {proposal ? (
                      <Button
                        type="button"
                        className="flex-1 bg-primary text-white hover:bg-primary/90 h-12 rounded-xl [&_svg]:size-4"
                        onClick={() => {
                          router.push(
                            `/dashboard/projects/${project.id}/proposal`,
                          );
                        }}
                      >
                        <Eye className="w-5 h-5" />
                        <span className="text-base font-medium text-white">
                          View Proposal
                        </span>
                      </Button>
                    ) : slotsFilled ? (
                      <Badge
                        variant="secondary"
                        className="flex-1 justify-center text-xs py-2 bg-gray-500/20 text-gray-400"
                      >
                        Slots Full
                      </Badge>
                    ) : (
                      <SubmitProposalDialog
                        project={project}
                        onSuccess={onProposalSuccess}
                        triggerClassName="flex-1 justify-center"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Map */}
              {hasMapCoordinates && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Location Map
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <LocationMapPreview
                      lat={project.location!.lat as number}
                      lng={project.location!.lng as number}
                      radiusKm={radiusKm}
                      forceDarkMode={forceDarkMode}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Reviews ── */}
            <TabsContent value="reviews" className="flex-1 p-5 space-y-4 mt-0">
              {loadingRequesterProjects ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Loading history…
                </p>
              ) : requesterProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No previous projects found for this requester.
                </p>
              ) : (
                requesterProjects.map((historyProject) => {
                  const hCatMeta =
                    CATEGORY_META[historyProject.category] ||
                    DEFAULT_CATEGORY_META;
                  const HSvgComp = getSvgForProject(
                    historyProject.id,
                    historyProject.category,
                  );
                  const collectorFb =
                    collectorFeedbackByProject[historyProject.id] ?? null;
                  const requesterFb =
                    requesterFeedbackByProject[historyProject.id] ?? null;
                  const hasFeedback =
                    collectorFb !== null || requesterFb !== null;
                  return (
                    <div
                      key={historyProject.id}
                      className="rounded-xl border-none bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Category icon */}
                          <div
                            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${hCatMeta.bg}`}
                          >
                            <span className="w-7 h-7 flex items-center justify-center">
                              <HSvgComp color={hCatMeta.accent} />
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate leading-snug">
                              {historyProject.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 mt-2">
                              <span
                                className="text-[11px] font-medium"
                                style={{ color: hCatMeta.accent }}
                              >
                                {historyProject.category}
                              </span>
                              <span className="text-muted-foreground/40 text-[11px]">
                                ·
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDate(historyProject.created_at)}
                              </span>
                              {historyProject.deadline && (
                                <>
                                  <span className="text-muted-foreground/40 text-[11px]">
                                    ·
                                  </span>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                    <Calendar className="w-2.5 h-2.5" />
                                    Due {formatDate(historyProject.deadline)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`capitalize text-[11px] gap-1.5 ${
                              historyProject.status === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : historyProject.status === "cancelled"
                                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                                  : historyProject.status === "paused"
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                historyProject.status === "completed"
                                  ? "bg-emerald-500"
                                  : historyProject.status === "cancelled"
                                    ? "bg-red-500"
                                    : historyProject.status === "paused"
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                              }`}
                            />
                            {historyProject.status}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground tabular-nums">
                            ${historyProject.budget.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Feedback section — only when at least one feedback exists */}
                      {hasFeedback && (
                        <div className="border-t border-border divide-y divide-border">
                          {collectorFb && (
                            <FeedbackBlock
                              label="Collector"
                              feedback={collectorFb}
                            />
                          )}
                          {requesterFb && (
                            <FeedbackBlock
                              label="Requester"
                              feedback={requesterFb}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* ── About / Requester ── */}
            <TabsContent
              value="requester"
              className="flex-1 p-5 space-y-5 mt-0"
            >
              {/* Location & time */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Location
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {requesterProfile?.location?.country || "Unknown country"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {requesterProfile?.location?.city || "Unknown city"}
                      <span className="mx-1 opacity-40">·</span>
                      {currentRequesterTime}
                    </span>
                  </p>
                </div>
              </div>

              {/* Stats - Donut Chart */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Project Activity
                  </p>
                  {!loadingRequesterProjects && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      <ClipboardList className="w-3 h-3" />
                      {requesterProjects.length + 1} Posted
                    </span>
                  )}
                </div>

                {loadingRequesterProjects ? (
                  <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
                    …
                  </div>
                ) : (
                  <RequesterDonutChart
                    total={requesterProjects.length + 1}
                    completed={completedProjectsCount}
                    cancelled={cancelledProjectsCount}
                  />
                )}
              </div>

              {/* Total spent */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-violet-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total spent</p>
                </div>
                <p className="text-base font-bold text-foreground tabular-nums">
                  {loadingRequesterProjects ? "…" : `$${totalSpent.toFixed(2)}`}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Helper sub-components ── */

function RequesterDonutChart({
  total,
  completed,
  cancelled,
}: {
  total: number;
  completed: number;
  cancelled: number;
}) {
  const active = Math.max(0, total - completed - cancelled);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const pieData = [
    { name: "Completed", value: completed || 0.01, color: "#10b981" },
    { name: "Cancelled", value: cancelled || 0.01, color: "#ef4444" },
    { name: "Active", value: active || 0.01, color: "#3b82f6" },
  ];

  const legend = [
    { label: "Completed", value: completed, color: "bg-emerald-500" },
    { label: "Cancelled", value: cancelled, color: "bg-red-500" },
    { label: "Active", value: active, color: "bg-blue-500" },
  ];

  type TooltipData = { name: string; value: number; color: string } | null;
  const [tooltip, setTooltip] = useState<TooltipData>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 14}px`;
      tooltipRef.current.style.top = `${e.clientY - 48}px`;
    }
  };

  return (
    <div className="flex items-center gap-4" onMouseMove={handleMouseMove}>
      {/* Donut */}
      <div className="relative shrink-0">
        <PieChart width={128} height={128}>
          <Pie
            data={pieData}
            cx={60}
            cy={60}
            innerRadius={40}
            outerRadius={58}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
            paddingAngle={5}
            onMouseEnter={(data, _, e) => {
              if (tooltipRef.current) {
                tooltipRef.current.style.left = `${e.clientX + 14}px`;
                tooltipRef.current.style.top = `${e.clientY - 48}px`;
              }
              setTooltip({
                name: data.name as string,
                value: data.value === 0.01 ? 0 : (data.value as number),
                color: data.color as string,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-foreground leading-none tabular-nums">
            {completionRate}%
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Done</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5">
        {legend.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Cursor-following tooltip — rendered at fixed coords, updated via ref (no re-render) */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{ left: 0, top: 0 }}
        >
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg whitespace-nowrap"
            style={{ backgroundColor: tooltip.color }}
          >
            {tooltip.name}: <span className="font-bold">{tooltip.value}</span>
          </div>
          <div
            className="absolute -bottom-[6px] left-4 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${tooltip.color}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function FeatureChip({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-none">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
          {sub}
        </p>
      </div>
    </div>
  );
}

function FeedbackBlock({
  label,
  feedback,
}: {
  label: string;
  feedback: { rating: number; feedback: string } | null;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {feedback && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-3 h-3 ${
                    idx < feedback.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted-foreground/15 text-muted-foreground/15"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {feedback.rating}/5
            </span>
          </div>
        )}
      </div>
      {feedback ? (
        feedback.feedback ? (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {feedback.feedback}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">
            No written feedback.
          </p>
        )
      ) : (
        <p className="text-xs text-muted-foreground/50 italic">
          No feedback yet.
        </p>
      )}
    </div>
  );
}
