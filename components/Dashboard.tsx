"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RequesterDashboard from "./dashboard/requester/RequesterDashboard";
import CollectorDashboard from "./dashboard/collector/CollectorDashboard";
import AgentDashboard from "./dashboard/agent/AgentDashboard";
import AdminDashboard from "./dashboard/admin/AdminDashboard";
import { Loading } from "@/components/ui/loading";
import ToastNotification from "@/components/ui/toast-notification";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "signin-success") {
      setToastMessage("Signed in successfully");
      setShowToast(true);
      router.replace("/dashboard/home");
    }
  }, [searchParams, router]);

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const renderDashboardContent = () => {
    if (loading || !profile) {
      return <Loading />;
    }

    switch (profile.role) {
      case "requester":
        return <RequesterDashboard />;
      case "collector":
        return <CollectorDashboard />;
      case "agent":
        return <AgentDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <RequesterDashboard />;
    }
  };

  return (
    <>
      {showToast && toastMessage && (
        <ToastNotification
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={handleCloseToast}
        />
      )}
      {renderDashboardContent()}
    </>
  );
}
