"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ProjectWorkshop from "@/components/dashboard/requester/ProjectWorkshop";

export default function WorkshopPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!loading && !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <ProjectWorkshop projectId={projectId} />
    </DashboardLayout>
  );
}
