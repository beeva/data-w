"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import BillingContent from "@/components/dashboard/shared/BillingContent";

export default function BillingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace("/login");
  //   }
  // }, [user, loading, router]);

  // if (!loading && !user) {
  //   return null;
  // }

  return (
    <DashboardLayout>
      <BillingContent />
    </DashboardLayout>
  );
}
