"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import AdminTickets from "@/components/dashboard/admin/AdminTickets";

export default function TicketsPage() {
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
      <AdminTickets />
    </DashboardLayout>
  );
}
