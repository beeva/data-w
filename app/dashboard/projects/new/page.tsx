"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import NewProjectForm from "@/components/dashboard/requester/NewProjectForm";
import { Loading } from "@/components/ui/loading";

export default function NewProjectPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/login");
  //   }
  // }, [user, loading, router]);

  // useEffect(() => {
  //   if (!loading && profile && profile.role !== "requester" && profile.role !== "admin") {
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
      <NewProjectForm />
    </DashboardLayout>
  );
}
