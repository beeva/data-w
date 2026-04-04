"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "./Header";
import { getOpenProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import ProjectDetailsSheet from "./dashboard/collector/ProjectDetailsSheet";
import { useAuth } from "@/contexts/AuthContext";
import CTASceneCanvas from "./CTASceneCanvas";
import { JOB_CATEGORIES } from "@/lib/categories";
import {
  Users,
  MapPin,
  Clock,
  Search,
  FolderKanban,
  ArrowRight,
  Camera,
  Video,
  Mic,
  FileText,
  BarChart3,
  MapPinned,
  Cpu,
  MoreHorizontal,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  SlidersHorizontal,
  AlertCircle,
  LogIn,
  ArrowUpToLine,
  Bookmark,
} from "lucide-react";
import PageHero from "./PageHero";
import { JobsListWindow } from "./JobsListWindow";
import Footer from "./Footer";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import JobsTabsBar from "@/components/shared/JobsTabsBar";
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

const CATEGORY_SVG_POOLS: Record<
  string,
  readonly React.ComponentType<{ color: string }>[]
> = {
  Photography: PHOTOGRAPHY_SVGS,
  Video: VIDEO_SVGS,
  Audio: AUDIO_SVGS,
  Text: TEXT_SVGS,
  Survey: SURVEY_SVGS,
  "Location Data": LOCATION_SVGS,
  "Sensor Data": SENSOR_SVGS,
  Other: OTHER_SVGS,
};

function getProjectIconIndex(projectId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

const CATEGORY_META: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    bg: string;
  }
> = {
  Photography: { icon: Camera, accent: "#10b981", bg: "bg-emerald-500/10" },
  Video: { icon: Video, accent: "#0ea5e9", bg: "bg-sky-500/10" },
  Audio: { icon: Mic, accent: "#a855f7", bg: "bg-purple-500/10" },
  Text: { icon: FileText, accent: "#f59e0b", bg: "bg-amber-500/10" },
  Survey: { icon: BarChart3, accent: "#22c55e", bg: "bg-green-500/10" },
  "Location Data": { icon: MapPinned, accent: "#14b8a6", bg: "bg-teal-500/10" },
  "Sensor Data": { icon: Cpu, accent: "#f97316", bg: "bg-orange-500/10" },
  Other: { icon: MoreHorizontal, accent: "#06b6d4", bg: "bg-cyan-500/10" },
};

const DEFAULT_CATEGORY_META = CATEGORY_META["Other"];

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

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

function getCategoryIconNode(
  projectId: string,
  category: string,
  wrapperClassName: string,
): React.ReactNode {
  const catMeta = CATEGORY_META[category] || DEFAULT_CATEGORY_META;
  const svgPool = CATEGORY_SVG_POOLS[category];
  if (svgPool) {
    const idx = getProjectIconIndex(projectId, svgPool.length);
    const SvgComp = svgPool[idx];
    return (
      <span
        className={cn("flex items-center justify-center", wrapperClassName)}
      >
        <SvgComp color={catMeta.accent} />
      </span>
    );
  }
  const Icon = catMeta.icon;
  return <Icon className={wrapperClassName} />;
}

interface ProjectCardProps {
  project: Project;
  formatDate: (date: string | null) => string;
  getDaysLeft: (deadline: string | null) => number | null;
  onApplyClick: (project: Project) => void;
  distance?: string | null;
  isSaved?: boolean;
  onToggleSave?: (projectId: string) => void;
}

function ProjectCard({
  project,
  formatDate,
  getDaysLeft,
  onApplyClick,
  distance,
  isSaved = false,
  onToggleSave,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const catMeta = CATEGORY_META[project.category] || DEFAULT_CATEGORY_META;
  const categoryIcon = getCategoryIconNode(
    project.id,
    project.category,
    "w-8 h-8",
  );
  const daysLeft = getDaysLeft(project.deadline);
  const isUrgent = daysLeft !== null && daysLeft <= 3;

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [project.description]);

  return (
    <div
      className="group relative flex items-stretch gap-4 rounded-xl border border-white/10 bg-white/5 dark:bg-gray-800/50 hover:border-cyan-500/50 hover:bg-white/[0.07] dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all cursor-pointer p-4"
      onClick={() => onApplyClick(project)}
    >
      {onToggleSave && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(project.id);
            }}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-white/60 hover:text-cyan-300 hover:bg-white/10 transition-colors"
            title={isSaved ? "Remove from saved jobs" : "Save this job"}
            aria-label={isSaved ? "Remove from saved jobs" : "Save this job"}
          >
            <Bookmark
              className="w-4 h-4"
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
        </div>
      )}
      <div
        className={cn(
          "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5",
          catMeta.bg,
        )}
        style={{ color: catMeta.accent }}
      >
        {categoryIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
            {project.title}
          </h3>
          {isUrgent && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Urgent
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-white/50">Price:</span>
            <span className="font-semibold text-emerald-400">
              ${project.budget.toLocaleString()}
            </span>
          </span>
          <span className="text-white/30 text-xs">·</span>
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-white/50">Deadline:</span>
            <span className="font-medium text-white/70">
              {formatDate(project.deadline)}
            </span>
          </span>
        </div>

        <div className="mb-3">
          <p
            ref={descRef}
            className={cn(
              "text-sm text-white/60 leading-relaxed",
              expanded ? "" : "line-clamp-3",
            )}
          >
            {project.description}
          </p>
          {(clamped || expanded) && (
            <button
              type="button"
              className="text-sm text-cyan-400 underline underline-offset-2 mt-0.5 hover:text-cyan-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "less" : "more"}
            </button>
          )}
        </div>

        {project.requirements?.data_types?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.requirements.data_types.slice(0, 3).map((type, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs px-2.5 py-1 border-cyan-400/30 text-cyan-300/80 bg-transparent rounded-full"
              >
                {type}
              </Badge>
            ))}
            {project.requirements.data_types.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-1 border-cyan-400/30 text-cyan-300/80 bg-transparent rounded-full"
              >
                +{project.requirements.data_types.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md",
              catMeta.bg,
            )}
            style={{ color: catMeta.accent }}
          >
            {catMeta.icon && (
              <span className="scale-75 origin-center">
                {(() => {
                  const Icon = catMeta.icon;
                  return <Icon className="w-4 h-4 shrink-0" />;
                })()}
              </span>
            )}
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-white/50">
            <Users className="w-3.5 h-3.5" />
            {project.max_collectors} collector
            {project.max_collectors !== 1 ? "s" : ""}
          </span>
          {project.location?.address ? (
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
                <span className="inline-flex items-center gap-1 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  {distance && <span className="font-medium">({distance})</span>}
                </span>
              );
            })()
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-white/50">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              Remote
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  const skeletonClass = "bg-white/10 dark:bg-white/10";
  return (
    <div className="flex items-stretch gap-4 rounded-xl border border-white/10 bg-white/5 dark:bg-white/5 p-4">
      <Skeleton
        className={cn("shrink-0 w-12 h-12 rounded-xl", skeletonClass)}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton
            className={cn("h-4 w-2/3 max-w-[200px] rounded", skeletonClass)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className={cn("h-3 w-20 rounded", skeletonClass)} />
          <Skeleton className={cn("h-3 w-24 rounded", skeletonClass)} />
        </div>
        <div className="space-y-1.5">
          <Skeleton className={cn("h-3 w-full rounded", skeletonClass)} />
          <Skeleton className={cn("h-3 w-full rounded", skeletonClass)} />
          <Skeleton className={cn("h-3 w-4/5 rounded", skeletonClass)} />
        </div>
        <div className="flex flex-wrap gap-1">
          <Skeleton className={cn("h-5 w-16 rounded-full", skeletonClass)} />
          <Skeleton className={cn("h-5 w-20 rounded-full", skeletonClass)} />
          <Skeleton className={cn("h-5 w-14 rounded-full", skeletonClass)} />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Skeleton className={cn("h-5 w-20 rounded-md", skeletonClass)} />
          <Skeleton className={cn("h-3 w-24 rounded", skeletonClass)} />
          <Skeleton className={cn("h-3 w-16 rounded", skeletonClass)} />
        </div>
      </div>
    </div>
  );
}

const categories = JOB_CATEGORIES;

const dataTypes = [
  "Images",
  "Videos",
  "Audio Files",
  "Documents",
  "GPS Data",
  "Sensor Readings",
  "Survey Responses",
];

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
          "bg-white/5 dark:bg-gray-800/50 border-white/10 text-white hover:bg-white/10 placeholder-white/40",
          open && "border-cyan-500 ring-1 ring-cyan-500/30",
        )}
      >
        <span
          className={cn("truncate", selected.length === 0 && "text-white/50")}
        >
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-white/40 transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-white/10 bg-[#0B1020] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-7 pr-2 h-7 text-xs bg-white/5 rounded border-none outline-none text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-3">
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
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-white/80 hover:bg-white/5",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="shrink-0 bg-transparent border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 pointer-events-none"
                    />
                    <MapPin className="w-3 h-3 shrink-0 text-white/50" />
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

export default function Projects() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showApplicationSuccessDialog, setShowApplicationSuccessDialog] =
    useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "best" | "recent" | "saved">(
    "all",
  );
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [guestCoords, setGuestCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  // Filter states — init category from URL when landing from landing page
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (
      categoryFromUrl &&
      (JOB_CATEGORIES as readonly string[]).includes(categoryFromUrl)
    ) {
      return [categoryFromUrl];
    }
    return [];
  });
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 100000,
  });
  const [sortBy, setSortBy] = useState<
    "newest" | "budget_high" | "budget_low" | "deadline"
  >("newest");
  const collectorLat = profile?.location?.lat ?? guestCoords?.lat;
  const collectorLng = profile?.location?.lng ?? guestCoords?.lng;
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

  // Expand/collapse filter sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    dataTypes: true,
    budget: true,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await getOpenProjects();
        if (fetchError) throw fetchError;
        setProjects(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setSavedProjectIds([]);
      return;
    }
    const savedKey = `projects-saved-jobs-${user.id}`;
    const saved = localStorage.getItem(savedKey);
    if (!saved) {
      setSavedProjectIds([]);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSavedProjectIds(parsed.filter((id): id is string => typeof id === "string"));
      } else {
        setSavedProjectIds([]);
      }
    } catch {
      setSavedProjectIds([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const savedKey = `projects-saved-jobs-${user.id}`;
    localStorage.setItem(savedKey, JSON.stringify(savedProjectIds));
  }, [savedProjectIds, user?.id]);

  // Approximate location from IP when profile has no coordinates (guest or logged-in).
  useEffect(() => {
    if (
      typeof profile?.location?.lat === "number" &&
      typeof profile?.location?.lng === "number"
    ) {
      return;
    }

    let cancelled = false;

    const resolveGuestLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = (await res.json()) as {
          latitude?: number;
          longitude?: number;
        };
        if (
          !cancelled &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number"
        ) {
          setGuestCoords({ lat: data.latitude, lng: data.longitude });
        }
      } catch {
        // Ignore errors and keep non-location fallback behavior.
      }
    };

    resolveGuestLocation();
    return () => {
      cancelled = true;
    };
  }, [profile?.location?.lat, profile?.location?.lng]);

  useEffect(() => {
    if (!user?.id && activeTab === "saved") {
      setActiveTab("best");
    }
  }, [user?.id, activeTab]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [
    searchQuery,
    selectedCategories,
    selectedDataTypes,
    selectedCountries,
    budgetRange.min,
    budgetRange.max,
    sortBy,
    activeTab,
    maxDistance,
  ]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabProjects = useMemo(() => {
    const savedSet = new Set(savedProjectIds);
    if (activeTab === "all") {
      return projects;
    }
    if (activeTab === "saved") {
      return projects
        .filter((p) => savedSet.has(p.id))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
    if (activeTab === "recent") {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return [...projects].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ).filter((project) => new Date(project.created_at).getTime() >= twoWeeksAgo);
    }

    if (!hasLocation) {
      return projects;
    }

    return projects
      .filter((p) => {
        if (maxDistance === 0) return true;
        const dist = getRawDistanceKm(p);
        return dist !== null && dist <= maxDistance;
      })
      .sort((a, b) => {
        const aDist = getRawDistanceKm(a) ?? Number.POSITIVE_INFINITY;
        const bDist = getRawDistanceKm(b) ?? Number.POSITIVE_INFINITY;
        return aDist - bDist;
      });
  }, [projects, activeTab, savedProjectIds, hasLocation, maxDistance]);
  const showBestMatchesExtras = activeTab === "best";

  const availableCountries = useMemo(
    () =>
      Array.from(
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
      ).sort(),
    [tabProjects],
  );

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
      p.requirements?.data_types?.forEach((type) => {
        dataTypes.forEach((dt) => {
          if (type.toLowerCase().includes(dt.toLowerCase())) {
            counts[dt] = (counts[dt] || 0) + 1;
          }
        });
      });
    });
    return counts;
  }, [tabProjects]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleDataType = (dataType: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(dataType)
        ? prev.filter((d) => d !== dataType)
        : [...prev, dataType],
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country],
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedDataTypes([]);
    setSelectedCountries([]);
    setBudgetRange({ min: 0, max: 100000 });
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedDataTypes.length > 0 ||
    selectedCountries.length > 0 ||
    searchQuery.length > 0 ||
    budgetRange.min > 0 ||
    budgetRange.max < 100000;

  const activeFiltersCount =
    selectedCategories.length +
    selectedDataTypes.length +
    selectedCountries.length +
    (budgetRange.min > 0 || budgetRange.max < 100000 ? 1 : 0) +
    (searchQuery.length > 0 ? 1 : 0);

  const filteredProjects = tabProjects
    .filter((project) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(project.category);

      // Data types filter
      const matchesDataTypes =
        selectedDataTypes.length === 0 ||
        (project.requirements?.data_types &&
          project.requirements.data_types.some((type) =>
            selectedDataTypes.some((selected) =>
              type.toLowerCase().includes(selected.toLowerCase()),
            ),
          ));

      // Budget filter
      const matchesBudget =
        project.budget >= budgetRange.min && project.budget <= budgetRange.max;

      // Country filter
      const matchesCountry =
        selectedCountries.length === 0 ||
        (() => {
          const addr = project.location?.address;
          if (!addr) return false;
          const parts = addr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const country = parts.length >= 2 ? parts[parts.length - 1] : null;
          return country !== null && selectedCountries.includes(country);
        })();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDataTypes &&
        matchesBudget &&
        matchesCountry
      );
    })
    .sort((a, b) => {
      if (activeTab === "best" && hasLocation) {
        const aDist = getRawDistanceKm(a) ?? Number.POSITIVE_INFINITY;
        const bDist = getRawDistanceKm(b) ?? Number.POSITIVE_INFINITY;
        return aDist - bDist;
      }
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

  const jobPins = useMemo<MapJobPin[]>(() => {
    if (!showBestMatchesExtras || !hasLocation) return [];
    return filteredProjects
      .filter(
        (p) =>
          typeof p.location?.lat === "number" && typeof p.location?.lng === "number",
      )
      .map((p) => ({
        id: p.id,
        lat: p.location!.lat!,
        lng: p.location!.lng!,
        title: p.title,
        budget: p.budget,
        category: p.category,
        iconSvg: renderToStaticMarkup(
          <div className="w-5 h-5 flex items-center justify-center">
            {getCategoryIconNode(p.id, p.category, "w-4 h-4")}
          </div>,
        ),
      }));
  }, [filteredProjects, showBestMatchesExtras, hasLocation]);

  const toggleSaveProject = (projectId: string) => {
    setSavedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const displayLimit = user ? visibleCount : 10;
  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, displayLimit),
    [filteredProjects, displayLimit],
  );
  const hasMoreJobs = filteredProjects.length > displayLimit;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays;
  };

  const handleApplyClick = (project: Project) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const FilterSidebar = () => (
    <Card className="bg-white/5 dark:bg-gray-800/50 border-white/10 border shadow-sm pt-6">
      <CardHeader className="px-6 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-cyan-400 hover:text-cyan-300 h-auto py-0.5 px-0 hover:underline"
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
            className="flex items-center justify-between w-full text-xs font-semibold text-white/70 uppercase tracking-wide mb-2"
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
                      className="btn-gelatine border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <label
                      htmlFor={`cat-${cat}`}
                      className={cn(
                        "text-sm cursor-pointer flex items-center gap-2 flex-1",
                        isSelected
                          ? "text-cyan-400 font-medium"
                          : "text-white/70 hover:text-cyan-400",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">{cat}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums",
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-white/10 text-white/50",
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

        <div className="border-t border-white/10" />

        {/* Data Types Filter */}
        <div>
          <button
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                dataTypes: !prev.dataTypes,
              }))
            }
            className="flex items-center justify-between w-full text-xs font-semibold text-white/70 uppercase tracking-wide mb-2"
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
                      className="btn-gelatine border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className={cn(
                        "text-sm cursor-pointer flex items-center flex-1",
                        isSelected
                          ? "text-cyan-400 font-medium"
                          : "text-white/70 hover:text-cyan-400",
                      )}
                    >
                      <span className="flex-1">{type}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums",
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-white/10 text-white/50",
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

        <div className="border-t border-white/10" />

        {/* Country Filter */}
        <div>
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2 block">
            Country
          </label>
          {availableCountries.length === 0 ? (
            <p className="text-xs text-white/50 italic">
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

        <div className="border-t border-white/10" />

        {/* Budget Range */}
        <div>
          <button
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                budget: !prev.budget,
              }))
            }
            className="flex items-center justify-between w-full text-xs font-semibold text-white/70 uppercase tracking-wide mb-2"
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
                  className="h-9 text-sm border-white/10 text-white bg-white/5 placeholder:text-white/40 rounded-md"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={budgetRange.max === 100000 ? "" : budgetRange.max}
                  onChange={(e) =>
                    setBudgetRange((prev) => ({
                      ...prev,
                      max: Number(e.target.value) || 100000,
                    }))
                  }
                  className="h-9 text-sm border-white/10 text-white bg-white/5 placeholder:text-white/40 rounded-md"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />

      <PageHero
        title="Find Projects"
        subtitle="and Start Earning"
        description={`Browse ${projects.length} open data collection projects and contribute quality data`}
        rightContent={<JobsListWindow />}
      >
        <div className="flex flex-col md:flex-row gap-3 w-full pt-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for projects by title, description, or keywords..."
              className="w-full px-4 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <Button
            className="md:hidden bg-white/10 border border-white/20 text-white"
            onClick={() => setShowMobileFilters(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </PageHero>

      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {/* Sidebar Filters - Desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </div>

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
              <div className="fixed inset-0 bg-black/80 z-50 lg:hidden">
                <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0B1020] p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <FilterSidebar />
                </div>
              </div>
            )}

            {/* Projects List */}
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <JobsTabsBar
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  savedCount={savedProjectIds.length}
                  showAllTab
                  showSavedTab={!!user}
                  showDistanceSelect={activeTab === "best" && hasLocation}
                  maxDistance={maxDistance}
                  onChangeDistance={setMaxDistance}
                  variant="projects"
                />
              </div>

              {/* Sort and Results Count (All Jobs only) */}
              {activeTab === "all" && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/60 text-sm">
                    {hasActiveFilters
                      ? `${filteredProjects.length} result${filteredProjects.length !== 1 ? "s" : ""} found`
                      : `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`}
                  </p>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as typeof sortBy)}
                  >
                    <SelectTrigger className="!h-10 w-44 text-sm bg-[#0f172a] border border-white/10 rounded-lg text-white hover:bg-[#0f172a] focus:border-cyan-500 focus:ring-cyan-500/20">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] text-white border-white/10 dark:border-white/10">
                      <SelectItem
                        value="newest"
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        Newest First
                      </SelectItem>
                      <SelectItem
                        value="budget_high"
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        Budget: High → Low
                      </SelectItem>
                      <SelectItem
                        value="budget_low"
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        Budget: Low → High
                      </SelectItem>
                      <SelectItem
                        value="deadline"
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        Deadline: Soonest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                      &ldquo;{searchQuery}&rdquo;
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="ml-1 text-white/60 hover:text-white"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategories((prev) =>
                            prev.filter((c) => c !== cat),
                          )
                        }
                        className="ml-1 text-cyan-400 hover:text-cyan-200"
                        aria-label={`Remove ${cat} filter`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedDataTypes.map((dt) => (
                    <span
                      key={dt}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
                    >
                      {dt}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDataTypes((prev) =>
                            prev.filter((d) => d !== dt),
                          )
                        }
                        className="ml-1 text-purple-400 hover:text-purple-200"
                        aria-label={`Remove ${dt} filter`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedCountries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
                    >
                      {country}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCountries((prev) =>
                            prev.filter((c) => c !== country),
                          )
                        }
                        className="ml-1 text-blue-400 hover:text-blue-200"
                        aria-label={`Remove ${country} filter`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(budgetRange.min > 0 || budgetRange.max < 100000) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                      {budgetRange.min > 0 && budgetRange.max < 100000
                        ? `$${budgetRange.min.toLocaleString()} – $${budgetRange.max.toLocaleString()}`
                        : budgetRange.min > 0
                          ? `>$${budgetRange.min.toLocaleString()}`
                          : `<$${budgetRange.max.toLocaleString()}`}
                      <button
                        type="button"
                        onClick={() => setBudgetRange({ min: 0, max: 100000 })}
                        className="ml-1 text-emerald-400 hover:text-emerald-200"
                        aria-label="Clear budget filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-white/60 hover:text-white underline underline-offset-2"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Projects */}
              {!loading && !error && (
                <>
                  {showBestMatchesExtras && hasLocation ? (
                    <>
                      <div className="h-1/2 h-[300px] sticky top-24 z-[11] rounded-xl overflow-hidden border border-white/10">
                        <LocationMapPreview
                          lat={collectorLat!}
                          lng={collectorLng!}
                          radiusKm={maxDistance > 0 ? maxDistance : 0}
                          jobPins={jobPins}
                          onSelectPin={(id) => {
                            const project = filteredProjects.find((p) => p.id === id);
                            if (project) {
                              handleApplyClick(project);
                            }
                          }}
                          className="aspect-auto h-full"
                          forceDarkMode
                        />
                      </div>
                      <div className="h-1/2 mt-3">
                        {filteredProjects.length === 0 ? (
                          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                            <FolderKanban className="w-16 h-16 text-white/20 mx-auto mb-4" />
                            <p className="text-white/60 text-lg mb-2">
                              No projects match your criteria
                            </p>
                            <p className="text-white/40 text-sm mb-4">
                              Try adjusting your filters or search query
                            </p>
                            <Button
                              onClick={clearAllFilters}
                              className="bg-slate-700 border border-slate-600 text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                            >
                              Clear Filters
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {visibleProjects.map((project) => {
                              const rawKm = getRawDistanceKm(project);
                              const distance =
                                rawKm !== null ? formatDistance(rawKm) : null;
                              return (
                                <ProjectCard
                                  key={project.id}
                                  project={project}
                                  formatDate={formatDate}
                                  getDaysLeft={getDaysLeft}
                                  onApplyClick={handleApplyClick}
                                  distance={distance}
                                  isSaved={savedProjectIds.includes(project.id)}
                                  onToggleSave={user ? toggleSaveProject : undefined}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                      <FolderKanban className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 text-lg mb-2">
                        No projects match your criteria
                      </p>
                      <p className="text-white/40 text-sm mb-4">
                        Try adjusting your filters or search query
                      </p>
                      <Button
                        onClick={clearAllFilters}
                        className="bg-slate-700 border border-slate-600 text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <>
                        <div className="space-y-4">
                          {visibleProjects.map((project) => {
                            const rawKm = getRawDistanceKm(project);
                            const distance =
                              rawKm !== null ? formatDistance(rawKm) : null;
                            return (
                              <ProjectCard
                                key={project.id}
                                project={project}
                                formatDate={formatDate}
                                getDaysLeft={getDaysLeft}
                                onApplyClick={handleApplyClick}
                                distance={distance}
                                isSaved={savedProjectIds.includes(project.id)}
                                onToggleSave={user ? toggleSaveProject : undefined}
                              />
                            );
                          })}
                        </div>
                    </>
                  )}
                  {hasMoreJobs && (
                        <div className="mt-6 flex justify-center">
                          <Button
                            variant="outline"
                            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/50"
                            onClick={() => {
                              if (user) {
                                setVisibleCount((prev) => prev + 10);
                              } else {
                                router.push("/login?redirect=/projects");
                              }
                            }}
                          >
                            {user ? (
                              <>
                                View more
                                <span className="ml-1.5 text-white/60">
                                  ({filteredProjects.length - displayLimit}{" "}
                                  more)
                                </span>
                              </>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4 mr-2" />
                                View more — Sign in to see more jobs
                              </>
                            )}
                          </Button>
                        </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 mb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141a24] to-[#0d1117]">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[320px]">
                {/* Left: content + CTA */}
                <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                  <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-medium uppercase tracking-widest text-cyan-400/90">
                        For project owners
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Need data collected for your project?
                      </h2>
                      <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
                        Post your project and get access to our global network
                        of verified data collectors.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link href="/signup?role=requester">
                        <Button
                          size="lg"
                          className="group bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 transition-all duration-200 hover:scale-[1.02]"
                        >
                          Post a Project
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                      <span className="text-sm text-white/40">
                        Free to post · Pay only for results
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right: Three.js wireframe scene */}
                <div className="relative rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl overflow-hidden py-12">
                  <CTASceneCanvas />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/90 text-white shadow-lg transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#28303E]"
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="h-5 w-5" />
        </button>
      )}

      {/* Project Detail Sheet */}
      <ProjectDetailsSheet
        project={selectedProject}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        slotsFilled={false}
        onProposalSuccess={() => {
          setSheetOpen(false);
          setShowApplicationSuccessDialog(true);
        }}
        forceDarkMode
      />
      <ConfirmationDialog
        open={showApplicationSuccessDialog}
        onOpenChange={setShowApplicationSuccessDialog}
        title="Application submitted"
        description="Your application was submitted successfully."
        confirmText="OK"
        hideCancel
        onConfirm={async () => {
          setShowApplicationSuccessDialog(false);
        }}
      />
    </div>
  );
}
