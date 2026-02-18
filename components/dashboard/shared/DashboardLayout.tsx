"use client";

import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5FA] dark:bg-gray-900 py-4 pl-4">
      <div className="w-full h-[calc(100vh-2rem)] mx-auto rounded-xl overflow-hidden flex gap-4">
        {/* Left Sidebar - Fixed */}
        <DashboardSidebar collapsed={sidebarCollapsed} />

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto rounded-2xl dashboard-scrollbar pr-4">
          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-[#F4F5FA] dark:bg-[#111827] rounded-b-2xl shadow-sm">
            <DashboardHeader
              onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              collapsed={sidebarCollapsed}
            />
          </div>

          {/* Page Content - Scrollable */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
