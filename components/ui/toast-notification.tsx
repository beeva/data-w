"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function ToastNotification({
  message,
  type = "success",
  duration = 5000,
  onClose,
}: ToastNotificationProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Trigger enter → visible immediately
    const enterTimer = setTimeout(() => setPhase("visible"), 10);

    // Start exit animation before removing
    const exitTimer = setTimeout(() => setPhase("exit"), duration - 400);

    // Remove toast after full duration
    const removeTimer = setTimeout(() => onClose(), duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "from-emerald-500 to-emerald-600"
      : type === "error"
      ? "from-red-500 to-red-600"
      : "from-blue-500 to-blue-600";

  const icon =
    type === "success" ? (
      <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
    ) : type === "error" ? (
      <X className="w-5 h-5 text-white flex-shrink-0" />
    ) : (
      <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
    );

  return (
    <div
      className={`
        fixed top-6 right-6 z-[9999] flex items-center gap-3
        bg-gradient-to-r ${bgColor}
        text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl
        min-w-[280px] max-w-[400px]
        transition-all duration-400 ease-out
        ${
          phase === "enter"
            ? "opacity-0 translate-x-8 scale-95"
            : phase === "exit"
            ? "opacity-0 translate-x-8 scale-95"
            : "opacity-100 translate-x-0 scale-100"
        }
      `}
      role="alert"
    >
      {icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={() => {
          setPhase("exit");
          setTimeout(onClose, 300);
        }}
        className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
