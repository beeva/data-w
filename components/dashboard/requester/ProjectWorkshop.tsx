"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProjectById } from "@/lib/services/projectService";
import { getProjectStats } from "@/lib/services/submissionService";
import { getProposalsByProject } from "@/lib/services/proposalService";
import type { Project } from "@/types/project";
import type { ProjectStats } from "@/types/submission";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsUnderlineList,
  TabsUnderlineTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, Users, Calendar, Ruler, Camera, Video, Mic, FileText, ClipboardList, LocateFixed, Activity, Package } from "lucide-react";
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
import ToastNotification from "@/components/ui/toast-notification";
import ProjectProposals from "./ProjectProposals";
import ProjectSubmissions from "./ProjectSubmissions";
import EditProjectDialog from "./EditProjectDialog";
import { Skeleton } from "@/components/ui/skeleton";

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

function formatDateSheet(dateString: string | null) {
  if (!dateString) return "No deadline";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ProjectWorkshopProps {
  projectId: string;
}

export default function ProjectWorkshop({ projectId }: ProjectWorkshopProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [pendingProposalsCount, setPendingProposalsCount] = useState<number>(0);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] =
    useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    title?: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const [projectResult, statsResult, proposalsResult] = await Promise.all([
        getProjectById(projectId),
        getProjectStats(projectId),
        getProposalsByProject(projectId),
      ]);

      if (projectResult.error) throw projectResult.error;
      if (statsResult.error) throw statsResult.error;

      setProject(projectResult.data);
      setStats(statsResult.data);
      const proposals = proposalsResult.error
        ? []
        : (proposalsResult.data ?? []);
      setPendingProposalsCount(
        proposals.filter(
          (p) => p.status !== "accepted" && p.status !== "rejected",
        ).length,
      );
    } catch (err: any) {
      setError(err.message || "Failed to load workshop data");
      console.error("Error fetching workshop data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
     
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {/* Header skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-0 pt-2 pb-4">
          <div className="flex items-start gap-3">
            <Skeleton className="shrink-0 w-12 h-12 rounded-xl" />
            <div className="space-y-2 pt-0.5">
              <Skeleton className="h-6 w-44 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>

        {/* Card + tabs skeleton */}
        <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 border border-border/40">
          {/* Tab bar */}
          <div className="flex gap-6 px-5 pt-2 border-b border-gray-200 dark:border-gray-800">
            <Skeleton className="h-8 w-20 rounded-md mb-2" />
            <Skeleton className="h-8 w-20 rounded-md mb-2" />
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Description block */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>

            {/* Chips row */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>

            {/* Data types */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 rounded" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>

            {/* Formats */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-6 px-4">
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold mb-1">Project not found</h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                The project doesn&apos;t exist or you don&apos;t have access.
              </p>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = stats
    ? Math.round(
        ((stats.validated_submissions + stats.rejected_submissions) /
          Math.max(stats.total_submissions, 1)) *
          100,
      )
    : 0;

  return (
    <div className="space-y-3 py-4">
      {toast && (
        <ToastNotification
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}
      <EditProjectDialog
        project={project}
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        onSuccess={async () => {
          await fetchData();
          setToast({
            title: "Project updated",
            message: "Your project changes were saved successfully.",
            type: "success",
          });
        }}
      />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="px-0 pt-2 pb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5",
                  (CATEGORY_META[project.category] || DEFAULT_CATEGORY_META).bg,
                )}
                style={{
                  color: (
                    CATEGORY_META[project.category] || DEFAULT_CATEGORY_META
                  ).accent,
                }}
              >
                <span className="w-8 h-8 flex items-center justify-center">
                  {(() => {
                    const catMeta =
                      CATEGORY_META[project.category] || DEFAULT_CATEGORY_META;
                    const SvgComp = getSvgForProject(
                      project.id,
                      project.category,
                    );
                    return <SvgComp color={catMeta.accent} />;
                  })()}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {project.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md",
                      (CATEGORY_META[project.category] || DEFAULT_CATEGORY_META)
                        .bg,
                    )}
                    style={{
                      color: (
                        CATEGORY_META[project.category] || DEFAULT_CATEGORY_META
                      ).accent,
                    }}
                  >
                    {(CATEGORY_META[project.category] || DEFAULT_CATEGORY_META)
                      .icon && (
                      <span className="scale-75 origin-center">
                        {
                          (
                            CATEGORY_META[project.category] ||
                            DEFAULT_CATEGORY_META
                          ).icon
                        }
                      </span>
                    )}
                    {project.category}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize gap-1.5",
                      project.status === "completed"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : project.status === "cancelled"
                          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : project.status === "paused"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        project.status === "completed"
                          ? "bg-emerald-500"
                          : project.status === "cancelled"
                            ? "bg-red-500"
                            : project.status === "paused"
                              ? "bg-amber-500"
                              : "bg-blue-500",
                      )}
                    />
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className="text-xl font-semibold text-foreground">
          ${project.budget.toFixed(2)}
        </span>
      </div>

      {error && (
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[11px]">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info & Proposals Tabs — same structure as ProjectDetailsSheet */}
      <Card className="overflow-hidden bg-white dark:bg-gray-800/50 border-none">
        <CardContent className="p-0">
          <Tabs
            defaultValue="project-info"
            className="w-full flex-1 flex flex-col"
          >
            <TabsUnderlineList className="border-b border-gray-200 dark:border-gray-800 px-5 pt-2">
              <TabsUnderlineTrigger value="project-info">
                Project Info
              </TabsUnderlineTrigger>
              <TabsUnderlineTrigger value="proposals" className="gap-1.5">
                Proposals
                {pendingProposalsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="gelatine-auto rounded-full h-5 min-w-5 px-1.5 text-[10px] font-semibold tabular-nums bg-primary text-primary-foreground border-0"
                  >
                    {pendingProposalsCount}
                  </Badge>
                )}
              </TabsUnderlineTrigger>
              <TabsUnderlineTrigger value="submissions" className="gap-1.5">
                Submissions
                {pendingSubmissionsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="gelatine-auto rounded-full h-5 min-w-5 px-1.5 text-[10px] font-semibold tabular-nums bg-amber-500 text-white border-0"
                  >
                    {pendingSubmissionsCount}
                  </Badge>
                )}
              </TabsUnderlineTrigger>
            </TabsUnderlineList>

            <TabsContent value="project-info" className="flex-1 p-5 mt-0">
              {/* Layout: main content left, action buttons column right (wireframe structure) */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Left: project info content */}
                <div className="flex-1 min-w-0 space-y-5">
                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Description
                    </p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Feature chips + data types + formats at bottom */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                    >
                      <Users className="w-6 h-6" />
                      {project.max_collectors}{" "}
                      {project.max_collectors === 1
                        ? "collector"
                        : "collectors"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full [&>svg]:size-4"
                    >
                      <Calendar className="w-5 h-5" />
                      {formatDateSheet(project.deadline)}
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
                  {project.requirements?.data_types?.length > 0 && (
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
                  {project.requirements?.formats?.length > 0 && (
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
                  {project.requirements?.specifications && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Additional Specifications
                      </p>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {project.requirements.specifications}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: action buttons column (wireframe) */}
                <div className="shrink-0 flex flex-col gap-3 lg:w-[180px]">
                  <Button
                    className="h-12 rounded-xl w-full"
                    onClick={() => setEditProjectOpen(true)}
                  >
                    Edit Project
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl w-full bg-gray-100 dark:bg-gray-800/50 border-none hover:bg-gray-200 dark:hover:bg-gray-700/50"
                    onClick={() => router.push("/dashboard/projects/active")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="proposals"
              className="mt-3 space-y-2 flex-1 p-5 pt-0"
            >
              <ProjectProposals
                projectId={projectId}
                project={project}
                onPendingCountChange={setPendingProposalsCount}
              />
            </TabsContent>

            <TabsContent value="submissions" className="mt-3 flex-1 p-5 pt-0">
              <ProjectSubmissions
                projectId={projectId}
                onPendingCountChange={setPendingSubmissionsCount}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
