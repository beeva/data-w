"use client";

import { cn } from "@/lib/utils";

interface MacWindowProps {
  title?: string;
  url?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/** macOS-style browser window: traffic lights, title bar, optional URL bar, rounded corners */
export function MacWindow({
  title = "Projects",
  url = "data-w.io/projects",
  children,
  className,
  contentClassName,
}: MacWindowProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-transparent",
        "animate-in fade-in slide-in-from-right-6 duration-500",
        className,
      )}
    >
      {/* Title bar - macOS style */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-transparent border-b border-white/5">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      {/* Window content */}
      <div
        className={cn(
          "overflow-hidden border-t border-white/5 bg-transparent",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
