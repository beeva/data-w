"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import FindProjects from "@/components/dashboard/collector/FindProjects";
import { Loading } from "@/components/ui/loading";

export default function FindProjectsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/login");
  //   }
  // }, [user, loading, router]);

  // useEffect(() => {
  //   if (!loading && profile && profile.role !== "collector" && profile.role !== "admin") {
  //     router.push("/dashboard");
  //   }
  // }, [profile, loading, router]);

  // if (loading) {
  //   return <Loading />;
  // }

  // if (!user) {
  //   return null;
  // }

  return (
    <DashboardLayout>
      <FindProjects />
    </DashboardLayout>
  );
}
