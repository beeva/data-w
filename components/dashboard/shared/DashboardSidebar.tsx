"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Zap,
} from "lucide-react";
import Image from "next/image";
import {
  upperNavItems,
  lowerNavItems,
  type NavItem,
  type SubMenuItem,
} from "@/config/navigation";
import { getAssignmentsByCollector } from "@/lib/services/proposalService";
import { getProjectsByRequester } from "@/lib/services/projectService";
import type { CollectorAssignment } from "@/types/proposal";
import type { Project } from "@/types/project";
import CreateProjectDialog from "@/components/dashboard/requester/CreateProjectDialog";

interface DashboardSidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function DashboardSidebar({
  collapsed = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [acceptedProjects, setAcceptedProjects] = useState<
    (CollectorAssignment & {
      project?: { id: string; title: string; status?: string };
    })[]
  >([]);
  const [requesterProjects, setRequesterProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const filterSubmenuByRole = (submenu: SubMenuItem[]) => {
    return submenu.filter((subItem) => {
      if (!subItem.roles || subItem.roles.length === 0) return true;
      if (authLoading) return true;
      if (!profile) return false;
      return subItem.roles.includes(profile.role);
    });
  };

  const shouldShowNavItem = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (authLoading) return true;
    if (!profile) return false;
    return item.roles.includes(profile.role);
  };

  const userId = user?.id;
  const userRole = profile?.role;

  useEffect(() => {
    if (!userId || !userRole) return;

    if (userRole === "collector") {
      if (acceptedProjects.length === 0) setLoadingProjects(true);
      getAssignmentsByCollector(userId)
        .then(({ data, error }) => {
          if (!error && data) setAcceptedProjects(data);
        })
        .catch((err) => console.error("Error fetching accepted projects:", err))
        .finally(() => setLoadingProjects(false));
    } else if (userRole === "requester" || userRole === "admin") {
      if (requesterProjects.length === 0) setLoadingProjects(true);
      getProjectsByRequester(userId)
        .then(({ data, error }) => {
          if (!error && data) setRequesterProjects(data);
        })
        .catch((err) => console.error("Error fetching projects:", err))
        .finally(() => setLoadingProjects(false));
    }
     
  }, [userId, userRole]);

  useEffect(() => {
    upperNavItems.forEach((item) => {
      if (item.submenu) {
        const filteredSubmenu = filterSubmenuByRole(item.submenu);
        const hasActiveSubmenu = filteredSubmenu.some(
          (sub) =>
            pathname === sub.href || pathname?.startsWith(sub.href + "/"),
        );
        if (hasActiveSubmenu) {
          setExpandedMenus((prev) => {
            if (!prev.includes(item.name)) return [...prev, item.name];
            return prev;
          });
        }
      }
    });
     
  }, [pathname, profile, authLoading]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName],
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full overflow-hidden rounded-2xl transition-all duration-300",
        "bg-white dark:bg-gray-800/50 shadow-sm",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center px-4 py-5 flex-shrink-0",
          collapsed && "justify-center px-3",
        )}
      >
        {collapsed ? (
          <>
            <div className="relative h-8 w-8 shrink-0 dark:hidden">
              <Image
                src="/icon-dark.png"
                alt="DataW"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <div className="relative hidden h-8 w-8 shrink-0 dark:block">
              <Image
                src="/icon.png"
                alt="DataW"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
          </>
        ) : (
          <>
            <div className="relative h-[100px] w-[100px] shrink-0 dark:hidden">
              <Image
                src="/logo-dark.png"
                alt="DataW"
                fill
                className="object-contain object-left"
                sizes="100px"
                loading="eager"
              />
            </div>
            <div className="relative hidden h-[100px] w-[100px] shrink-0 dark:block">
              <Image
                src="/logo.png"
                alt="DataW"
                fill
                className="object-contain object-left"
                sizes="100px"
                loading="eager"
              />
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-gray-100 dark:bg-gray-700 flex-shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col dashboard-scrollbar">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-2">
            Main
          </p>
        )}

        {/* Upper Navigation Items */}
        <div className="space-y-0.5">
          {upperNavItems
            .filter(shouldShowNavItem)
            .filter(
              (item) =>
                !(item.name === "Projects" && userRole === "admin"),
            )
            .map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            // Projects tree view (requester: project list; collector: Find Projects)
            if (
              (item.name === "Projects" || item.name === "Find Projects") &&
              !collapsed
            ) {
              const isCollector = item.name === "Find Projects";
              const allProjectsHref = isCollector
                ? "/dashboard/projects/find"
                : "/dashboard/projects/active";
              const projects = isCollector
                ? acceptedProjects
                : requesterProjects;

              return (
                <div key={item.name}>
                  <div
                    className={cn(
                      "group/hdr flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-pointer",
                      "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
                      pathname === allProjectsHref &&
                        "bg-cyan-500/[0.08] dark:bg-cyan-500/10",
                    )}
                  >
                    <button
                      onClick={() => setProjectsExpanded(!projectsExpanded)}
                      className={cn(
                        "relative flex-shrink-0 w-[22px] h-[22px] rounded-md flex items-center justify-center transition-all focus:outline-none",
                        "bg-cyan-500 group-hover/hdr:bg-gray-200 dark:group-hover/hdr:bg-gray-700",
                        "text-white group-hover/hdr:text-gray-500 dark:group-hover/hdr:text-gray-400",
                      )}
                    >
                      <span className="text-xs font-bold leading-none group-hover/hdr:opacity-0 pointer-events-none select-none">
                        P
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hdr:opacity-100 transition-opacity">
                        {projectsExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </span>
                    </button>

                    <Link
                      href={allProjectsHref}
                      onClick={onNavigate}
                      className={cn(
                        "flex-1 text-sm font-medium transition-colors",
                        pathname === allProjectsHref
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100",
                      )}
                    >
                      Projects
                    </Link>
                  </div>

                  {projectsExpanded && (
                    <div className="mt-1 ml-[18px] pl-2.5 border-l-2 border-gray-100 dark:border-gray-700 space-y-0.5">
                      {loadingProjects ? (
                        <>
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-2 py-1.5"
                            >
                              <div className="w-3.5 h-3.5 flex-shrink-0 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                              <div
                                className="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
                                style={{ width: `${[55, 70, 45][i]}%` }}
                              />
                            </div>
                          ))}
                        </>
                      ) : projects.length === 0 ? (
                        <p className="py-2 px-2 text-xs text-gray-400 dark:text-gray-500 italic">
                          {isCollector
                            ? "No active projects"
                            : "No projects yet"}
                        </p>
                      ) : (
                        <>
                          {(isCollector
                            ? (projects as typeof acceptedProjects)
                            : (projects as typeof requesterProjects)
                          ).map((item) => {
                            const isAssignment = "submission_token" in item;
                            const href = isAssignment
                              ? `/submit/${(item as (typeof acceptedProjects)[0]).submission_token}`
                              : `/dashboard/projects/${(item as (typeof requesterProjects)[0]).id}/workshop`;
                            const label = isAssignment
                              ? (item as (typeof acceptedProjects)[0]).project
                                  ?.title || "Untitled Project"
                              : (item as (typeof requesterProjects)[0]).title;
                            const isActive =
                              pathname === href || pathname?.startsWith(href);
                            return (
                              <Link
                                key={
                                  isAssignment
                                    ? (item as (typeof acceptedProjects)[0]).id
                                    : (item as (typeof requesterProjects)[0]).id
                                }
                                href={href}
                                onClick={onNavigate}
                                title={label}
                                className={cn(
                                  "group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-sm",
                                  isActive
                                    ? "bg-cyan-500/[0.08] dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200",
                                )}
                              >
                                <Folder
                                  className={cn(
                                    "w-4 h-4 flex-shrink-0 transition-colors",
                                    isActive
                                      ? "text-cyan-500"
                                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500",
                                  )}
                                />
                                <span className="truncate">{label}</span>
                              </Link>
                            );
                          })}

                          {!isCollector && (
                            <button
                              type="button"
                              onClick={() => setCreateProjectOpen(true)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all w-full text-left"
                            >
                              <Plus className="w-4 h-4 flex-shrink-0" />
                              <span>New Project</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            const isExpanded = expandedMenus.includes(item.name);
            const isSubmenuActive =
              hasSubmenu &&
              item.submenu?.some(
                (sub) =>
                  pathname === sub.href || pathname?.startsWith(sub.href + "/"),
              );

            let isActive = false;
            if (hasSubmenu) {
              isActive = isSubmenuActive || false;
            } else {
              if (pathname === item.href) {
                isActive = true;
              } else if (pathname?.startsWith(item.href + "/")) {
                const belongsToOtherSubmenu = upperNavItems.some(
                  (otherItem) => {
                    if (otherItem === item || !otherItem.submenu) return false;
                    return otherItem.submenu.some(
                      (sub) =>
                        pathname === sub.href ||
                        pathname?.startsWith(sub.href + "/"),
                    );
                  },
                );
                isActive = !belongsToOtherSubmenu;
              }
            }

            if (hasSubmenu && !collapsed) {
              const filteredSubmenu = item.submenu
                ? filterSubmenuByRole(item.submenu)
                : [];
              if (!filteredSubmenu || filteredSubmenu.length === 0) return null;

              return (
                <div key={item.name} className="space-y-0.5">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-2 rounded-xl transition-all",
                      isActive || isSubmenuActive
                        ? "bg-cyan-500/[0.08] dark:bg-cyan-500/10"
                        : "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
                    )}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <Icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isActive || isSubmenuActive
                            ? "text-cyan-500"
                            : "text-gray-400 dark:text-gray-500",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive || isSubmenuActive
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-gray-600 dark:text-gray-400",
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 pl-2 border-l-2 border-gray-100 dark:border-gray-800 space-y-0.5">
                      {filteredSubmenu.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.href ||
                          pathname?.startsWith(subItem.href + "/");
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center px-2 py-1.5 rounded-lg transition-all text-sm",
                              isSubActive
                                ? "bg-cyan-500/[0.08] dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100",
                            )}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-cyan-500/[0.08] dark:bg-cyan-500/10"
                    : "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 mx-[2px]",
                    isActive
                      ? "text-cyan-500"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Separator */}
        <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />

        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-2">
            Account
          </p>
        )}

        {/* Lower Navigation Items */}
        <div className="space-y-0.5">
          {lowerNavItems.filter(shouldShowNavItem).map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-cyan-500/[0.08] dark:bg-cyan-500/10"
                    : "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 mx-[2px]",
                    isActive
                      ? "text-cyan-500"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={() => {
          if (userId && (userRole === "requester" || userRole === "admin")) {
            getProjectsByRequester(userId).then(({ data, error }) => {
              if (!error && data) setRequesterProjects(data);
            });
          }
        }}
      />

      {/* Upgrade to Pro */}
      <div className={cn("px-4 pb-4 flex-shrink-0", collapsed && "px-2")}>
        {collapsed ? (
          <Link
            href="/dashboard/billing"
            onClick={onNavigate}
            className="flex justify-center"
            title="Upgrade to Pro"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
              <Zap className="w-4 h-4" />
            </span>
          </Link>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-4">
            {/* Decorative circles */}
            <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-white/10 rounded-full pointer-events-none" />

            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Upgrade to Pro
              </p>
              <p className="text-[11px] text-white/70 mb-3.5 leading-relaxed">
                Unlock advanced features and higher limits.
              </p>
              <Link
                href="/dashboard/billing"
                onClick={onNavigate}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2 rounded-lg bg-white text-cyan-600 hover:bg-white/90 transition-all shadow-sm"
              >
                Upgrade Now
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
