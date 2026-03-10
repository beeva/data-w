"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCategoryColor } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getOpenProjects } from "@/lib/services/projectService";
import {
  getProposalsByCollector,
  getAssignmentsByCollector,
  getAssignmentCountsByProjects,
} from "@/lib/services/proposalService";
import type { Project } from "@/types/project";
import type { Proposal } from "@/types/proposal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  Users,
  Navigation,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  CheckCircle2,
  Camera,
  Video,
  Mic,
  FileText,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  ChevronRight,
  XCircle,
  LifeBuoy,
  MessageSquare,
  Settings,
  BookOpen,
} from "lucide-react";
import ProjectDetailsSheet from "./ProjectDetailsSheet";
import {
  LocationMapPreview,
  type MapJobPin,
} from "@/components/ui/location-map-preview";
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

/** Haversine distance in km between two lat/lng points */
function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
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

interface ProjectListProps {
  projects: Project[];
  activeTab: "best" | "recent" | "saved";
  maxDistance: number;
  proposalStatuses: Record<string, Proposal>;
  assignmentCounts: Record<string, number>;
  savedProjectIds: string[];
  getRawDistanceKm: (project: Project) => number | null;
  onSelectProject: (project: Project) => void;
  onToggleSave: (id: string) => void;
  onSetMaxDistance: (d: number) => void;
  onViewAll: () => void;
  formatDate: (date: string | null) => string;
}

interface ProjectCardProps {
  project: Project;
  proposal: Proposal | undefined;
  slotsFilled: boolean;
  isSaved: boolean;
  distance: string | null;
  catMeta: (typeof CATEGORY_META)[keyof typeof CATEGORY_META];
  onSelectProject: (project: Project) => void;
  onToggleSave: (id: string) => void;
  formatDate: (date: string | null) => string;
}

