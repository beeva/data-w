"use client";

import type { DataItem } from "./DataItemCard";
import { cn } from "@/lib/utils";

export function DataItemRequirementsTags({
  item,
  className,
  size = "card",
}: {
  item: Pick<DataItem, "data_types" | "formats">;
  className?: string;
  size?: "card" | "list";
}) {
  const types = item.data_types?.filter(Boolean) ?? [];
  const formats = item.formats?.filter(Boolean) ?? [];
  if (types.length === 0 && formats.length === 0) return null;

  const pill =
    size === "list"
      ? "rounded px-1.5 py-px text-[10px] font-medium"
      : "rounded-md px-1.5 py-0.5 text-[10px] font-medium";

  return (
    <div className={cn("space-y-1.5", className)}>
      {types.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Data types
          </p>
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <span
                key={t}
                className={cn(
                  pill,
                  "border border-cyan-500/25 bg-cyan-500/10 text-cyan-200/90",
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {formats.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Formats
          </p>
          <div className="flex flex-wrap gap-1">
            {formats.map((f) => (
              <span
                key={f}
                className={cn(
                  pill,
                  "border border-white/15 bg-white/[0.08] text-white/70",
                )}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
