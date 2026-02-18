"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import AccountSettings from "@/components/dashboard/shared/AccountSettings";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <AccountSettings />
    </DashboardLayout>
  );
}
