"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type JobsTab = "all" | "best" | "recent" | "saved";

interface JobsTabsBarProps {
  activeTab: JobsTab;
  onChangeTab: (tab: JobsTab) => void;
  savedCount: number;
  showAllTab?: boolean;
  showSavedTab?: boolean;
  showDistanceSelect: boolean;
  maxDistance: number;
  onChangeDistance: (distance: number) => void;
  variant?: "dashboard" | "projects";
}

const DISTANCE_OPTIONS = [
  { value: "0", label: "All distances" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
  { value: "100", label: "Within 100 km" },
  { value: "250", label: "Within 250 km" },
] as const;

export default function JobsTabsBar({
  activeTab,
  onChangeTab,
  savedCount,
  showAllTab = false,
  showSavedTab = true,
  showDistanceSelect,
  maxDistance,
  onChangeDistance,
  variant = "dashboard",
}: JobsTabsBarProps) {
  const activeClass =
    variant === "projects"
      ? "border-cyan-500 text-cyan-400"
      : "border-cyan-500 text-cyan-600 dark:text-cyan-400";
  const inactiveClass =
    variant === "projects"
      ? "border-transparent text-white/60 hover:text-white"
      : "border-transparent text-muted-foreground hover:text-foreground";

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap text-xs sm:gap-5 sm:text-sm">
        {showAllTab && (
          <button
            type="button"
            onClick={() => onChangeTab("all")}
            className={cn(
              "py-1 border-b-2 transition-colors font-medium",
              activeTab === "all" ? activeClass : inactiveClass,
            )}
          >
            All Jobs
          </button>
        )}
        <button
          type="button"
          onClick={() => onChangeTab("best")}
          className={cn("py-1 border-b-2 transition-colors font-medium", activeTab === "best" ? activeClass : inactiveClass)}
        >
          Best Matches
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("recent")}
          className={cn("py-1 border-b-2 transition-colors font-medium", activeTab === "recent" ? activeClass : inactiveClass)}
        >
          Recent Jobs
        </button>
        {showSavedTab && (
          <button
            type="button"
            onClick={() => onChangeTab("saved")}
            className={cn(
              "py-1 border-b-2 transition-colors font-medium",
              activeTab === "saved" ? activeClass : inactiveClass,
            )}
          >
            Saved Jobs
            {savedCount > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold",
                  variant === "projects"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
                )}
              >
                {savedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {showDistanceSelect ? (
        <Select
          value={String(maxDistance)}
          onValueChange={(val) => onChangeDistance(Number(val))}
        >
          <SelectTrigger
            className={cn(
              variant === "projects"
                ? "h-9 w-full sm:w-[140px] text-sm bg-[#0f172a] border border-white/10 rounded-lg text-white hover:bg-[#0f172a] focus:border-cyan-500 focus:ring-cyan-500/20"
                : "h-7 w-[130px] text-xs bg-white dark:bg-gray-800 border dark:border-none shadow-none",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={cn(
              variant === "projects"
                ? "bg-[#0f172a] text-white border-white/10 dark:border-white/10"
                : "bg-white dark:bg-gray-800 border dark:border-none shadow-none",
            )}
          >
            {DISTANCE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className={cn(
                  "cursor-pointer",
                  variant === "projects"
                    ? "hover:bg-white/10 focus:bg-white/10"
                    : "text-xs hover:bg-gray-100 dark:hover:bg-gray-700/50",
                )}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div />
      )}
    </div>
  );
}
