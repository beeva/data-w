"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getOpenProjects } from "@/lib/services/projectService";
import { getProposalsByCollector, getAssignmentsByCollector } from "@/lib/services/proposalService";
import type { Project } from "@/types/project";
import type { Proposal } from "@/types/proposal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Navigation,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import SubmitProposalDialog from "./SubmitProposalDialog";

/** Haversine distance in km between two lat/lng points */
function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
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

export default function CollectorDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, Proposal>>({});
  const [activeAssignments, setActiveAssignments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = all

  const collectorLat = profile?.location?.lat;
  const collectorLng = profile?.location?.lng;
  const hasLocation = typeof collectorLat === "number" && typeof collectorLng === "number";

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsRes, proposalsRes, assignmentsRes] = await Promise.all([
          getOpenProjects(),
          getProposalsByCollector(user.id),
          getAssignmentsByCollector(user.id),
        ]);

        setProjects(projectsRes.data || []);
        setActiveAssignments((assignmentsRes.data || []).length);

        if (proposalsRes.data) {
          const map: Record<string, Proposal> = {};
          proposalsRes.data.forEach((p) => {
            map[p.request_id] = p;
          });
          setProposalStatuses(map);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const distanceOptions = [
    { value: "0", label: "All distances" },
    { value: "5", label: "Within 5 km" },
    { value: "10", label: "Within 10 km" },
    { value: "25", label: "Within 25 km" },
    { value: "50", label: "Within 50 km" },
    { value: "100", label: "Within 100 km" },
    { value: "250", label: "Within 250 km" },
  ];

  /** Get raw distance in km for a project, or null if no coordinates */
  const getRawDistanceKm = (project: Project): number | null => {
    if (!hasLocation) return null;
    const pLat = project.location?.lat;
    const pLng = project.location?.lng;
    if (typeof pLat !== "number" || typeof pLng !== "number") return null;
    return getDistanceKm(collectorLat!, collectorLng!, pLat, pLng);
  };

  // Filter out accepted proposals, apply distance filter, sort nearest first
  const nearbyProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const proposal = proposalStatuses[p.id];
      if (proposal && proposal.status === "accepted") return false;

      // Apply distance filter when location is set and a max distance is chosen
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
  }, [projects, proposalStatuses, hasLocation, collectorLat, collectorLng, maxDistance]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold mt-1">
                  ${profile?.total_earnings?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1">
                  {profile?.completed_tasks || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold mt-1">{activeAssignments}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold mt-1">
                  {profile?.rating?.toFixed(1) || "—"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location hint */}
      {!hasLocation && (
        <Card className="border-dashed border-2 border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Set your location to see nearby projects</p>
              <p className="text-xs text-muted-foreground">
                Go to your profile settings and add your address so we can show projects near you.
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

      {/* Nearby Projects */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {hasLocation ? (
                  <>
                    <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Projects Near You
                  </>
                ) : (
                  <>
                    <Briefcase className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Available Projects
                  </>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasLocation
                  ? maxDistance > 0
                    ? `${nearbyProjects.length} project${nearbyProjects.length !== 1 ? "s" : ""} within ${maxDistance} km`
                    : `${nearbyProjects.length} open projects sorted by distance`
                  : `${projects.length} open projects available`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasLocation && (
                <Select
                  value={String(maxDistance)}
                  onValueChange={(val) => setMaxDistance(Number(val))}
                >
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distanceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
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
        </CardHeader>
        <CardContent>
          {nearbyProjects.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {maxDistance > 0
                  ? `No projects found within ${maxDistance} km. Try increasing the distance.`
                  : "No open projects available right now."}
              </p>
              {maxDistance > 0 && (
                <Button
                  variant="link"
                  className="text-xs mt-1 text-cyan-600 dark:text-cyan-400"
                  onClick={() => setMaxDistance(0)}
                >
                  Show all distances
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyProjects.slice(0, 6).map((project) => {
                const rawKm = getRawDistanceKm(project);
                const distance = rawKm !== null ? formatDistance(rawKm) : null;
                const proposal = proposalStatuses[project.id];

                return (
                  <div
                    key={project.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold truncate">
                            {project.title}
                          </h3>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
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
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
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
                            <DollarSign className="w-3 h-3" />
                            <span className="font-semibold text-foreground">
                              ${project.budget.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(project.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{project.max_collectors} collector{project.max_collectors !== 1 ? "s" : ""}</span>
                          </div>
                          {project.location?.address && !distance && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{project.location.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {proposal ? (
                          <p className="text-[10px] text-muted-foreground text-right">
                            Submitted<br />
                            {new Date(proposal.submitted_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <SubmitProposalDialog
                            project={project}
                            onSuccess={() => {
                              // Refresh proposals
                              if (user) {
                                getProposalsByCollector(user.id).then((res) => {
                                  if (res.data) {
                                    const map: Record<string, Proposal> = {};
                                    res.data.forEach((p) => { map[p.request_id] = p; });
                                    setProposalStatuses(map);
                                  }
                                });
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {nearbyProjects.length > 6 && (
                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    className="text-xs text-cyan-600 dark:text-cyan-400"
                    onClick={() => router.push("/dashboard/projects/find")}
                  >
                    View all {nearbyProjects.length} projects →
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
