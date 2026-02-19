import React from "react";
import {
  CreditCard,
  User,
  HelpCircle,
  FolderKanban,
  Home,
  Users,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Custom 3x3 Grid Icon for Dashboard
export const GridIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="5" height="5" rx="0.5" />
    <rect x="9.5" y="3" width="5" height="5" rx="0.5" />
    <rect x="16" y="3" width="5" height="5" rx="0.5" />
    <rect x="3" y="9.5" width="5" height="5" rx="0.5" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
    <rect x="16" y="9.5" width="5" height="5" rx="0.5" />
    <rect x="3" y="16" width="5" height="5" rx="0.5" />
    <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
    <rect x="16" y="16" width="5" height="5" rx="0.5" />
  </svg>
);

export type UserRole = 'requester' | 'collector' | 'agent' | 'admin';

export interface SubMenuItem {
  name: string;
  href: string;
  roles?: UserRole[]; // If not specified, show for all roles
}

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }> | LucideIcon;
  submenu?: SubMenuItem[];
  roles?: UserRole[]; // If not specified, show for all roles
}

export const upperNavItems: NavItem[] = [
  {
    name: "Home",
    href: "/dashboard/home",
    icon: Home,
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    submenu: [
      { name: "Projects", href: "/dashboard/projects/active", roles: ['requester', 'admin'] },
      { name: "Create New Project", href: "/dashboard/projects/new", roles: ['requester', 'admin'] },
    ],
  },
  {
    name: "Find Projects",
    href: "/dashboard/projects/find",
    icon: FolderKanban,
    roles: ['collector'],
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ['admin'],
  },
];

export const lowerNavItems: NavItem[] = [
  {
    name: "Billing & Subscription",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    name: "Account settings",
    href: "/dashboard/settings",
    icon: User,
  },
  {
    name: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
];