function ProjectCard({
  project,
  proposal,
  slotsFilled,
  isSaved,
  distance,
  catMeta,
  onSelectProject,
  onToggleSave,
  formatDate,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

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

    if (svgPool) {
      const idx = getProjectIconIndex(project.id, svgPool.length);
      const SvgComp = svgPool[idx];
      return (
        <span className="w-8 h-8 flex items-center justify-center">
          <SvgComp color={catMeta.accent} />
        </span>
      );
    }
    return catMeta.icon;
  })();

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [project.description]);

  return (
    <div
      className="group relative flex items-stretch gap-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all cursor-pointer p-4"
      onClick={() => onSelectProject(project)}
    >
      {/* Category icon */}
      <div
        className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
        style={{ color: catMeta.accent }}
      >
        {categoryIcon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
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

        {/* Price & Deadline */}
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-semibold text-muted-foreground">
              ${project.budget.toFixed(2)}
            </span>
          </span>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Estimation Deadline:</span>
            <span className="font-medium text-muted-foreground">
              {formatDate(project.deadline)}
            </span>
          </span>
        </div>

        {/* Description */}
        <div className="mb-4">
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

        {/* Meta chips */}
        <div className="flex items-center gap-6 flex-wrap">
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
            {project.max_collectors}
          </span>

          {project.location?.address &&
            (() => {
              const parts = project.location.address
                .split(",")
                .map((s) => s.trim())
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
                  {distance && (
                    <span className="font-medium">({distance})</span>
                  )}
                </span>
              );
            })()}
        </div>
      </div>

      {/* Right actions */}
      <div
        className="shrink-0 flex flex-col items-end justify-between gap-1 pl-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleSave(project.id)}
          className="btn-gelatine text-muted-foreground hover:text-foreground transition-colors"
          title={isSaved ? "Remove from saved" : "Save this project"}
        >
          {isSaved ? (
            <Bookmark
              className="w-6 h-6 text-cyan-600 dark:text-cyan-400"
              fill="currentColor"
            />
          ) : (
            <Bookmark className="w-6 h-6" />
          )}
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

function ProjectList({
  projects,
  activeTab,
  maxDistance,
  proposalStatuses,
  assignmentCounts,
  savedProjectIds,
  getRawDistanceKm,
  onSelectProject,
  onToggleSave,
  onSetMaxDistance,
  onViewAll,
  formatDate,
}: ProjectListProps) {
  const [visibleCount, setVisibleCount] = useState(
    activeTab === "recent" ? 5 : 8,
  );

  useEffect(() => {
    setVisibleCount(activeTab === "recent" ? 5 : 8);
  }, [activeTab]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-10">
        <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-sm text-muted-foreground">
          {activeTab === "saved"
            ? "No saved jobs yet. Bookmark projects to track them here."
            : activeTab === "recent"
              ? "No recent projects available right now."
              : maxDistance > 0
                ? `No projects found within ${maxDistance} km. Try increasing the distance.`
                : "No open projects available right now."}
        </p>
        {activeTab === "best" && maxDistance > 0 && (
          <Button
            variant="link"
            className="text-xs mt-1.5 text-cyan-600 dark:text-cyan-400"
            onClick={() => onSetMaxDistance(0)}
          >
            Show all distances
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pr-6">
      {projects.slice(0, visibleCount).map((project) => {
        const rawKm = getRawDistanceKm(project);
        const distance = rawKm !== null ? formatDistance(rawKm) : null;
        const proposal = proposalStatuses[project.id];
        const slotsFilled =
          (assignmentCounts[project.id] || 0) >= (project.max_collectors || 1);
        const isSaved = savedProjectIds.includes(project.id);

        const catMeta =
          (project.category && CATEGORY_META[project.category]) ||
          DEFAULT_CATEGORY_META;

        return (
          <ProjectCard
            key={project.id}
            project={project}
            proposal={proposal}
            slotsFilled={slotsFilled}
            isSaved={isSaved}
            distance={distance}
            catMeta={catMeta}
            onSelectProject={onSelectProject}
            onToggleSave={onToggleSave}
            formatDate={formatDate}
          />
        );
      })}

      {activeTab === "recent"
        ? projects.length > visibleCount && (
            <div className="pt-3 text-center">
              <Button
                variant="link"
                className="btn-gelatine text-xs text-cyan-600 dark:text-cyan-400"
                onClick={() => setVisibleCount((v) => v + 5)}
              >
                View more ({Math.min(5, projects.length - visibleCount)} more)
              </Button>
            </div>
          )
        : projects.length > visibleCount && (
            <div className="pt-3 text-center">
              <Button
                variant="link"
                className="text-xs text-cyan-600 dark:text-cyan-400"
                onClick={onViewAll}
              >
                View all {projects.length} projects →
              </Button>
            </div>
          )}
    </div>
  );
}

export default function CollectorDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<
    Record<string, Proposal>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [activeAssignments, setActiveAssignments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"best" | "recent" | "saved">(
    "best",
  );
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const skipSaveWrite = useRef(true);

  const collectorLat = profile?.location?.lat;
  const collectorLng = profile?.location?.lng;
  const hasLocation =
    typeof collectorLat === "number" && typeof collectorLng === "number";

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setSavedProjectIds([]);
      return;
    }
    skipSaveWrite.current = true;
    const saved = localStorage.getItem(`collector-saved-projects-${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedProjectIds(
            parsed.filter((id): id is string => typeof id === "string"),
          );
        }
      } catch {}
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (skipSaveWrite.current) {
      skipSaveWrite.current = false;
      return;
    }
    localStorage.setItem(
      `collector-saved-projects-${userId}`,
      JSON.stringify(savedProjectIds),
    );
  }, [savedProjectIds, userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsRes, proposalsRes, assignmentsRes] = await Promise.all([
          getOpenProjects(),
          getProposalsByCollector(userId),
          getAssignmentsByCollector(userId),
        ]);

        const allProjects = projectsRes.data || [];
        setProjects(allProjects);
        setActiveAssignments((assignmentsRes.data || []).length);

        if (proposalsRes.data) {
          const map: Record<string, Proposal> = {};
          proposalsRes.data.forEach((p) => {
            map[p.request_id] = p;
          });
          setProposalStatuses(map);
        }

        if (allProjects.length > 0) {
          const { data: counts } = await getAssignmentCountsByProjects(
            allProjects.map((p) => p.id),
          );
          setAssignmentCounts(counts || {});
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const distanceOptions = [
    { value: "0", label: "All distances" },
    { value: "5", label: "Within 5 km" },
    { value: "10", label: "Within 10 km" },
    { value: "25", label: "Within 25 km" },
    { value: "50", label: "Within 50 km" },
    { value: "100", label: "Within 100 km" },
    { value: "250", label: "Within 250 km" },
  ];

  const getRawDistanceKm = (project: Project): number | null => {
    if (!hasLocation) return null;
    const pLat = project.location?.lat;
    const pLng = project.location?.lng;
    if (typeof pLat !== "number" || typeof pLng !== "number") return null;
    return getDistanceKm(collectorLat!, collectorLng!, pLat, pLng);
  };

  const nearbyProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const proposal = proposalStatuses[p.id];
      if (proposal && proposal.status === "accepted") return false;
      if (hasLocation && maxDistance > 0) {
        const pLat = p.location?.lat;
        const pLng = p.location?.lng;
        if (typeof pLat !== "number" || typeof pLng !== "number") return false;
        const dist = getDistanceKm(collectorLat!, collectorLng!, pLat, pLng);
        if (dist > maxDistance) return false;
      }
      return true;
    });

    if (!hasLocation) return filtered;
    return [...filtered].sort((a, b) => {
      const aDist = getRawDistanceKm(a) ?? Infinity;
      const bDist = getRawDistanceKm(b) ?? Infinity;
      return aDist - bDist;
    });
  }, [
    projects,
    proposalStatuses,
    hasLocation,
    collectorLat,
    collectorLng,
    maxDistance,
  ]);

  const mostRecentProjects = useMemo(() => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return projects
      .filter((project) => {
        const proposal = proposalStatuses[project.id];
        return !(proposal && proposal.status === "accepted");
      })
      .filter(
        (project) => new Date(project.created_at).getTime() >= twoWeeksAgo,
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [projects, proposalStatuses]);

  const savedProjects = useMemo(() => {
    const savedSet = new Set(savedProjectIds);
    return projects
      .filter((project) => savedSet.has(project.id))
      .filter((project) => {
        const proposal = proposalStatuses[project.id];
        return !(proposal && proposal.status === "accepted");
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [projects, proposalStatuses, savedProjectIds]);

  const tabProjects =
    activeTab === "best"
      ? nearbyProjects
      : activeTab === "recent"
        ? mostRecentProjects
        : savedProjects;

  const toggleSaveProject = (projectId: string) => {
    setSavedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  const selectedProposal = selectedProject
    ? proposalStatuses[selectedProject.id] || null
    : null;
  const selectedSlotsFilled = selectedProject
    ? (assignmentCounts[selectedProject.id] || 0) >=
      (selectedProject.max_collectors || 1)
    : false;
  const showBestMatchesExtras = activeTab === "best";

  const jobPins = useMemo<MapJobPin[]>(() => {
    if (!showBestMatchesExtras || !hasLocation) return [];
    return tabProjects
      .filter(
        (p) =>
          typeof p.location?.lat === "number" &&
          typeof p.location?.lng === "number",
      )
      .map((p) => {
        const svgPool =
          p.category === "Photography"
            ? PHOTOGRAPHY_SVGS
            : p.category === "Video"
              ? VIDEO_SVGS
              : p.category === "Audio"
                ? AUDIO_SVGS
                : p.category === "Text"
                  ? TEXT_SVGS
                  : p.category === "Survey"
                    ? SURVEY_SVGS
                    : p.category === "Location Data"
                      ? LOCATION_SVGS
                      : p.category === "Sensor Data"
                        ? SENSOR_SVGS
                        : OTHER_SVGS;
        const idx = getProjectIconIndex(p.id, svgPool.length);
        const SvgComp = svgPool[idx] as React.ComponentType<{ color: string }>;
        const rawSvg = renderToStaticMarkup(<SvgComp color="white" />);
        const iconSvg = rawSvg.replace(/^<svg/, '<svg width="26" height="26"');
        return {
          id: p.id,
          lat: p.location!.lat!,
          lng: p.location!.lng!,
          title: p.title,
          budget: p.budget,
          category: p.category,
          iconSvg,
        };
      });
  }, [tabProjects, showBestMatchesExtras, hasLocation]);

  const handleSelectPin = useCallback(
    (id: string) => {
      const project = tabProjects.find((p) => p.id === id);
      if (project) setSelectedProject(project);
    },
    [tabProjects],
  );

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 pt-2">
        {/* ── Left panel skeleton ── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4">
          {/* User info card skeleton */}
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-6">
              <div className="flex flex-col items-start gap-3">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-full shrink-0" />
                  <div className="flex flex-col gap-2 justify-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="w-full pt-2 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl mt-1" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </CardContent>
          </Card>

          {/* Balance card skeleton */}
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-6">
              <Skeleton className="h-3 w-32 mb-3" />
              <Skeleton className="h-7 w-24 mb-1.5" />
              <Skeleton className="h-3 w-36 mb-4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Quick Actions card skeleton */}
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-6">
              <Skeleton className="h-3 w-28 mb-4" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-3 flex-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ── Right panel skeleton ── */}
        <section className="flex-1 min-w-0 flex flex-col gap-4">
          <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-2">
            <CardHeader className="px-6 pt-4 pb-0">
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="py-0 px-0">
              {/* Tab + filter bar skeleton */}
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-7 w-32 rounded-md" />
              </div>

              {/* Project cards skeleton */}
              <div className="space-y-4 px-6 pb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-stretch gap-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4"
                  >
                    {/* Category icon */}
                    <Skeleton className="shrink-0 w-12 h-12 rounded-xl mt-0.5" />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex items-center gap-4 pt-1">
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="shrink-0 flex flex-col items-end justify-between gap-1 pl-1">
                      <Skeleton className="w-6 h-6 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 pt-2">
      {/* ── Left panel ── */}
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4">
        {/* User info card */}
        <Card className="dark:bg-gray-800/50 border-none shadow-sm ">
          <CardContent className="px-6">
            <div className="flex flex-col items-start gap-3">
              <div className="flex gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || ""} />
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
                    Collector
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

              {/* Upgrade Pro button */}
              {profile?.subscription_tier !== "pro" && (
                <div className="mt-1 w-full flex flex-col gap-2">
                  <Link
                    href="/dashboard/billing"
                    className="btn-gelatine w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 text-white hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Upgrade to Pro
                  </Link>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Get priority access to top projects, higher earning limits,
                    and verified badge.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance card */}
        <Card className="dark:bg-gray-800/50 border-none shadow-sm">
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
                ${(profile?.total_earnings ?? 0).toFixed(2)} total earned
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

        {/* Quick Actions card */}
        <Card className="dark:bg-gray-800/50 border-none shadow-sm">
          <CardContent className="px-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quick Actions
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  icon: LifeBuoy,
                  label: "Help Center",
                  href: "/help",
                },
                {
                  icon: BookOpen,
                  label: "Collector Guide",
                  href: "/docs/collector",
                },
                {
                  icon: MessageSquare,
                  label: "Contact Support",
                  href: "/support",
                },
                {
                  icon: Settings,
                  label: "Account Settings",
                  href: "/dashboard/settings",
                },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <Icon className={`w-4 h-4 shrink-0`} />
                  <span className="flex-1 font-medium">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* ── Right panel ── */}
      <section className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Location hint */}
        {!hasLocation && (
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700">
            <div className="absolute inset-0 opacity-10">
              <svg
                viewBox="0 0 512 512"
                className="absolute -right-8 -top-8 w-48 h-48 text-white fill-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path d="M468.329,358.972c-7.263-3.989-16.382-1.336-20.369,5.924c-3.989,7.261-1.337,16.381,5.924,20.369C471.752,395.081,482,405.963,482,415.121c0,11.201-15.87,28.561-60.413,43.694C377.582,473.767,318.775,482,256,482s-121.582-8.233-165.587-23.185C45.87,443.683,30,426.322,30,415.121c0-9.158,10.248-20.04,28.116-29.857c7.261-3.988,9.913-13.108,5.924-20.369c-3.989-7.26-13.106-9.913-20.369-5.924C23.749,369.916,0,388.542,0,415.121c0,20.374,14.012,49.422,80.762,72.1C127.794,503.2,190.028,512,256,512s128.206-8.8,175.238-24.779c66.75-22.678,80.762-51.726,80.762-72.1C512,388.542,488.251,369.916,468.329,358.972z" />
                  <path d="M142.752,437.13c30.45,8.602,70.669,13.34,113.248,13.34s82.798-4.737,113.248-13.34c37.253-10.523,56.142-25.757,56.142-45.275c0-19.519-18.889-34.751-56.142-45.274c-8.27-2.336-17.264-4.385-26.826-6.133c-5.193,8.972-10.634,18.207-16.323,27.708c10.584,1.588,20.521,3.535,29.545,5.834c27.416,6.983,37.432,14.844,39.491,17.866c-2.06,3.023-12.074,10.884-39.49,17.866c-25.949,6.609-59.335,10.379-94.498,10.716c-1.703,0.126-3.419,0.197-5.147,0.197c-1.729,0-3.444-0.071-5.148-0.197c-35.163-0.337-68.549-4.106-94.498-10.716c-27.416-6.982-37.431-14.844-39.49-17.866c2.059-3.022,12.075-10.883,39.491-17.866c9.024-2.298,18.961-4.246,29.546-5.834c-5.689-9.5-11.13-18.737-16.323-27.708c-9.562,1.749-18.557,3.797-26.826,6.133c-37.253,10.523-56.142,25.756-56.142,45.274C86.61,411.373,105.499,426.606,142.752,437.13z" />
                  <path d="M256,390.634c13.353,0,25.482-6.804,32.448-18.201c48.81-79.857,106.992-185.103,106.992-232.994C395.44,62.552,332.888,0,256,0S116.56,62.552,116.56,139.439c0,47.891,58.183,153.137,106.992,232.994C230.518,383.83,242.648,390.634,256,390.634z M199.953,129.865c0-30.903,25.143-56.045,56.047-56.045s56.047,25.142,56.047,56.045c0,30.904-25.143,56.046-56.047,56.046S199.953,160.77,199.953,129.865z" />
                </g>
              </svg>
            </div>
            <CardContent className="relative px-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 512 512"
                  className="w-8 h-8 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path d="M468.329,358.972c-7.263-3.989-16.382-1.336-20.369,5.924c-3.989,7.261-1.337,16.381,5.924,20.369C471.752,395.081,482,405.963,482,415.121c0,11.201-15.87,28.561-60.413,43.694C377.582,473.767,318.775,482,256,482s-121.582-8.233-165.587-23.185C45.87,443.683,30,426.322,30,415.121c0-9.158,10.248-20.04,28.116-29.857c7.261-3.988,9.913-13.108,5.924-20.369c-3.989-7.26-13.106-9.913-20.369-5.924C23.749,369.916,0,388.542,0,415.121c0,20.374,14.012,49.422,80.762,72.1C127.794,503.2,190.028,512,256,512s128.206-8.8,175.238-24.779c66.75-22.678,80.762-51.726,80.762-72.1C512,388.542,488.251,369.916,468.329,358.972z" />
                    <path d="M142.752,437.13c30.45,8.602,70.669,13.34,113.248,13.34s82.798-4.737,113.248-13.34c37.253-10.523,56.142-25.757,56.142-45.275c0-19.519-18.889-34.751-56.142-45.274c-8.27-2.336-17.264-4.385-26.826-6.133c-5.193,8.972-10.634,18.207-16.323,27.708c10.584,1.588,20.521,3.535,29.545,5.834c27.416,6.983,37.432,14.844,39.491,17.866c-2.06,3.023-12.074,10.884-39.49,17.866c-25.949,6.609-59.335,10.379-94.498,10.716c-1.703,0.126-3.419,0.197-5.147,0.197c-1.729,0-3.444-0.071-5.148-0.197c-35.163-0.337-68.549-4.106-94.498-10.716c-27.416-6.982-37.431-14.844-39.49-17.866c2.059-3.022,12.075-10.883,39.491-17.866c9.024-2.298,18.961-4.246,29.546-5.834c-5.689-9.5-11.13-18.737-16.323-27.708c-9.562,1.749-18.557,3.797-26.826,6.133c-37.253,10.523-56.142,25.756-56.142,45.274C86.61,411.373,105.499,426.606,142.752,437.13z" />
                    <path d="M256,390.634c13.353,0,25.482-6.804,32.448-18.201c48.81-79.857,106.992-185.103,106.992-232.994C395.44,62.552,332.888,0,256,0S116.56,62.552,116.56,139.439c0,47.891,58.183,153.137,106.992,232.994C230.518,383.83,242.648,390.634,256,390.634z M199.953,129.865c0-30.903,25.143-56.045,56.047-56.045s56.047,25.142,56.047,56.045c0,30.904-25.143,56.046-56.047,56.046S199.953,160.77,199.953,129.865z" />
                  </g>
                </svg>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-base font-semibold text-white leading-tight">
                  Set your location to see nearby projects
                </p>
                <p className="text-xs text-white/75 mt-0.5">
                  Add your address in profile settings to surface projects near
                  you.
                </p>
              </div>
              <Button
                size="sm"
                className="btn-gelatine shrink-0 text-xs h-8 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                onClick={() => router.push("/dashboard/settings")}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs + filter bar */}
        <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-2">
          <CardHeader className="px-6 pt-4 pb-0">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              Jobs for You
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 px-0">
            <div className="flex items-center justify-between px-6 py-3">
              {/* Tab buttons */}
              <div className="flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("best")}
                  className={`py-1 border-b-2 transition-colors font-medium ${
                    activeTab === "best"
                      ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Best Matches
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recent")}
                  className={`py-1 border-b-2 transition-colors font-medium ${
                    activeTab === "recent"
                      ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Recent Jobs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`py-1 border-b-2 transition-colors font-medium ${
                    activeTab === "saved"
                      ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Saved Jobs
                  {savedProjects.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                      {savedProjects.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter + View All */}
              <div className="flex items-center gap-2">
                {showBestMatchesExtras && hasLocation && (
                  <Select
                    value={String(maxDistance)}
                    onValueChange={(val) => setMaxDistance(Number(val))}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs bg-white dark:bg-gray-800 border dark:border-none shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border dark:border-none shadow-none">
                      {distanceOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-xs hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Best Matches: two-column layout (map left, jobs right) */}
            {showBestMatchesExtras && hasLocation ? (
              <div className="flex h-[calc(100vh-280px)] overflow-hidden">
                {/* Left: Map panel */}
                <div className="w-2/5 pl-6 pt-3">
                  <div className="rounded-xl overflow-hidden">
                    <LocationMapPreview
                      lat={collectorLat!}
                      lng={collectorLng!}
                      radiusKm={maxDistance > 0 ? maxDistance : 0}
                      jobPins={jobPins}
                      onSelectPin={handleSelectPin}
                    />
                  </div>
                </div>

                {/* Right: Jobs list panel */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="pl-4 py-3">
                      <ProjectList
                        projects={tabProjects}
                        activeTab={activeTab}
                        maxDistance={maxDistance}
                        proposalStatuses={proposalStatuses}
                        assignmentCounts={assignmentCounts}
                        savedProjectIds={savedProjectIds}
                        getRawDistanceKm={getRawDistanceKm}
                        onSelectProject={setSelectedProject}
                        onToggleSave={toggleSaveProject}
                        onSetMaxDistance={setMaxDistance}
                        onViewAll={() =>
                          router.push("/dashboard/projects/find")
                        }
                        formatDate={formatDate}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              /* Recent / Saved / Best without location: single column */
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="pl-6 pt-3">
                  <ProjectList
                    projects={tabProjects}
                    activeTab={activeTab}
                    maxDistance={maxDistance}
                    proposalStatuses={proposalStatuses}
                    assignmentCounts={assignmentCounts}
                    savedProjectIds={savedProjectIds}
                    getRawDistanceKm={getRawDistanceKm}
                    onSelectProject={setSelectedProject}
                    onToggleSave={toggleSaveProject}
                    onSetMaxDistance={setMaxDistance}
                    onViewAll={() => router.push("/dashboard/projects/find")}
                    formatDate={formatDate}
                  />
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </section>

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
          if (user) {
            getProposalsByCollector(user.id).then((res) => {
              if (res.data) {
                const map: Record<string, Proposal> = {};
                res.data.forEach((p) => {
                  map[p.request_id] = p;
                });
                setProposalStatuses(map);
              }
            });
          }
        }}
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      />
    </div>
  );
}
