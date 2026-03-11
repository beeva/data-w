"use client";

import { useEffect, useState } from "react";
import { Check, X, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "pending" | "info";

export interface ToastNotificationProps {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeConfig: Record<
  ToastType,
  {
    defaultTitle: string;
    icon: React.ReactNode;
    iconBgLight: string;
    iconBgDark: string;
  }
> = {
  success: {
    defaultTitle: "Verification successful",
    icon: <Check className="size-4 text-white" strokeWidth={2.5} />,
    iconBgLight: "bg-[#4CAF50]",
    iconBgDark: "dark:bg-[#66BB6A]",
  },
  error: {
    defaultTitle: "Verification failed",
    icon: <X className="size-4 text-white" strokeWidth={2.5} />,
    iconBgLight: "bg-[#F44336]",
    iconBgDark: "dark:bg-[#EF5350]",
  },
  pending: {
    defaultTitle: "Verification pending",
    icon: <CircleAlert className="size-4 text-white" strokeWidth={2.5} />,
    iconBgLight: "bg-[#FFC107]",
    iconBgDark: "dark:bg-[#FFCA28]",
  },
  info: {
    defaultTitle: "Notice",
    icon: <CircleAlert className="size-4 text-white" strokeWidth={2.5} />,
    iconBgLight: "bg-[#FFC107]",
    iconBgDark: "dark:bg-[#FFCA28]",
  },
};

export default function ToastNotification({
  title,
  message,
  type = "success",
  duration = 5000,
  onClose,
}: ToastNotificationProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const config = typeConfig[type];
  const displayTitle = title ?? config.defaultTitle;

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("visible"), 10);
    const exitTimer = setTimeout(() => setPhase("exit"), duration - 400);
    const removeTimer = setTimeout(() => onClose(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setPhase("exit");
    setTimeout(onClose, 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed top-6 right-6 z-[9999] flex min-w-[320px] max-w-[420px]",
        "rounded-[10px] shadow-lg",
        "bg-[#ffffff] dark:bg-[#2C2C2C]",
        "text-[#333333] dark:text-[#EEEEEE]",
        "transition-all duration-300 ease-out",
        phase === "enter" && "translate-x-4 opacity-0",
        phase === "visible" && "translate-x-0 opacity-100",
        phase === "exit" && "translate-x-4 opacity-0",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center size-8 rounded-full m-3",
          config.iconBgLight,
          config.iconBgDark,
        )}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex flex-1 min-w-0 py-3 pr-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold leading-tight text-[#333333] dark:text-[#EEEEEE]">
            {displayTitle}
          </p>
          <p className="text-[13px] font-normal leading-snug text-[#666666] dark:text-[#BBBBBB]">
            {message}
          </p>
        </div>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          "shrink-0 p-2 mt-2 mr-2 rounded-md transition-colors w-8 h-8 flex items-center justify-center",
          "text-[#666666] hover:text-[#333333] hover:bg-black/5",
          "dark:text-[#BBBBBB] dark:hover:text-[#EEEEEE] dark:hover:bg-white/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#666666]/30 dark:focus-visible:ring-[#BBBBBB]/30",
        )}
        aria-label="Close notification"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
