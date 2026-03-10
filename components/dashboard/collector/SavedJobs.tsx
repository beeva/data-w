"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getOpenProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  MapPin,
  Users,
  Search,
  FileText,
  Clock,
  Camera,
  Video,
  Mic,
  CheckCircle2,
  XCircle,
  Bookmark,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  ChevronLeft,
  ChevronRight,
  BookmarkX,
} from "lucide-react";
import ProjectDetailsSheet from "./ProjectDetailsSheet";
import { cn } from "@/lib/utils";
import {
  getProposalsByCollector,
  getAssignmentCountsByProjects,
} from "@/lib/services/proposalService";
import type { Proposal } from "@/types/proposal";
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

interface ProjectCardProps {
  project: Project;
  proposal: Proposal | undefined;
  slotsFilled: boolean;
  onSelectProject: (project: Project) => void;
  onUnsave: (id: string) => void;
  formatDate: (date: string | null) => string;
}

function ProjectCard({
  project,
  proposal,
  slotsFilled,
  onSelectProject,
  onUnsave,
  formatDate,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const catMeta = CATEGORY_META[project.category] || DEFAULT_CATEGORY_META;

  const categoryIcon = (() => {
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
    const SvgComp = svgPool[getProjectIconIndex(project.id, svgPool.length)];
    return (
      <span className="w-8 h-8 flex items-center justify-center">
        <SvgComp color={catMeta.accent} />
      </span>
    );
  })();

  useEffect(() => {
    const el = descRef.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight);
  }, [project.description]);

  return (
    <div
      className="group relative flex items-stretch gap-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all cursor-pointer p-4"
      onClick={() => onSelectProject(project)}
    >
      <div
        className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
        style={{ color: catMeta.accent }}
      >
        {categoryIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-base font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
            {project.title}
          </h3>
          {slotsFilled && !proposal && (
            <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/15 text-gray-500 border-gray-400/20">
              Full
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
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

        <div className="mb-3">
          <p
            ref={descRef}
            className={`text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
          >
            {project.description}
          </p>
          {(clamped || expanded) && (
            <button
              type="button"
              className="text-sm text-cyan-600 dark:text-cyan-400 underline underline-offset-2 mt-0.5 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "less" : "more"}
            </button>
          )}
        </div>

        {project.requirements.data_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.requirements.data_types.slice(0, 3).map((type, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs px-2.5 py-1 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                {type}
              </Badge>
            ))}
            {project.requirements.data_types.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-1 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                +{project.requirements.data_types.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${catMeta.bg}`}
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
              return (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {country ? `${city}, ${country}` : city}
                </span>
              );
            })()}
        </div>
      </div>

      <div
        className="shrink-0 flex flex-col items-end justify-between gap-2 pl-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onUnsave(project.id)}
          className="btn-gelatine text-cyan-600 dark:text-cyan-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Remove from saved"
        >
          <Bookmark className="w-6 h-6" fill="currentColor" />
        </button>
        {proposal && (
          <Badge
            className={
              proposal.status === "accepted"
                ? "text-[10px] px-2 py-0.5 bg-green-500/15 text-green-600 border-green-500/25 flex items-center gap-1"
                : proposal.status === "rejected"
                  ? "text-[10px] px-2 py-0.5 bg-red-500/15 text-red-500 border-red-500/25 flex items-center gap-1"
                  : "text-[10px] px-2 py-0.5 bg-yellow-500/15 text-yellow-600 border-yellow-500/25 flex items-center gap-1"
            }
          >
            {proposal.status === "accepted" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : proposal.status === "rejected" ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {proposal.status === "accepted"
              ? "Accepted"
              : proposal.status === "rejected"
                ? "Rejected"
                : "Pending"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function SavedJobs() {
  const { user } = useAuth();
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<
    Record<string, Proposal>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "budget_high" | "budget_low" | "deadline"
  >("newest");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem(`collector-saved-projects-${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedProjectIds(
            parsed.filter((id): id is string => typeof id === "string"),
          );
        }
      } catch {
        // ignore malformed data
      }
    }
  }, [userId]);

  const toggleSaveProject = (projectId: string) => {
    setSavedProjectIds((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      if (userId) {
        localStorage.setItem(
          `collector-saved-projects-${userId}`,
          JSON.stringify(next),
        );
      }
      return next;
    });
  };

  const fetchProjects = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setError("");
      const [projectsResult, proposalsResult] = await Promise.all([
        getOpenProjects(),
        userId
          ? getProposalsByCollector(userId)
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (projectsResult.error) throw projectsResult.error;
      const fetched = projectsResult.data || [];
      setAllProjects(fetched);
      if (proposalsResult.data && userId) {
        const statusMap: Record<string, Proposal> = {};
        proposalsResult.data.forEach((p) => {
          statusMap[p.request_id] = p;
        });
        setProposalStatuses(statusMap);
      }
      if (fetched.length > 0) {
        const { data: counts } = await getAssignmentCountsByProjects(
          fetched.map((p) => p.id),
        );
        setAssignmentCounts(counts || {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`proposals-saved-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "proposals",
          filter: `collector_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Proposal>) => {
          const updated = payload.new as Proposal;
          setProposalStatuses((prev) => ({
            ...prev,
            [updated.request_id]: updated,
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const savedProjects = useMemo(
    () => allProjects.filter((p) => savedProjectIds.includes(p.id)),
    [allProjects, savedProjectIds],
  );

  const filteredProjects = useMemo(() => {
    let filtered = searchTerm
      ? savedProjects.filter(
          (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [...savedProjects];

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "budget_high":
          return b.budget - a.budget;
        case "budget_low":
          return a.budget - b.budget;
        case "deadline":
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });
    return filtered;
  }, [savedProjects, searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const availableCount = savedProjects.filter(
    (p) => (assignmentCounts[p.id] || 0) < p.max_collectors,
  ).length;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / itemsPerPage),
  );
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const selectedProposal = selectedProject
    ? proposalStatuses[selectedProject.id] || null
    : null;
  const selectedSlotsFilled = selectedProject
    ? (assignmentCounts[selectedProject.id] || 0) >=
      (selectedProject.max_collectors || 1)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen pt-2 animate-pulse">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded-md mb-2" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="bg-white dark:bg-gray-800/50 border-none shadow-md"
            >
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="dark:bg-gray-800/50 border-none shadow-sm">
          <CardContent className="px-6 space-y-3 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-stretch gap-4 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-2">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Jobs</h1>
              <p className="text-muted-foreground text-sm">
                {savedProjectIds.length === 0
                  ? "You haven't saved any jobs yet"
                  : `${savedProjectIds.length} saved job${savedProjectIds.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/projects/find")}
            className="shrink-0 h-9 px-3 text-sm border-none text-muted-foreground hover:text-primary hover:bg-transparent dark:hover:bg-transparent hover:underline bg-transparent hover:underline"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Find More Jobs
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state — no saved jobs at all */}
      {savedProjectIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
            <BookmarkX className="w-8 h-8 text-cyan-500 opacity-60" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            No saved jobs yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Browse projects and click the bookmark icon to save jobs you want to
            come back to.
          </p>
          <Button
            onClick={() => router.push("/dashboard/projects/find")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Projects
          </Button>
        </div>
      )}

      {savedProjectIds.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                      Saved
                    </p>
                    <p className="text-2xl font-bold">
                      {savedProjectIds.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {availableCount} still available
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Bookmark
                      className="w-6 h-6 text-cyan-500"
                      fill="currentColor"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                      Total Budget
                    </p>
                    <p className="text-2xl font-bold">
                      $
                      {savedProjects
                        .reduce((sum, p) => sum + p.budget, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      across saved jobs
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                      Open Slots
                    </p>
                    <p className="text-2xl font-bold">
                      {savedProjects.reduce(
                        (sum, p) =>
                          sum +
                          Math.max(
                            p.max_collectors - (assignmentCounts[p.id] || 0),
                            0,
                          ),
                        0,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {savedProjects.reduce(
                        (sum, p) => sum + p.max_collectors,
                        0,
                      )}{" "}
                      total slots
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project list card */}
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardHeader className="px-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground shrink-0">
                  {searchTerm
                    ? `${filteredProjects.length} result${filteredProjects.length !== 1 ? "s" : ""} found`
                    : `${savedProjects.length} saved job${savedProjects.length !== 1 ? "s" : ""}`}
                </span>
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search saved jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-gray-50 dark:bg-gray-800/50 border-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as typeof sortBy)}
                >
                  <SelectTrigger className="!h-10 w-44 text-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground shrink-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-50 dark:bg-[#111827] text-foreground border-none dark:border-gray-700">
                    <SelectItem
                      value="newest"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      Newest First
                    </SelectItem>
                    <SelectItem
                      value="budget_high"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      Budget: High → Low
                    </SelectItem>
                    <SelectItem
                      value="budget_low"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      Budget: Low → High
                    </SelectItem>
                    <SelectItem
                      value="deadline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      Deadline: Soonest
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="px-6 pt-0">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="text-base font-semibold mb-1 text-foreground">
                    No matching saved jobs
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-cyan-600 dark:text-cyan-400"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      proposal={proposalStatuses[project.id]}
                      slotsFilled={
                        (assignmentCounts[project.id] || 0) >=
                        (project.max_collectors || 1)
                      }
                      onSelectProject={setSelectedProject}
                      onUnsave={toggleSaveProject}
                      formatDate={formatDate}
                    />
                  ))}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {filteredProjects.length > itemsPerPage ? (
                          <>
                            {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(
                              currentPage * itemsPerPage,
                              filteredProjects.length,
                            )}{" "}
                            of {filteredProjects.length}
                          </>
                        ) : (
                          <>
                            {filteredProjects.length} job
                            {filteredProjects.length !== 1 ? "s" : ""}
                          </>
                        )}
                      </p>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(v) => {
                          setItemsPerPage(Number(v));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-50 dark:bg-[#111827] text-foreground border-none dark:border-gray-700">
                          {[5, 10, 25, 50, 100].map((n) => (
                            <SelectItem
                              key={n}
                              value={String(n)}
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                            >
                              {n} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="btn-gelatine h-8 w-8 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1,
                          )
                          .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                            if (idx > 0 && page - (arr[idx - 1] as number) > 1)
                              acc.push("...");
                            acc.push(page);
                            return acc;
                          }, [])
                          .map((item, idx) =>
                            item === "..." ? (
                              <span
                                key={`ellipsis-${idx}`}
                                className="w-8 text-center text-sm text-muted-foreground"
                              >
                                …
                              </span>
                            ) : (
                              <Button
                                key={item}
                                variant={
                                  currentPage === item ? "default" : "outline"
                                }
                                size="icon"
                                className={cn(
                                  "btn-gelatine h-8 w-8 text-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground",
                                  currentPage === item &&
                                    "bg-cyan-600 hover:bg-cyan-700 border-cyan-600 text-white",
                                )}
                                onClick={() => setCurrentPage(item as number)}
                              >
                                {item}
                              </Button>
                            ),
                          )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="btn-gelatine h-8 w-8 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ProjectDetailsSheet
        project={selectedProject}
        proposal={selectedProposal}
        slotsFilled={selectedSlotsFilled}
        isSavedProject={
          selectedProject ? savedProjectIds.includes(selectedProject.id) : false
        }
        onToggleSaveProject={
          selectedProject
            ? () => toggleSaveProject(selectedProject.id)
            : undefined
        }
        onProposalSuccess={() => {
          fetchProjects();
        }}
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      />
    </div>
  );
}
