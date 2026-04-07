"use client";

import { useEffect, useState } from "react";
import { ArrowUpToLine } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] sm:bottom-8 sm:right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/90 text-white shadow-lg transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#28303E] touch-manipulation"
      aria-label="Scroll to top"
    >
      <ArrowUpToLine className="h-5 w-5" />
    </button>
  );
}
