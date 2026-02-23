"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTickets from "@/components/dashboard/admin/AdminTickets";

export default function TicketsPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      router.replace("/dashboard/home");
    }
  }, [loading, profile, router]);

  if (!loading && profile?.role !== "admin") {
    return null;
  }

  return <AdminTickets />;
}
