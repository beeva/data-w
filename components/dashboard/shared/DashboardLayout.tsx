"use client";

import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F4F5FA] dark:bg-gray-900 p-2 md:py-4 md:pl-4">
      <div className="w-full h-[calc(100dvh-64px-1rem)] md:h-[calc(100dvh-64px-2rem)] mx-auto rounded-xl overflow-hidden flex gap-0 md:gap-4">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DashboardSidebar collapsed={sidebarCollapsed} onNavigate={() => {}} />
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-64 border-0">
            <DashboardSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-4 overflow-y-auto rounded-2xl dashboard-scrollbar pr-2 md:pr-4">
          {/* Header */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-[#F4F5FA] dark:bg-[#111827] rounded-b-2xl shadow-sm">
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
