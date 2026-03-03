"use client";

import type { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, DollarSign, MapPin, Users } from "lucide-react";

interface ProjectDetailsDialogProps {
  project: Project | null;
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

export default function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold text-foreground">
                ${project.budget.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(project.deadline)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {project.max_collectors} collector
                {project.max_collectors !== 1 ? "s" : ""}
              </span>
            </div>
            {project.location?.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{project.location.address}</span>
              </div>
            )}
          </div>

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

          {project.requirements.formats?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Preferred Formats</h4>
              <div className="flex flex-wrap gap-2">
                {project.requirements.formats.map((format, idx) => (
                  <Badge key={`${format}-${idx}`} variant="outline">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {project.requirements.specifications && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Additional Specifications</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.requirements.specifications}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
