"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import UserManagement from "@/components/dashboard/admin/UserManagement";

export default function UsersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (!loading && !userId) {
      router.replace("/login");
    }
    if (!loading && profile && profile.role !== "admin") {
      router.replace("/dashboard/home");
    }
  }, [userId, loading, profile, router]);

  if (!loading && (!userId || profile?.role !== "admin")) {
    return null;
  }

  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  );
}
