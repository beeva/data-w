"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  Clock,
  Star,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Navigation,
  Briefcase,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Wallet,
  Zap,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import ProjectDetailsSheet from "./ProjectDetailsSheet";
import { LocationMapPreview } from "@/components/ui/location-map-preview";

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
    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
      {projects.slice(0, 8).map((project) => {
        const rawKm = getRawDistanceKm(project);
        const distance = rawKm !== null ? formatDistance(rawKm) : null;
        const proposal = proposalStatuses[project.id];
        const slotsFilled =
          (assignmentCounts[project.id] || 0) >= (project.max_collectors || 1);
        const isSaved = savedProjectIds.includes(project.id);

        return (
          <div
            key={project.id}
            className="py-4 first:pt-0 last:pb-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 -mx-4 px-4 transition-colors cursor-pointer rounded-lg"
            onClick={() => onSelectProject(project)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors truncate">
                    {project.title}
                  </h3>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 ${getCategoryColor(project.category)}`}
                  >
                    {project.category}
                  </Badge>
                  {proposal && (
                    <Badge
                      className={
                        proposal.status === "accepted"
                          ? "bg-green-500/20 text-green-600 border-green-500/30 text-[9px] px-1.5 py-0"
                          : proposal.status === "rejected"
                            ? "bg-red-500/20 text-red-600 border-red-500/30 text-[9px] px-1.5 py-0"
                            : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[9px] px-1.5 py-0"
                      }
                    >
                      {proposal.status === "accepted"
                        ? "Accepted"
                        : proposal.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {distance && (
                    <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
                      <MapPin className="w-3 h-3" />
                      <span>{distance}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${project.budget.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {project.max_collectors} collector
                      {project.max_collectors !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {project.location?.address && !distance && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">
                        {project.location.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="shrink-0 flex flex-col items-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onToggleSave(project.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={isSaved ? "Remove from saved" : "Save this project"}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
                {proposal ? (
                  <p className="text-[10px] text-muted-foreground text-right leading-snug">
                    Submitted
                    <br />
                    {new Date(proposal.submitted_at).toLocaleDateString()}
                  </p>
                ) : slotsFilled ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-gray-500/20 text-gray-400"
                  >
                    Slots Full
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {projects.length > 8 && (
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

  const collectorLat = profile?.location?.lat;
  const collectorLng = profile?.location?.lng;
  const hasLocation =
    typeof collectorLat === "number" && typeof collectorLng === "number";

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
        // ignore
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                      <span className="truncate text-sm w-32">
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
                    className="btn-gelatine w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity shadow-sm"
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
              <span className="text-sm font-semibold text-muted-foreground">
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
      </aside>

      {/* ── Right panel ── */}
      <section className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Location hint */}
        {!hasLocation && (
          <Card className="border-dashed border-2 border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10 shadow-none">
            <CardContent className="px-6 flex items-center gap-3">
              <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Set your location to see nearby projects
                </p>
                <p className="text-xs text-muted-foreground">
                  Add your address in profile settings to surface projects near
                  you.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs h-7"
                onClick={() => router.push("/dashboard/settings")}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs + filter bar */}
        <Card className="dark:bg-gray-800/50 border-none shadow-sm">
          <CardContent className="py-0 px-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
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
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold">
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
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {distanceOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => router.push("/dashboard/projects/find")}
                >
                  View All
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

            {/* Tab subtitle */}
            {showBestMatchesExtras && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-b border-gray-100 dark:border-gray-700">
                {hasLocation ? (
                  maxDistance > 0 ? (
                    <>
                      <span className="font-medium text-foreground">
                        {nearbyProjects.length}
                      </span>{" "}
                      project{nearbyProjects.length !== 1 ? "s" : ""} within{" "}
                      {maxDistance} km of your location
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">
                        {nearbyProjects.length}
                      </span>{" "}
                      open projects sorted by distance
                    </>
                  )
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {nearbyProjects.length}
                    </span>{" "}
                    open projects available
                  </>
                )}
              </div>
            )}

            {/* Best Matches: two-column layout (map left, jobs right) */}
            {showBestMatchesExtras && hasLocation ? (
              <div className="flex min-h-[480px]">
                {/* Left: Map */}
                <div className="w-2/5 shrink-0 border-r border-gray-100 dark:border-gray-700 sticky top-0 self-start">
                  <LocationMapPreview
                    lat={collectorLat!}
                    lng={collectorLng!}
                    radiusKm={maxDistance > 0 ? maxDistance : 0}
                  />
                </div>

                {/* Right: Jobs list */}
                <div className="flex-1 overflow-y-auto max-h-[560px] px-4 py-3">
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
              </div>
            ) : (
              /* Recent / Saved / Best without location: single column */
              <div className="px-4 py-3">
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
