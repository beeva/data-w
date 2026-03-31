"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type JobsTab = "best" | "recent" | "saved";

const DISTANCE_OPTIONS = [
  { value: "0", label: "All distances" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
  { value: "100", label: "Within 100 km" },
  { value: "250", label: "Within 250 km" },
] as const;

interface JobsTabsBarProps {
  activeTab: JobsTab;
  onChangeTab: (tab: JobsTab) => void;
  savedCount: number;
  showDistanceSelect: boolean;
  maxDistance: number;
  onChangeDistance: (distance: number) => void;
  compact?: boolean;
}

export default function JobsTabsBar({
  activeTab,
  onChangeTab,
  savedCount,
  showDistanceSelect,
  maxDistance,
  onChangeDistance,
  compact = false,
}: JobsTabsBarProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => onChangeTab("best")}
          className={cn(
            "py-1 border-b-2 transition-colors font-medium",
            activeTab === "best"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Best Matches
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("recent")}
          className={cn(
            "py-1 border-b-2 transition-colors font-medium",
            activeTab === "recent"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Recent Jobs
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("saved")}
          className={cn(
            "py-1 border-b-2 transition-colors font-medium",
            activeTab === "saved"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Saved Jobs
          {savedCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showDistanceSelect && (
          <Select
            value={String(maxDistance)}
            onValueChange={(val) => onChangeDistance(Number(val))}
          >
            <SelectTrigger
              className={cn(
                "border-none text-foreground",
                compact
                  ? "h-7 w-[130px] text-xs bg-white dark:bg-gray-800 shadow-none"
                  : "h-9 w-[140px] text-sm bg-gray-50 dark:bg-gray-800/50",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className={cn(
                "text-foreground border-none",
                compact
                  ? "bg-white dark:bg-gray-800 shadow-none"
                  : "bg-gray-50 dark:bg-[#111827] dark:border-gray-700",
              )}
            >
              {DISTANCE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "cursor-pointer",
                    compact
                      ? "text-xs hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                  )}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
