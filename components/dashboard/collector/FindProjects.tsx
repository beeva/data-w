"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getOpenProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Search,
  FileText,
  Clock,
  Briefcase,
  Camera,
  Video,
  Mic,
  BarChart3,
  MapPinned,
  Cpu,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Bookmark,
  RefreshCw,
  SlidersHorizontal,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ProjectDetailsSheet from "./ProjectDetailsSheet";
import JobsTabsBar from "./JobsTabsBar";
import { cn, getCategoryColor } from "@/lib/utils";
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
  isSaved: boolean;
  onSelectProject: (project: Project) => void;
  onToggleSave: (id: string) => void;
  formatDate: (date: string | null) => string;
}

function ProjectCard({
  project,
  proposal,
  slotsFilled,
  isSaved,
  onSelectProject,
  onToggleSave,
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
            <span className="text-muted-foreground">Deadline:</span>
            <span className="font-medium text-muted-foreground">
              {formatDate(project.deadline)}
            </span>
          </span>
        </div>

        {/* Description */}
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

        {/* Meta chips */}
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

      {/* Right actions */}
      <div
        className="shrink-0 flex flex-col items-end justify-between gap-2 pl-1"
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

const categories = [
  "Photography",
  "Video",
  "Audio",
  "Text",
  "Survey",
  "Location Data",
  "Sensor Data",
  "Other",
];

const dataTypes = [
  "Images",
  "Videos",
  "Audio Files",
  "Documents",
  "GPS Data",
  "Sensor Readings",
  "Survey Responses",
];

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Photography: Camera,
  Video: Video,
  Audio: Mic,
  Text: FileText,
  Survey: BarChart3,
  "Location Data": MapPinned,
  "Sensor Data": Cpu,
  Other: MoreHorizontal,
};

interface CountrySelectProps {
  countries: string[];
  selected: string[];
  onToggle: (country: string) => void;
  onClear: () => void;
}

function CountrySelect({
  countries,
  selected,
  onToggle,
  onClear,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const label =
    selected.length === 0
      ? "All countries"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} countries`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 h-9 px-3 rounded-md border text-sm transition-colors",
          "bg-gray-50 dark:bg-gray-800/50 border-none text-foreground hover:bg-muted/80",
          open && "border-cyan-500 ring-1 ring-cyan-500/30",
        )}
      >
        <span
          className={cn(
            "truncate",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border dark:border-gray-700 bg-gray-50 dark:bg-[#111827] shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-7 pr-2 h-7 text-xs bg-gray-100 dark:bg-[#111827] rounded border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No results
              </p>
            ) : (
              filtered.map((country) => {
                const isSelected = selected.includes(country);
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => onToggle(country)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="btn-gelatine shrink-0 bg-transparent border-border dark:border-gray-700 dark:bg-transparent data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 dark:data-[state=checked]:border-cyan-500 pointer-events-none"
                    />
                    <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{country}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FindProjects() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<
    Record<string, Proposal>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 100000,
  });
  const [sortBy, setSortBy] = useState<
    "newest" | "budget_high" | "budget_low" | "deadline"
  >("newest");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"best" | "recent" | "saved">(
    "best",
  );
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    dataTypes: true,
    budget: true,
  });

  const userId = user?.id;
  const collectorLat = profile?.location?.lat;
  const collectorLng = profile?.location?.lng;
  const hasLocation =
    typeof collectorLat === "number" && typeof collectorLng === "number";

  const getRawDistanceKm = (project: Project): number | null => {
    if (!hasLocation) return null;
    const pLat = project.location?.lat;
    const pLng = project.location?.lng;
    if (typeof pLat !== "number" || typeof pLng !== "number") return null;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(pLat - collectorLat!);
    const dLng = toRad(pLng - collectorLng!);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(collectorLat!)) *
        Math.cos(toRad(pLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      const allProjects = projectsResult.data || [];
      setProjects(allProjects);
      setFilteredProjects(allProjects);

      if (proposalsResult.data && userId) {
        const statusMap: Record<string, Proposal> = {};
        proposalsResult.data.forEach((proposal) => {
          statusMap[proposal.request_id] = proposal;
        });
        setProposalStatuses(statusMap);
      }

      if (allProjects.length > 0) {
        const { data: counts } = await getAssignmentCountsByProjects(
          allProjects.map((p) => p.id),
        );
        setAssignmentCounts(counts || {});
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);
      console.error("Error fetching projects:", err);
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
      .channel(`proposals-collector-${userId}`)
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

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleDataType = (type: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country],
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedDataTypes([]);
    setSelectedCountries([]);
    setBudgetRange({ min: 0, max: 100000 });
    setSearchTerm("");
    setShowSavedOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedDataTypes.length > 0 ||
    selectedCountries.length > 0 ||
    searchTerm.length > 0 ||
    budgetRange.min > 0 ||
    budgetRange.max < 100000 ||
    showSavedOnly;

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

  const tabProjects = useMemo(() => {
    const nonAccepted = projects.filter((project) => {
      const proposal = proposalStatuses[project.id];
      return !(proposal && proposal.status === "accepted");
    });

    if (activeTab === "saved") {
      return savedProjects;
    }

    if (activeTab === "recent") {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return nonAccepted
        .filter(
          (project) => new Date(project.created_at).getTime() >= twoWeeksAgo,
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }

    const best = nonAccepted.filter((project) => {
      if (!hasLocation || maxDistance === 0) return true;
      const dist = getRawDistanceKm(project);
      return dist !== null && dist <= maxDistance;
    });

    if (!hasLocation) {
      return best.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return best.sort((a, b) => {
      const aDist = getRawDistanceKm(a) ?? Number.POSITIVE_INFINITY;
      const bDist = getRawDistanceKm(b) ?? Number.POSITIVE_INFINITY;
      return aDist - bDist;
    });
  }, [
    projects,
    proposalStatuses,
    activeTab,
    hasLocation,
    maxDistance,
    savedProjects,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / itemsPerPage),
  );
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const availableCountries = Array.from(
    new Set(
      tabProjects
        .map((p) => {
          const addr = p.location?.address;
          if (!addr) return null;
          const parts = addr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          return parts.length >= 2 ? parts[parts.length - 1] : null;
        })
        .filter((c): c is string => c !== null),
    ),
  ).sort();

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tabProjects.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [tabProjects]);

  const dataTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tabProjects.forEach((p) => {
      p.requirements.data_types.forEach((type) => {
        dataTypes.forEach((dt) => {
          if (type.toLowerCase().includes(dt.toLowerCase())) {
            counts[dt] = (counts[dt] || 0) + 1;
          }
        });
      });
    });
    return counts;
  }, [tabProjects]);

  useEffect(() => {
    let filtered = [...tabProjects];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category),
      );
    }

    if (selectedDataTypes.length > 0) {
      filtered = filtered.filter((p) =>
        p.requirements.data_types.some((type) =>
          selectedDataTypes.some((selected) =>
            type.toLowerCase().includes(selected.toLowerCase()),
          ),
        ),
      );
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter((p) => {
        const addr = p.location?.address;
        if (!addr) return false;
        const parts = addr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const country = parts.length >= 2 ? parts[parts.length - 1] : null;
        return country !== null && selectedCountries.includes(country);
      });
    }

    filtered = filtered.filter(
      (p) => p.budget >= budgetRange.min && p.budget <= budgetRange.max,
    );

    if (showSavedOnly) {
      filtered = filtered.filter((p) => savedProjectIds.includes(p.id));
    }

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
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedCategories,
    selectedDataTypes,
    selectedCountries,
    budgetRange,
    sortBy,
    tabProjects,
    showSavedOnly,
    savedProjectIds,
    itemsPerPage,
  ]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-2 animate-pulse">
        {/* Page header */}
        <div className="mb-6">
          <div className="h-8 w-44 bg-gray-200 dark:bg-gray-700 rounded-md mb-2" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded-md" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-6">
              <CardHeader className="px-6 pb-0">
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardHeader>
              <CardContent className="px-6 space-y-5">
                {/* Category */}
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
                      <div
                        className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
                        style={{ width: `${60 + (i % 3) * 18}px` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-border dark:border-gray-700" />

                {/* Data Types */}
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
                      <div
                        className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
                        style={{ width: `${70 + (i % 3) * 15}px` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-border dark:border-gray-700" />

                {/* Country */}
                <div className="space-y-2">
                  <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
                </div>

                <div className="border-t border-border dark:border-gray-700" />

                {/* Budget */}
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    <div className="h-9 flex-1 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

            {/* Project list card */}
            <Card className="dark:bg-gray-800/50 border-none shadow-sm">
              <CardHeader className="px-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    <div className="h-10 w-44 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-0 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-stretch gap-4 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    {/* Category icon */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mt-0.5" />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="flex gap-2 pt-1">
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="shrink-0 flex flex-col items-end gap-2 pl-1">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    );
  }

  const selectedProposal = selectedProject
    ? proposalStatuses[selectedProject.id] || null
    : null;
  const selectedSlotsFilled = selectedProject
    ? (assignmentCounts[selectedProject.id] || 0) >=
      (selectedProject.max_collectors || 1)
    : false;

  const availableCount = filteredProjects.filter(
    (p) => (assignmentCounts[p.id] || 0) < p.max_collectors,
  ).length;

  return (
    <div className="min-h-screen pt-2">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find Projects</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse available data collection projects from requesters and start
          earning
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Filter sidebar ── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0">
          <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-6">
            <CardHeader className="px-6 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 h-auto py-0.5 px-0 hover:bg-transparent hover:underline"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-6 space-y-5">
              {/* Category Filter */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      category: !prev.category,
                    }))
                  }
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
                >
                  <span>Category</span>
                  {expandedSections.category ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {expandedSections.category && (
                  <div className="space-y-1.5">
                    {categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                      const isSelected = selectedCategories.includes(cat);
                      const count = categoryCounts[cat] || 0;
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <Checkbox
                            id={`cat-${cat}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleCategory(cat)}
                            className="btn-gelatine border-border dark:border-gray-700 dark:bg-transparent dark:data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                          />
                          <label
                            htmlFor={`cat-${cat}`}
                            className={cn(
                              "text-sm cursor-pointer flex items-center gap-2 flex-1",
                              isSelected
                                ? "text-cyan-600 dark:text-cyan-400 font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1">{cat}</span>
                            {count > 0 && (
                              <span
                                className={cn(
                                  "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums",
                                  isSelected
                                    ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-muted-foreground",
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border dark:border-gray-700" />

              {/* Data Types Filter */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      dataTypes: !prev.dataTypes,
                    }))
                  }
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
                >
                  <span>Data Types</span>
                  {expandedSections.dataTypes ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {expandedSections.dataTypes && (
                  <div className="space-y-1.5">
                    {dataTypes.map((type) => {
                      const isSelected = selectedDataTypes.includes(type);
                      const count = dataTypeCounts[type] || 0;
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleDataType(type)}
                            className="btn-gelatine border-border dark:border-gray-700 dark:bg-transparent dark:data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className={cn(
                              "text-sm cursor-pointer flex items-center flex-1",
                              isSelected
                                ? "text-cyan-600 dark:text-cyan-400 font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <span className="flex-1">{type}</span>
                            {count > 0 && (
                              <span
                                className={cn(
                                  "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums",
                                  isSelected
                                    ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-muted-foreground",
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border dark:border-gray-700" />

              {/* Country Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Country
                </label>
                {availableCountries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No location data available
                  </p>
                ) : (
                  <CountrySelect
                    countries={availableCountries}
                    selected={selectedCountries}
                    onToggle={toggleCountry}
                    onClear={() => setSelectedCountries([])}
                  />
                )}
              </div>

              <div className="border-t border-border dark:border-gray-700" />

              {/* Budget Range */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      budget: !prev.budget,
                    }))
                  }
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
                >
                  <span>Budget Range</span>
                  {expandedSections.budget ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {expandedSections.budget && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={budgetRange.min || ""}
                        onChange={(e) =>
                          setBudgetRange((prev) => ({
                            ...prev,
                            min: Number(e.target.value) || 0,
                          }))
                        }
                        className="h-9 text-sm border-none text-foreground bg-gray-50 dark:bg-gray-800/50 rounded-md"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={
                          budgetRange.max === 100000 ? "" : budgetRange.max
                        }
                        onChange={(e) =>
                          setBudgetRange((prev) => ({
                            ...prev,
                            max: Number(e.target.value) || 100000,
                          }))
                        }
                        className="h-9 text-sm border-none text-foreground bg-gray-50 dark:bg-gray-800/50 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ── Right: Main section ── */}
        <section className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                      Available
                    </p>
                    <p className="text-2xl font-bold">{availableCount}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {filteredProjects.length} total open
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-green-500" />
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
                      {filteredProjects
                        .filter(
                          (p) =>
                            (assignmentCounts[p.id] || 0) < p.max_collectors,
                        )
                        .reduce((sum, p) => sum + p.budget, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      across available projects
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
                      {filteredProjects.reduce(
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
                      {filteredProjects.reduce(
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
              <div className="space-y-3">
                <JobsTabsBar
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  savedCount={savedProjects.length}
                  showDistanceSelect={activeTab === "best" && hasLocation}
                  maxDistance={maxDistance}
                  onChangeDistance={setMaxDistance}
                />

                <div className="flex items-center justify-between gap-6">
                  <span className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? `${filteredProjects.length} result${filteredProjects.length !== 1 ? "s" : ""} found`
                      : `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`}
                  </span>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-gray-50 dark:bg-gray-800/50 border-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab !== "saved" && (
                      <button
                        onClick={() => setShowSavedOnly((prev) => !prev)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-10 px-3 rounded-md text-sm font-medium transition-colors",
                          showSavedOnly
                            ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                            : "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
                        )}
                      >
                        <Bookmark
                          className={cn(
                            "w-4 h-4",
                            showSavedOnly && "fill-current",
                          )}
                        />
                        Saved Jobs
                        {savedProjectIds.length > 0 && (
                          <span
                            className={cn(
                              "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              showSavedOnly
                                ? "bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200"
                                : "bg-gray-200 dark:bg-gray-700 text-muted-foreground",
                            )}
                          >
                            {savedProjectIds.length}
                          </span>
                        )}
                      </button>
                    )}
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as typeof sortBy)}
                    >
                      <SelectTrigger className="!h-10 w-44 text-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border-none text-foreground">
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
                </div>
              </div>
            </CardHeader>

            {hasActiveFilters && (
              <div className="px-6 pb-3 flex flex-wrap items-center gap-4">
                {showSavedOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 text-sm text-cyan-700 dark:text-cyan-300">
                    <Bookmark className="w-3 h-3 fill-current" />
                    Saved jobs
                    <button
                      onClick={() => setShowSavedOnly(false)}
                      className="ml-1 text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-foreground">
                    &ldquo;{searchTerm}&rdquo;
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 text-sm text-cyan-700 dark:text-cyan-300"
                  >
                    {cat}
                    <button
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          prev.filter((c) => c !== cat),
                        )
                      }
                      className="ml-1 text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedDataTypes.map((dt) => (
                  <span
                    key={dt}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm text-purple-700 dark:text-purple-300"
                  >
                    {dt}
                    <button
                      onClick={() =>
                        setSelectedDataTypes((prev) =>
                          prev.filter((d) => d !== dt),
                        )
                      }
                      className="ml-1 text-purple-500 hover:text-purple-700 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-700 dark:text-blue-300"
                  >
                    {country}
                    <button
                      onClick={() =>
                        setSelectedCountries((prev) =>
                          prev.filter((c) => c !== country),
                        )
                      }
                      className="ml-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(budgetRange.min > 0 || budgetRange.max < 100000) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-300">
                    {budgetRange.min > 0 && budgetRange.max < 100000
                      ? `$${budgetRange.min.toLocaleString()} – $${budgetRange.max.toLocaleString()}`
                      : budgetRange.min > 0
                        ? `>$${budgetRange.min.toLocaleString()}`
                        : `<$${budgetRange.max.toLocaleString()}`}
                    <button
                      onClick={() => setBudgetRange({ min: 0, max: 100000 })}
                      className="ml-1 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}

            <CardContent className="px-6 pt-0">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="text-base font-semibold mb-1 text-foreground">
                    No projects found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your search or filters"
                      : "No open projects available at the moment"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-2 text-cyan-600 dark:text-cyan-400"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedProjects.map((project) => {
                    const proposal = proposalStatuses[project.id];
                    const slotsFilled =
                      (assignmentCounts[project.id] || 0) >=
                      (project.max_collectors || 1);

                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        proposal={proposal}
                        slotsFilled={slotsFilled}
                        isSaved={savedProjectIds.includes(project.id)}
                        onSelectProject={setSelectedProject}
                        onToggleSave={toggleSaveProject}
                        formatDate={formatDate}
                      />
                    );
                  })}

                  {filteredProjects.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Left: info + per-page select */}
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
                              {filteredProjects.length} project
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

                      {/* Right: page navigation */}
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
                            .reduce<(number | "...")[]>(
                              (acc, page, idx, arr) => {
                                if (
                                  idx > 0 &&
                                  page - (arr[idx - 1] as number) > 1
                                ) {
                                  acc.push("...");
                                }
                                acc.push(page);
                                return acc;
                              },
                              [],
                            )
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

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

      {/* Scroll to top */}
      {showScrollTop && itemsPerPage >= 25 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-700 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
