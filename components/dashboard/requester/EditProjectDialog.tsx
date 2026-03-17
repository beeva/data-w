"use client";

import CreateProjectDialog from "./CreateProjectDialog";
import type { Project } from "@/types/project";

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  return (
    <CreateProjectDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      mode="edit"
      project={project}
    />
  );
}
