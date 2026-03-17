"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import CollectorHeader from "@/components/dashboard/collector/CollectorHeader";
import RequesterHeader from "@/components/dashboard/requester/RequesterHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, cachedRole, loading } = useAuth();

  // Use cachedRole (from localStorage) for immediate render; fall back to profile.role once loaded
  const role = profile?.role ?? cachedRole;

  // While role is unknown and auth is still loading, show a blank screen
  // to prevent the wrong layout from flashing before the correct one is known
  if (!role && loading) {
    return <div className="min-h-screen bg-[#F4F5FA] dark:bg-gray-900" />;
  }

  // Collector/Agent layout: sticky top header with nav, no sidebar
  if (role === "collector" || role === "agent") {
    return (
      <div className="min-h-screen bg-[#F4F5FA] dark:bg-gray-900">
        <div className="sticky top-0 z-20 px-2 pt-2 md:px-4 md:pt-4 bg-[#F4F5FA] dark:bg-gray-900 pb-2">
          <CollectorHeader />
        </div>
        <main className="px-2 pb-4 md:px-4 md:pb-6">{children}</main>
      </div>
    );
  }

  // Requester layout: same as collector — sticky header with nav, no sidebar
  if (role === "requester") {
    return (
      <div className="min-h-screen bg-[#F4F5FA] dark:bg-gray-900">
        <div className="sticky top-0 z-20 px-2 pt-2 md:px-4 md:pt-4 bg-[#F4F5FA] dark:bg-gray-900 pb-2">
          <RequesterHeader />
        </div>
        <main className="px-2 pb-4 md:px-4 md:pb-6">{children}</main>
      </div>
    );
  }

  // Default layout: sidebar + header + main (admin, etc.)
  return (
    <div className="min-h-screen bg-[#F4F5FA] dark:bg-gray-900 p-2 md:py-4 md:pl-4">
      <div className="w-full h-[calc(100dvh-2rem)] mx-auto rounded-xl overflow-hidden flex gap-0 md:gap-4">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onNavigate={() => {}}
          />
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-64 border-0">
            <DashboardSidebar
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-6 overflow-y-auto rounded-2xl dashboard-scrollbar">
          {/* Header */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-[#F4F5FA] dark:bg-[#111827] rounded-b-2xl shadow-sm ml-2 mr-2">
            <DashboardHeader
              onSidebarToggle={() => {
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              collapsed={sidebarCollapsed}
            />
          </div>

          {/* Page Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
