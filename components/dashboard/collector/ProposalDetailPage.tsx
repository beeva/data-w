"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById } from "@/lib/services/projectService";
import {
  getProposalByCollectorAndProject,
  getAssignmentByCollectorAndProject,
} from "@/lib/services/proposalService";
import type { Project } from "@/types/project";
import type { Proposal, CollectorAssignment } from "@/types/proposal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ruler,
  Camera,
  Video,
  Mic,
  FileText,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Briefcase,
  Globe,
  Wrench,
  MessageSquare,
  StickyNote,
  Loader2,
  ArrowRight,
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
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { Separator } from "@/components/ui/separator";

/* ── SVG pools ── */
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

/* ── Category metadata ── */
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

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "No deadline";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Proposal status config ── */
const PROPOSAL_STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    description:
      "Your proposal has been submitted and is awaiting review by the requester.",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    description:
      "Congratulations! Your proposal has been accepted. You can now start collecting data.",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
    description: "Your proposal was not selected for this project.",
  },
  withdrawn: {
    label: "Withdrawn",
    icon: <MinusCircle className="w-4 h-4" />,
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    dot: "bg-gray-500",
    description: "You have withdrawn this proposal.",
  },
};

/* ── Loading skeleton ── */
function ProposalDetailSkeleton() {
  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-9 w-9 rounded-md shrink-0 -ml-2" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT — Job Details */}
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
          {/* Section title */}
          <Skeleton className="h-6 w-32 mx-5 mt-5" />

          {/* Project header row */}
          <div className="px-5 pt-5 pb-4 flex items-start gap-3">
            <Skeleton className="shrink-0 w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            </div>
            <div className="shrink-0 space-y-1 text-right">
              <Skeleton className="h-7 w-20 ml-auto" />
              <Skeleton className="h-3.5 w-10 ml-auto" />
            </div>
          </div>

          {/* Separator */}
          <div className="px-5">
            <Skeleton className="h-px w-full" />
          </div>

          <div className="px-5 pb-5 pt-5 space-y-5">
            {/* Description */}
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Separator */}
            <Skeleton className="h-px w-full" />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>

            {/* Data types */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>

            {/* Map */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* RIGHT — My Proposal */}
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
          {/* Proposal header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            {/* Status description banner */}
            <Skeleton className="h-10 w-full rounded-lg mt-3" />
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Key metrics row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3.5 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3.5 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>

            {/* Cover message */}
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4 space-y-2.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Collection location */}
            <div className="flex items-start gap-3.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4">
              <Skeleton className="shrink-0 w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>

            {/* Capabilities */}
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4 space-y-4">
              <Skeleton className="h-3 w-24" />
              {/* Data types */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
              {/* Equipment */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
              {/* Experience / Languages / Availability */}
              <div className="grid grid-cols-3 gap-4 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Info row ── */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-0.5 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ProposalDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [assignment, setAssignment] = useState<CollectorAssignment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!user?.id || !projectId) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [projectRes, proposalRes] = await Promise.all([
        getProjectById(projectId),
        getProposalByCollectorAndProject(user.id, projectId),
      ]);
      if (!mounted) return;
      if (projectRes.error || !projectRes.data) {
        setError("Project not found.");
      } else if (proposalRes.error || !proposalRes.data) {
        setError("Proposal not found.");
      } else {
        setProject(projectRes.data);
        setProposal(proposalRes.data);
        if (proposalRes.data.status === "accepted") {
          const assignmentRes = await getAssignmentByCollectorAndProject(
            user.id,
            projectId,
          );
          if (!mounted) return;
          if (assignmentRes.data) setAssignment(assignmentRes.data);
        }
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, projectId]);

  if (loading) return <ProposalDetailSkeleton />;

  if (error || !project || !proposal) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-muted-foreground">
          {error ?? "Something went wrong."}
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const catMeta = CATEGORY_META[project.category] ?? CATEGORY_META["Other"];
  const SvgComp = getSvgForProject(project.id, project.category);
  const statusCfg = PROPOSAL_STATUS_CONFIG[proposal.status];

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="btn-gelatine shrink-0 -ml-2 text-muted-foreground hover:text-foreground hover:bg-background"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Proposal Info</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          View the job details and your submitted proposal
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* ── LEFT: Job info ── */}
        <section className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
          {/* Project header */}

          <p className="text-xl font-bold text-foreground uppercase tracking-wide px-5 pt-5">
            Job Details
          </p>
          <div className="px-5 pt-5 pb-4 flex items-start gap-3">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
              style={{ color: catMeta.accent }}
            >
              <span className="w-8 h-8 flex items-center justify-center">
                <SvgComp color={catMeta.accent} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {project.title}
              </h1>
              {project.location?.address && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{project.location.address}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${catMeta.bg}`}
                  style={{ color: catMeta.accent }}
                >
                  <span className="scale-75 origin-center">{catMeta.icon}</span>
                  {project.category}
                </span>
                <Badge
                  variant="outline"
                  className={`capitalize text-[11px] gap-1.5 ${
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
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-foreground tabular-nums">
                ${project.budget.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">budget</p>
            </div>
          </div>
          <div className="px-5">
            <Separator className="my-5" />
          </div>
          <div className="px-5 pb-5 space-y-5">
            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Description
              </p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {project.description}
              </p>
            </div>

            <Separator className="my-4" />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                <Users className="w-4 h-4" />
                {project.max_collectors}{" "}
                {project.max_collectors === 1 ? "collector" : "collectors"}
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                <Calendar className="w-4 h-4" />
                {formatDate(project.deadline)}
              </span>
              {typeof project.location?.radius_km === "number" && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                  <Ruler className="w-4 h-4" />
                  {project.location.radius_km} km radius
                </span>
              )}
            </div>

            {/* Data types */}
            {project.requirements.data_types.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Required Data Types
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.requirements.data_types.map((type, idx) => (
                    <Badge
                      key={`${type}-${idx}`}
                      variant="secondary"
                      className="text-sm px-3 py-1 border-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full"
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
                <div className="flex flex-wrap gap-3">
                  {project.requirements.formats.map((format, idx) => (
                    <Badge
                      key={`${format}-${idx}`}
                      variant="outline"
                      className="text-sm px-3 py-1 border-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full"
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

            {/* Map */}
            {typeof project.location?.lat === "number" &&
              typeof project.location?.lng === "number" && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Location Map
                  </p>
                  <div className="overflow-hidden rounded-xl">
                    <LocationMapPreview
                      lat={project.location.lat as number}
                      lng={project.location.lng as number}
                      radiusKm={
                        typeof project.location.radius_km === "number" &&
                        Number.isFinite(project.location.radius_km)
                          ? Math.max(project.location.radius_km, 0)
                          : 0
                      }
                    />
                  </div>
                </div>
              )}
          </div>
        </section>

        {/* ── RIGHT: Submitted proposal ── */}
        <section className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
          {/* Proposal header */}

          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-foreground uppercase tracking-wide">
                My Proposal
              </p>
              {proposal.status !== "accepted" && (
                <Badge
                  variant="outline"
                  className={`capitalize gap-1.5 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                >
                  <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </Badge>
              )}
              {/* Submit files CTA — only shown when accepted and assignment exists */}
              {proposal.status === "accepted" && assignment && (
                <Button
                  className="flex gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={navigating}
                  onClick={() => {
                    setNavigating(true);
                    router.push(`/submit/${assignment.submission_token}`);
                  }}
                >
                  {navigating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Going to Submit Files...
                    </>
                  ) : (
                    <>
                      Go to Submit Files
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Status description */}
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 ${statusCfg.bg}`}
            >
              <span className={`shrink-0 mt-0.5 ${statusCfg.color}`}>
                {statusCfg.icon}
              </span>
              <p className={`text-xs leading-relaxed ${statusCfg.color}`}>
                {statusCfg.description}
              </p>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* ── Key metrics row ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Submitted
                </p>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {formatDateTime(proposal.submitted_at)}
                </p>
              </div>
              {proposal.proposed_budget != null ? (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Proposed Budget
                  </p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    ${proposal.proposed_budget.toFixed(2)}
                  </p>
                </div>
              ) : proposal.reviewed_at ? (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {formatDateTime(proposal.reviewed_at)}
                  </p>
                </div>
              ) : null}
            </div>

            {/* ── Cover message ── */}
            {proposal.message && (
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Cover Message
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {proposal.message}
                </p>
              </div>
            )}

            {/* ── Collection location ── */}
            <div className="flex items-start gap-3.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Collection Location
                </p>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {proposal.location.address}
                </p>
                {(proposal.location.city || proposal.location.country) && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[proposal.location.city, proposal.location.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* ── Capabilities ── */}
            {(proposal.capabilities.data_types.length > 0 ||
              (proposal.capabilities.equipment?.length ?? 0) > 0 ||
              proposal.capabilities.experience_years != null ||
              (proposal.capabilities.languages?.length ?? 0) > 0 ||
              proposal.capabilities.availability) && (
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Capabilities
                </p>

                {/* Data types */}
                {proposal.capabilities.data_types.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
                      <Package className="w-4 h-4" /> Data Types
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {proposal.capabilities.data_types.map((type, idx) => (
                        <Badge
                          key={`${type}-${idx}`}
                          variant="secondary"
                          className="text-sm px-3 py-1 border-none bg-gray-200 dark:bg-gray-700 text-muted-foreground rounded-full"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {proposal.capabilities.equipment &&
                  proposal.capabilities.equipment.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
                        <Wrench className="w-4 h-4" /> Equipment
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {proposal.capabilities.equipment.map((eq, idx) => (
                          <Badge
                            key={`${eq}-${idx}`}
                            variant="secondary"
                            className="text-sm px-3 py-1 border-none bg-gray-200 dark:bg-gray-700 text-muted-foreground rounded-full"
                          >
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Experience / Languages / Availability */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-4 pt-1">
                  {proposal.capabilities.experience_years != null && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5 font-medium">
                        <Briefcase className="w-4 h-4" /> Experience
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {proposal.capabilities.experience_years} yr
                        {proposal.capabilities.experience_years !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  )}
                  {proposal.capabilities.languages &&
                    proposal.capabilities.languages.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5 font-medium">
                          <Globe className="w-4 h-4" /> Languages
                        </p>
                        <p className="text-base font-bold text-foreground">
                          {proposal.capabilities.languages.join(", ")}
                        </p>
                      </div>
                    )}
                  {proposal.capabilities.availability && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4" /> Availability
                      </p>
                      <p className="text-base font-bold text-foreground capitalize">
                        {proposal.capabilities.availability}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Notes ── */}
            {proposal.capabilities.notes && (
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4" /> Additional Notes
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {proposal.capabilities.notes}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
