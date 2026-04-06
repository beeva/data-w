"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";
import { isPersonalOrCompanyRole } from "@/lib/dashboardFeatureAccess";

/**
 * Redirects personal/company accounts away from routes they cannot use (e.g. projects, project messages).
 */
export default function PersonalCompanyRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, cachedRole, loading } = useAuth();
  const router = useRouter();
  const role = profile?.role ?? cachedRole;

  useEffect(() => {
    if (loading && !role) return;
    if (isPersonalOrCompanyRole(role)) {
      router.replace("/dashboard/home");
    }
  }, [loading, role, router]);

  if (loading && !role) {
    return <Loading />;
  }
  if (isPersonalOrCompanyRole(role)) {
    return <Loading />;
  }
  return <>{children}</>;
}
