"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ActiveProjectsList from "@/components/dashboard/requester/ActiveProjectsList";

export default function ActiveProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace("/login");
  //   }
  // }, [user, loading, router]);

  // Don't block rendering - let the component handle its own loading state
  // Only redirect if definitively no user after loading completes
  // if (!loading && !user) {
  //   return null;
  // }

  return (
    <DashboardLayout>
      <ActiveProjectsList />
    </DashboardLayout>
  );
}
