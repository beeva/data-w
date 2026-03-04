"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import type { Proposal } from "@/types/proposal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import SubmitProposalDialog from "./SubmitProposalDialog";
import {
  getRequesterProjectHistory,
  type RequesterHistoryProject,
} from "@/lib/services/projectService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar, DollarSign, Heart, MapPin, Users } from "lucide-react";

interface ProjectDetailsSheetProps {
  project: Project | null;
  proposal?: Proposal | null;
  slotsFilled?: boolean;
  onProposalSuccess?: () => void;
  isSavedProject?: boolean;
  onToggleSaveProject?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: ProjectDetailsSheetProps) {
  const [requesterProjects, setRequesterProjects] = useState<RequesterHistoryProject[]>([]);
  const [loadingRequesterProjects, setLoadingRequesterProjects] = useState(false);

  useEffect(() => {
    if (!project?.requester_id || !open) return;

    let mounted = true;
    const loadRequesterProjectHistory = async () => {
      setLoadingRequesterProjects(true);
      const { data } = await getRequesterProjectHistory(project.requester_id, project.id);
      if (mounted) {
        setRequesterProjects(data ?? []);
        setLoadingRequesterProjects(false);
      }
    };

    loadRequesterProjectHistory();

    return () => {
      mounted = false;
    };
  }, [open, project?.id, project?.requester_id]);

  if (!project) return null;

  const hasMapCoordinates =
    typeof project.location?.lat === "number" &&
    typeof project.location?.lng === "number";
  const radiusKm =
    typeof project.location?.radius_km === "number" &&
    Number.isFinite(project.location.radius_km)
      ? Math.max(project.location.radius_km, 0)
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-xl">{project.title}</SheetTitle>
          <SheetDescription>Project details for collectors.</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4 p-4">
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{project.category}</Badge>
              <Badge variant="outline" className="capitalize">
                {project.status}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Budget</h4>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">${project.budget.toFixed(2)}</span>
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Deadline</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{formatDate(project.deadline)}</span>
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Max Collectors</h4>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {project.max_collectors} collector{project.max_collectors !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {project.location?.address && (
                <div className="rounded-md border border-border p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Location</h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location.address}</span>
                  </div>
                </div>
              )}
              {typeof project.location?.radius_km === "number" && (
                <div className="rounded-md border border-border p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Radius</h4>
                  <span className="text-foreground">{project.location.radius_km} km</span>
                </div>
              )}
              {typeof project.location?.lat === "number" && typeof project.location?.lng === "number" && (
                <div className="rounded-md border border-border p-3 sm:col-span-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Coordinates</h4>
                  <span className="text-foreground">
                    {project.location.lat.toFixed(6)}, {project.location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {hasMapCoordinates && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Location Map</h4>
                <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                  <LocationMapPreview
                    lat={project.location!.lat as number}
                    lng={project.location!.lng as number}
                    radiusKm={radiusKm}
                  />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2">Required Data Types</h4>
              <div className="flex flex-wrap gap-2">
                {project.requirements.data_types.length > 0 ? (
                  project.requirements.data_types.map((type, idx) => (
                    <Badge key={`${type}-${idx}`} variant="secondary">
                      {type}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Preferred Formats</h4>
              <div className="flex flex-wrap gap-2">
                {project.requirements.formats.length > 0 ? (
                  project.requirements.formats.map((format, idx) => (
                    <Badge key={`${format}-${idx}`} variant="outline">
                      {format}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1">Additional Specifications</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.requirements.specifications || "Not specified"}
              </p>
            </div>

            <div className="rounded-md border border-border p-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Timeline</h4>
              <div className="space-y-1 text-sm text-foreground">
                <p>Created: {formatDate(project.created_at)}</p>
                <p>Last updated: {formatDate(project.updated_at)}</p>
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Requester History</h4>
              {loadingRequesterProjects ? (
                <p className="text-sm text-muted-foreground">Loading requester history...</p>
              ) : requesterProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No previous projects found for this requester.
                </p>
              ) : (
                <div className="space-y-2">
                  {requesterProjects.map((historyProject) => (
                    <div
                      key={historyProject.id}
                      className="rounded-md border border-border p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {historyProject.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {historyProject.category} • Created {formatDate(historyProject.created_at)}
                          {historyProject.deadline ? ` • Deadline ${formatDate(historyProject.deadline)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            historyProject.status === "completed"
                              ? "border-emerald-500/40 text-emerald-600"
                              : historyProject.status === "cancelled"
                              ? "border-red-500/40 text-red-600"
                              : historyProject.status === "paused"
                              ? "border-amber-500/40 text-amber-600"
                              : "border-blue-500/40 text-blue-600"
                          }`}
                        >
                          {historyProject.status}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          ${historyProject.budget.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-4 self-start">
            <div className="rounded-md border border-border p-3 space-y-2">
              <h4 className="text-sm font-semibold">Application</h4>
              {proposal ? (
                <div className="space-y-2">
                  <Badge
                    className={
                      proposal.status === "accepted"
                        ? "bg-green-500/20 text-green-600 border-green-500/30"
                        : proposal.status === "rejected"
                        ? "bg-red-500/20 text-red-600 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                    }
                  >
                    {proposal.status === "accepted"
                      ? "Accepted"
                      : proposal.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ) : slotsFilled ? (
                <Badge variant="secondary" className="text-[11px] bg-gray-500/20 text-gray-400">
                  Slots Full
                </Badge>
              ) : (
                <SubmitProposalDialog
                  project={project}
                  onSuccess={onProposalSuccess}
                  triggerClassName="w-full justify-center"
                />
              )}
              {onToggleSaveProject && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={onToggleSaveProject}
                >
                  {isSavedProject ? "Saved Project" : "Save Project"}
                  <Heart
                    className={`w-4 h-4 ${
                      isSavedProject ? "fill-red-500 text-red-500" : "text-muted-foreground"
                    }`}
                  />
                </Button>
              )}
            </div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}
