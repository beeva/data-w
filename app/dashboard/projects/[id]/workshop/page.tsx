"use client";

import { useParams } from "next/navigation";
import ProjectWorkshop from "@/components/dashboard/requester/ProjectWorkshop";

export default function WorkshopPage() {
  const params = useParams();
  const projectId = params.id as string;

  return <ProjectWorkshop projectId={projectId} />;
}
