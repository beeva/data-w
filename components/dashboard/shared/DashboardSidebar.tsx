"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronUp, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  upperNavItems,
  lowerNavItems,
  type NavItem,
  type SubMenuItem,
} from "@/config/navigation";
import { getAssignmentsByCollector } from "@/lib/services/proposalService";
import type { CollectorAssignment } from "@/types/proposal";

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
  const [acceptedProjects, setAcceptedProjects] = useState<(CollectorAssignment & { project?: { id: string; title: string } })[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Helper function to filter submenu items based on role
  const filterSubmenuByRole = (submenu: SubMenuItem[]) => {
    return submenu.filter((subItem) => {
      // If no roles specified, show for all users
      if (!subItem.roles || subItem.roles.length === 0) {
        return true;
      }
      // While auth is loading, show all items temporarily
      if (authLoading) {
        return true;
      }
      // If no profile after loading, hide role-restricted items
      if (!profile) {
        return false;
      }
      // Show if user's role is in the allowed roles
      return subItem.roles.includes(profile.role);
    });
  };

  // Helper function to filter nav items based on role
  const shouldShowNavItem = (item: NavItem) => {
    // If no roles specified, show for all users
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // While auth is loading, show all items temporarily
    if (authLoading) {
      return true;
    }
    // If no profile after loading, hide role-restricted items
    if (!profile) {
      return false;
    }
    // Show if user's role is in the allowed roles
    return item.roles.includes(profile.role);
  };

  // Fetch accepted projects for collectors
  // Use primitive deps (user.id, profile.role) to avoid re-fetching on auth token refresh
  const userId = user?.id;
  const userRole = profile?.role;

  useEffect(() => {
    if (userRole === 'collector' && userId) {
      // Only show loading spinner on the very first fetch
      if (acceptedProjects.length === 0) {
        setLoadingProjects(true);
      }
      getAssignmentsByCollector(userId)
        .then(({ data, error }) => {
          if (!error && data) {
            setAcceptedProjects(data);
          }
        })
        .catch((err) => {
          console.error('Error fetching accepted projects:', err);
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  // Auto-expand menu if submenu item is active
  useEffect(() => {
    upperNavItems.forEach((item) => {
      if (item.submenu) {
        const filteredSubmenu = filterSubmenuByRole(item.submenu);

        const hasActiveSubmenu = filteredSubmenu.some(
          (sub) =>
            pathname === sub.href || pathname?.startsWith(sub.href + "/")
        );
        if (hasActiveSubmenu) {
          setExpandedMenus((prev) => {
            if (!prev.includes(item.name)) {
              return [...prev, item.name];
            }
            return prev;
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, profile, authLoading]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  return (
    <aside
      className={cn(
        "bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300",
        collapsed ? "w-16" : "w-52"
      )}
    >
      {/* Brand Name at Top */}
      <div
        className={cn(
          "px-4 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center",
          collapsed && "pl-3 pr-2 justify-center"
        )}
      >
        {collapsed ? (
          <>
            <Image
              src="/icon-dark.png"
              alt="DataW"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/icon.png"
              alt="DataW"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </>
        ) : (
          <>
            <Image
              src="/logo-dark.png"
              alt="DataW"
              width={100}
              height={100}
              className="dark:hidden"
            />
            <Image
              src="/logo.png"
              alt="DataW"
              width={100}
              height={100}
              className="hidden dark:block"
            />
          </>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto p-4 px-3 flex flex-col">
        {/* Upper Navigation Items */}
        <div className="space-y-0.5 mb-6">
          {upperNavItems.filter(shouldShowNavItem).map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.includes(item.name);
            
            // Check if any submenu item is active
            const isSubmenuActive =
              hasSubmenu &&
              item.submenu?.some(
                (sub) =>
                  pathname === sub.href || pathname?.startsWith(sub.href + "/")
              );
            
            // For items with submenu: only active if submenu item is active
            // For items without submenu: check exact match or starts with (but not if it's a submenu path)
            let isActive = false;
            if (hasSubmenu) {
              // If item has submenu, only mark as active if a submenu item is active
              isActive = isSubmenuActive || false;
            } else {
              // For items without submenu, check exact match
              // Also check if pathname starts with href, but exclude paths that belong to other menu items
              if (pathname === item.href) {
                isActive = true;
              } else if (pathname?.startsWith(item.href + "/")) {
                // Check if this path doesn't belong to any other menu item's submenu
                const belongsToOtherSubmenu = upperNavItems.some((otherItem) => {
                  if (otherItem === item || !otherItem.submenu) return false;
                  return otherItem.submenu.some(
                    (sub) =>
                      pathname === sub.href || pathname?.startsWith(sub.href + "/")
                  );
                });
                isActive = !belongsToOtherSubmenu;
              }
            }

            if (hasSubmenu && !collapsed) {
              // Filter submenu items based on user role using the helper
              const filteredSubmenu = item.submenu ? filterSubmenuByRole(item.submenu) : [];

              // Don't render the menu if all submenu items are filtered out
              if (!filteredSubmenu || filteredSubmenu.length === 0) {
                return null;
              }

              return (
                <div key={item.name} className="space-y-0.5">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md transition-colors",
                      isActive || isSubmenuActive
                        ? "bg-cyan-50 dark:bg-cyan-900/20 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isActive || isSubmenuActive
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-gray-400 dark:text-gray-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isActive || isSubmenuActive
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 space-y-0.5">
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
                              "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs",
                              isSubActive
                                ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                            )}
                          >
                            <span>{subItem.name}</span>
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
                  "flex items-center gap-2 px-2 py-2 rounded-md transition-colors",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-cyan-50 dark:bg-cyan-900/20 text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Accepted Projects Section (Collectors only) - More Visible */}
        {profile?.role === 'collector' && !collapsed && (
          <div className="mb-6 mt-6 border-t-2 border-cyan-500/30 dark:border-cyan-400/30 pt-4 bg-cyan-50/30 dark:bg-cyan-900/10 rounded-lg px-2 py-3">
            <div className="px-2 mb-3">
              <h3 className="text-xs font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                Running Projects
              </h3>
            </div>
            {loadingProjects ? (
              <div className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : acceptedProjects.length === 0 ? (
              <div className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                No active projects
              </div>
            ) : (
              <div className="space-y-0.5">
                {(showAllProjects ? acceptedProjects : acceptedProjects.slice(0, 3)).map((assignment) => {
                  const isActive = pathname === `/submit/${assignment.submission_token}`;
                  return (
                    <Link
                      key={assignment.id}
                      href={`/submit/${assignment.submission_token}`}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-xs font-medium",
                        isActive
                          ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-600"
                          : "text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400"
                      )}
                      title={assignment.project?.title || 'Project'}
                    >
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate flex-1">
                        {assignment.project?.title || 'Untitled Project'}
                      </span>
                    </Link>
                  );
                })}
                {acceptedProjects.length > 3 && (
                  <button
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {showAllProjects ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>Show All ({acceptedProjects.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Large Vertical Space */}
        <div className="flex-1" />

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
                  "flex items-center gap-2 px-2 py-2 rounded-md transition-colors",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-cyan-50 dark:bg-cyan-900/20 text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400"
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

      {/* User Profile at Bottom */}
      <div
        className={cn(
          "px-3 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0",
          collapsed && "px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-2"
          )}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {profile?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
