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
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "signin-success") {
      setToastMessage("You have been signed in successfully.");
      setShowToast(true);
      router.replace("/dashboard/home");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const renderDashboardContent = () => {
    if (loading) {
      return <Loading />;
    }

    if (!user) {
      return <Loading />;
    }

    if (!profile) {
      return (
        <div className="max-w-md mx-auto mt-16 rounded-xl border bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Could not load your profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The connection to Supabase timed out. Please retry.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={refreshProfile}>Retry</Button>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      );
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
          title="Login successful"
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
