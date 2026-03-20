"use client";

import { useState, useEffect, useRef } from "react";
import { MacWindow } from "./MacWindow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Camera,
  Video,
  Mic,
  FileText,
  BarChart3,
  MapPinned,
  MapPin,
  Cpu,
  Briefcase,
  Check,
  Send,
  type LucideIcon,
} from "lucide-react";

const CONFETTI_COLORS = ["#d13447", "#ffbf00", "#263672"];

type ConfettiPiece = {
  leftStart: number;
  leftEnd: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
};

function ConfettiLayerJobs() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const count = 201;
    const next: ConfettiPiece[] = [];
    for (let i = 0; i < count; i++) {
      const size = 1 + Math.floor(Math.random() * 8);
      const left = 1 + Math.floor(Math.random() * 100);
      const leftEnd = left + Math.floor(Math.random() * 15);
      next.push({
        leftStart: left,
        leftEnd,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 2,
        size,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        opacity: 0.5 + Math.random(),
        rotation: Math.random() * 360,
      });
    }
    setPieces(next);
  }, []);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece, index) => (
        <div
          key={index}
          className="confetti-piece-jobs"
          style={{
            width: `${piece.size}px`,
            height: `${piece.size * 0.4}px`,
            backgroundColor: piece.color,
            opacity: Math.min(piece.opacity, 1),
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            ["--left-start" as string]: `${piece.leftStart}%`,
            ["--left-end" as string]: `${piece.leftEnd}%`,
          }}
        />
      ))}
    </div>
  );
}

const JOB_CARD_ICONS: LucideIcon[] = [
  Camera,
  Video,
  Mic,
  FileText,
  BarChart3,
  MapPinned,
  Cpu,
  Briefcase,
];

const CARD_HEIGHT_PX = 64;
const CYCLE_INTERVAL_MS = 3000;
const SLIDE_UP_DURATION_MS = 380;
const EXIT_DURATION_MS = SLIDE_UP_DURATION_MS; // match so list update happens when slide ends
const ENTER_DURATION_MS = 500;
const SLIDE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)"; // smooth ease-out

const GAP_PX = 12; // space-y-3
const DRAWER_SCROLL_PX = 240; // translateY when map is shown; submit button moves up by this amount

/** Skeleton for one filter section: label + checkbox-style rows; optional check in first row when applied */
function FilterSectionSkeleton({
  labelWidth = "w-12",
  rows = 3,
  showCheck = false,
}: {
  labelWidth?: string;
  rows?: number;
  showCheck?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", showCheck && "filter-section-focus")}>
      <Skeleton
        className={cn(
          "h-2.5 rounded",
          labelWidth,
          "bg-gray-200/90 dark:bg-white/10",
        )}
      />
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {showCheck && i === 0 ? (
              <Check className="filter-check-enter h-3 w-3 shrink-0 text-gray-400 dark:text-white/40" />
            ) : (
              <Skeleton className="h-3 w-3 shrink-0 rounded-sm bg-gray-200/90 dark:bg-white/10" />
            )}
            <Skeleton className="h-2.5 flex-1 min-w-0 max-w-[80px] rounded bg-gray-200/90 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton matching project/job card layout; supports enter animation: slide from right + staggered sections, or slide-in from bottom (filtered); optional hover scale + click (scale back) */
function JobCardSkeleton({
  id,
  isEntering,
  slideInIndex,
  isHovered,
  isClicked,
}: {
  id: number;
  isEntering?: boolean;
  slideInIndex?: number | null;
  isHovered?: boolean;
  isClicked?: boolean;
}) {
  const stagger = (i: number) =>
    isEntering ? { animationDelay: `${80 + i * 65}ms` } : {};
  const sectionClass = isEntering ? "job-section-enter" : "";
  const Icon = JOB_CARD_ICONS[id % JOB_CARD_ICONS.length];
  const isSlideIn = slideInIndex != null;

  return (
    <div
      className={cn(
        "flex items-stretch gap-1.5 p-2 rounded-md overflow-hidden",
        "bg-white/50 dark:bg-white/[0.03]",
        isEntering && "job-card-enter",
        isSlideIn && "job-card-slide-in",
        isHovered && !isClicked && "job-card-hover",
        isClicked && "job-card-clicked",
      )}
      style={
        isSlideIn ? { animationDelay: `${slideInIndex * 333}ms` } : undefined
      }
    >
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
          "bg-gray-200/90 dark:bg-white/10 text-gray-400 dark:text-white/40",
          sectionClass,
        )}
        style={stagger(0)}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className={cn(sectionClass)} style={stagger(2)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Skeleton className="h-2 w-8 rounded bg-gray-200/90 dark:bg-white/10" />
            <Skeleton className="h-2 w-11 rounded bg-gray-200/90 dark:bg-white/10" />
          </div>
        </div>
        <div className={cn("space-y-0.5", sectionClass)} style={stagger(3)}>
          <Skeleton className="h-2 w-full rounded bg-gray-200/90 dark:bg-white/10" />
          <Skeleton className="h-2 w-3/4 rounded bg-gray-200/90 dark:bg-white/10" />
        </div>
        <div
          className={cn("flex flex-wrap gap-0.5", sectionClass)}
          style={stagger(4)}
        >
          <Skeleton className="h-3 w-9 rounded-full bg-gray-200/90 dark:bg-white/10" />
          <Skeleton className="h-3 w-10 rounded-full bg-gray-200/90 dark:bg-white/10" />
          <Skeleton className="h-3 w-7 rounded-full bg-gray-200/90 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * macOS-style browser window: structure-only UI with skeletons.
 * Layout: traffic lights + URL bar → top (search bar + button) → two columns (filter sidebar | list items).
 */
interface JobsListWindowProps {
  className?: string;
}

const CYCLES_BEFORE_FILTER = 2;

export function JobsListWindow({ className }: JobsListWindowProps = {}) {
  const [list, setList] = useState<number[]>([0, 1, 2, 3, 4]);
  const [isExiting, setIsExiting] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showFilterAnimation, setShowFilterAnimation] = useState(false);
  const [cursorArrivedAtFilter, setCursorArrivedAtFilter] = useState(false);
  const [cursorAtFirstCard, setCursorAtFirstCard] = useState(false);
  const [cardClicked, setCardClicked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cursorAtDrawer, setCursorAtDrawer] = useState(false);
  const [cursorArrivedAtDrawer, setCursorArrivedAtDrawer] = useState(false);
  const [cursorAtSubmitButton, setCursorAtSubmitButton] = useState(false);
  const [submitButtonClicked, setSubmitButtonClicked] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  type ListPhase = "visible" | "hidden" | "slideIn";
  const [listPhase, setListPhase] = useState<ListPhase>("visible");
  const filterAnimationTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const cursorArrivedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const listPhaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cursorToCardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cardClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const drawerOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cursorToDrawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cursorArrivedAtDrawerTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const cursorToSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const submitClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const congratsShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const congratsAutoHideRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const completedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextEnteringRef = useRef<number | null>(null);
  const cycleCountRef = useRef(0);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 4 cards when cycling or after stop (before check); 3 cards only when slideIn
  const cardCount = listPhase === "slideIn" ? 3 : 4;
  const listHeight = cardCount * CARD_HEIGHT_PX + (cardCount - 1) * GAP_PX + 44;

  // 1s after cards stop, trigger cursor move to filter; check shows only after cursor arrives
  useEffect(() => {
    if (!filtersApplied) return;
    filterAnimationTimeoutRef.current = setTimeout(() => {
      setShowFilterAnimation(true);
    }, 1000);
    return () => {
      if (filterAnimationTimeoutRef.current)
        clearTimeout(filterAnimationTimeoutRef.current);
    };
  }, [filtersApplied]);

  // Show check + filter section focus only after cursor has arrived (400ms = cursor transition)
  useEffect(() => {
    if (!showFilterAnimation) return;
    cursorArrivedTimeoutRef.current = setTimeout(() => {
      setCursorArrivedAtFilter(true);
    }, 400);
    return () => {
      if (cursorArrivedTimeoutRef.current)
        clearTimeout(cursorArrivedTimeoutRef.current);
    };
  }, [showFilterAnimation]);

  // After check animation (~650ms), hide cards; then after 300ms show 3 cards with 1s slide-in
  useEffect(() => {
    if (!showFilterAnimation) return;
    const t1 = setTimeout(() => {
      setListPhase("hidden");
      listPhaseTimeoutRef.current = setTimeout(() => {
        setListPhase("slideIn");
      }, 300);
    }, 650);
    return () => {
      clearTimeout(t1);
      if (listPhaseTimeoutRef.current)
        clearTimeout(listPhaseTimeoutRef.current);
    };
  }, [showFilterAnimation]);

  // After 3 cards have slid in, move cursor to first job card (~1.2s for last card to finish)
  useEffect(() => {
    if (listPhase !== "slideIn") return;
    cursorToCardTimeoutRef.current = setTimeout(() => {
      setCursorAtFirstCard(true);
    }, 1200);
    return () => {
      if (cursorToCardTimeoutRef.current)
        clearTimeout(cursorToCardTimeoutRef.current);
    };
  }, [listPhase]);

  // After hover, "click" (scale back to origin) then open drawer
  useEffect(() => {
    if (!cursorAtFirstCard) return;
    cardClickTimeoutRef.current = setTimeout(() => {
      setCardClicked(true);
    }, 400 + 700); // 400ms cursor travel + 0.7s hover on card, then click
    return () => {
      if (cardClickTimeoutRef.current)
        clearTimeout(cardClickTimeoutRef.current);
    };
  }, [cursorAtFirstCard]);

  useEffect(() => {
    if (!cardClicked) return;
    drawerOpenTimeoutRef.current = setTimeout(() => {
      setDrawerOpen(true);
    }, 350);
    return () => {
      if (drawerOpenTimeoutRef.current)
        clearTimeout(drawerOpenTimeoutRef.current);
    };
  }, [cardClicked]);

  // After drawer is shown, move cursor to drawer section
  useEffect(() => {
    if (!drawerOpen) return;
    cursorToDrawerTimeoutRef.current = setTimeout(() => {
      setCursorAtDrawer(true);
    }, 400);
    return () => {
      if (cursorToDrawerTimeoutRef.current)
        clearTimeout(cursorToDrawerTimeoutRef.current);
    };
  }, [drawerOpen]);

  // After cursor arrives at drawer, trigger scroll + show map
  useEffect(() => {
    if (!cursorAtDrawer) return;
    cursorArrivedAtDrawerTimeoutRef.current = setTimeout(() => {
      setCursorArrivedAtDrawer(true);
    }, 400);
    return () => {
      if (cursorArrivedAtDrawerTimeoutRef.current)
        clearTimeout(cursorArrivedAtDrawerTimeoutRef.current);
    };
  }, [cursorAtDrawer]);

  // After scroll to map, move cursor to Submit button
  useEffect(() => {
    if (!cursorArrivedAtDrawer) return;
    cursorToSubmitTimeoutRef.current = setTimeout(() => {
      setCursorAtSubmitButton(true);
    }, 700);
    return () => {
      if (cursorToSubmitTimeoutRef.current)
        clearTimeout(cursorToSubmitTimeoutRef.current);
    };
  }, [cursorArrivedAtDrawer]);

  // After cursor arrives at submit button, then run click animation (delay so cursor is on button first)
  useEffect(() => {
    if (!cursorAtSubmitButton) return;
    submitClickTimeoutRef.current = setTimeout(() => {
      setSubmitButtonClicked(true);
    }, 500); // 400ms cursor travel + buffer so cursor is on button before click
    return () => {
      if (submitClickTimeoutRef.current)
        clearTimeout(submitClickTimeoutRef.current);
    };
  }, [cursorAtSubmitButton]);

  useEffect(() => {
    if (!submitButtonClicked) return;
    congratsShowTimeoutRef.current = setTimeout(() => {
      setShowCongrats(true);
      setDrawerOpen(false); // hide drawer when showing congrats
    }, 500);
    return () => {
      if (congratsShowTimeoutRef.current)
        clearTimeout(congratsShowTimeoutRef.current);
    };
  }, [submitButtonClicked]);

  // Lottie: congratulation then confirm when congrats overlay is shown
  useEffect(() => {
    if (!showCongrats || typeof window === "undefined") return;
    const canvas = completedCanvasRef.current;
    if (!canvas) return;

    let animation: { destroy: () => void } | null = null;
    let cancelled = false;

    import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        if (cancelled) return;
        const playConfirm = () => {
          if (cancelled) return;
          if (animation) {
            animation.destroy();
            animation = null;
          }
          animation = new DotLottie({
            canvas,
            src: "/lottie/confirm.lottie",
            autoplay: true,
            loop: false,
          });
        };
        animation = new DotLottie({
          canvas,
          src: "/lottie/congratulation.lottie",
          autoplay: true,
          loop: false,
        });
        (
          animation as unknown as {
            addEventListener?: (e: string, fn: () => void) => void;
          }
        ).addEventListener?.("complete", playConfirm);
      })
      .catch((err) => console.error("Congrats lottie failed", err));

    return () => {
      cancelled = true;
      if (animation) animation.destroy();
    };
  }, [showCongrats]);

  // Auto-hide congrats overlay after 5s, then reset all state so animations repeat forever
  const resetAllForRepeat = useRef(() => {
    setShowCongrats(false);
    setFiltersApplied(false);
    setShowFilterAnimation(false);
    setCursorArrivedAtFilter(false);
    setCursorAtFirstCard(false);
    setCardClicked(false);
    setDrawerOpen(false);
    setCursorAtDrawer(false);
    setCursorArrivedAtDrawer(false);
    setCursorAtSubmitButton(false);
    setSubmitButtonClicked(false);
    setListPhase("visible");
    setList([0, 1, 2, 3, 4]);
    setIsExiting(false);
    setSkipTransition(false);
    setEnteringId(null);
    cycleCountRef.current = 0;
  });

  useEffect(() => {
    if (!showCongrats) return;
    congratsAutoHideRef.current = setTimeout(() => {
      resetAllForRepeat.current();
    }, 5000);
    return () => {
      if (congratsAutoHideRef.current)
        clearTimeout(congratsAutoHideRef.current);
    };
  }, [showCongrats]);

  // After we reset list + transform, re-enable transition for next cycle
  useEffect(() => {
    if (!skipTransition) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipTransition(false));
    });
    return () => cancelAnimationFrame(id);
  }, [skipTransition]);

  useEffect(() => {
    if (filtersApplied) return;

    const startCycle = () => {
      cycleCountRef.current += 1;
      const shouldStopAfterThisCycle =
        cycleCountRef.current >= CYCLES_BEFORE_FILTER;

      setIsExiting(true);
      cycleTimeoutRef.current = setTimeout(() => {
        setList((prev) => {
          nextEnteringRef.current = prev[0];
          return [prev[1], prev[2], prev[3], prev[0], prev[4]];
        });
        setIsExiting(false);
        setSkipTransition(true);
        setEnteringId(nextEnteringRef.current);
        nextEnteringRef.current = null;
        enterTimeoutRef.current = setTimeout(() => {
          setEnteringId(null);
          if (shouldStopAfterThisCycle) {
            setFiltersApplied(true);
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
            }
          }
        }, ENTER_DURATION_MS + 400);
      }, EXIT_DURATION_MS);
    };

    intervalIdRef.current = setInterval(startCycle, CYCLE_INTERVAL_MS);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    };
  }, [filtersApplied]);

  return (
    <div className={cn("relative w-full max-w-xl", className)}>
      {/* Congrats overlay: only over JobsListWindow section, confetti scoped here, auto-hide 5s */}
      {showCongrats && (
        <div className="absolute inset-0 z-50 rounded-b-xl overflow-hidden bg-black/50 flex items-center justify-center top-9">
          <ConfettiLayerJobs />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-3">
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-transparent">
              <canvas
                ref={completedCanvasRef}
                className="w-full h-full"
                aria-label="Congratulations animation"
              />
            </div>
            <p className="text-sm sm:text-base font-semibold text-white">
              Proposal Submitted! 🎉
            </p>
          </div>
        </div>
      )}
      <MacWindow
        title="Projects"
        url="data-w.io/projects"
        className="w-full"
        contentClassName="min-h-[360px] lg:min-h-[360px] relative"
      >
        {/* Mouse cursor: search → filter/check → first job card (hand) → drawer (arrow) → submit (hand) */}
        <div
          className="pointer-events-none absolute z-40 transition-all duration-[400ms] ease-out"
          style={{
            left: cursorAtSubmitButton
              ? 468
              : cursorAtDrawer
                ? 382
                : cursorAtFirstCard
                  ? 158
                  : showFilterAnimation
                    ? 26
                    : 72,
            // Submit button is inside scrolled drawer: content moved up by DRAWER_SCROLL_PX so button Y is reduced
            top: cursorAtSubmitButton
              ? 318 - DRAWER_SCROLL_PX + 10
              : cursorAtDrawer
                ? 178
                : cursorAtFirstCard
                  ? 108
                  : showFilterAnimation
                    ? 104
                    : 54,
          }}
          aria-hidden
        >
          {cursorAtSubmitButton && !showCongrats && drawerOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 drop-shadow-sm text-gray-800 dark:text-gray-200"
              aria-hidden
            >
              <path
                d="m30 17a2.984 2.984 0 0 0 -1.116.22 2.961 2.961 0 0 0 -4.355-1.82 2.94 2.94 0 0 0 -3.529-1.216v-6.184a3 3 0 0 0 -6 0v13.149l-.035-.044a4.587 4.587 0 0 0 -6.365-.805 2.59 2.59 0 0 0 -.6 3.506l4.5 6.754a9.954 9.954 0 0 0 8.3 4.44h2.281a9.963 9.963 0 0 0 9.167-6.044 9.225 9.225 0 0 0 .752-3.656v-5.3a3 3 0 0 0 -3-3z"
                fill="currentColor"
              />
            </svg>
          ) : cursorAtFirstCard && !cursorAtDrawer ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 drop-shadow-sm text-gray-800 dark:text-gray-200"
              aria-hidden
            >
              <path
                d="m30 17a2.984 2.984 0 0 0 -1.116.22 2.961 2.961 0 0 0 -4.355-1.82 2.94 2.94 0 0 0 -3.529-1.216v-6.184a3 3 0 0 0 -6 0v13.149l-.035-.044a4.587 4.587 0 0 0 -6.365-.805 2.59 2.59 0 0 0 -.6 3.506l4.5 6.754a9.954 9.954 0 0 0 8.3 4.44h2.281a9.963 9.963 0 0 0 9.167-6.044 9.225 9.225 0 0 0 .752-3.656v-5.3a3 3 0 0 0 -3-3z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-sm"
            >
              <path
                d="M5.5 3.5L5.5 20.5L10 16L14 21L16 20L12 15L19 14L5.5 3.5Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
                className="text-gray-800 dark:text-gray-200"
              />
            </svg>
          )}
        </div>

        {/* Top: search bar (icon + input) + Filters button */}
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-lg bg-gray-100/80 dark:bg-white/5">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm bg-gray-200/90 dark:bg-white/10" />
            <Skeleton className="h-3 flex-1 min-w-0 max-w-[140px] rounded bg-gray-200/90 dark:bg-white/10" />
          </div>
          <Skeleton className="h-7 w-14 rounded-md bg-gray-200/90 dark:bg-white/10 shrink-0" />
        </div>

        {/* Two columns: sidebar | list */}
        <div className="flex flex-1 min-h-[300px]">
          {/* Left: filter sidebar - structure similar to real filter (Category, Data Types, Country) */}
          <div className="w-24 sm:w-28 lg:w-32 flex-shrink-0 p-3 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <Skeleton className="h-3 w-10 rounded bg-gray-200/90 dark:bg-white/10" />
              <Skeleton className="h-2.5 w-8 rounded bg-gray-200/90 dark:bg-white/10" />
            </div>
            <FilterSectionSkeleton
              labelWidth="w-14"
              rows={3}
              showCheck={cursorArrivedAtFilter}
            />
            <div className="h-px bg-gray-200/80 dark:bg-white/10 shrink-0" />
            <FilterSectionSkeleton labelWidth="w-16" rows={3} />
            <div className="h-px bg-gray-200/80 dark:bg-white/10 shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-12 rounded bg-gray-200/90 dark:bg-white/10" />
              <Skeleton className="h-6 w-full rounded-md bg-gray-200/90 dark:bg-white/10" />
            </div>
          </div>

          {/* Right: list - 3 cards after cycle; after check: hide all then show 3 cards with slide-in */}
          <div
            className="flex-1 min-w-0 p-3 overflow-hidden"
            style={{ height: listHeight }}
          >
            <div
              className={cn(
                "space-y-3",
                listPhase !== "slideIn" &&
                  !skipTransition &&
                  "will-change-transform",
              )}
              style={{
                transform:
                  listPhase === "slideIn"
                    ? "translate3d(0, 0, 0)"
                    : isExiting
                      ? `translate3d(0, -${CARD_HEIGHT_PX + 4}px, 0)`
                      : "translate3d(0, 0, 0)",
                transition:
                  listPhase === "slideIn"
                    ? "none"
                    : skipTransition
                      ? "none"
                      : `transform ${SLIDE_UP_DURATION_MS}ms ${SLIDE_EASING}`,
              }}
            >
              {listPhase === "hidden"
                ? null
                : listPhase === "slideIn"
                  ? list
                      .slice(0, 3)
                      .map((id, index) => (
                        <JobCardSkeleton
                          key={id}
                          id={id}
                          slideInIndex={index}
                          isHovered={false}
                          isClicked={cardClicked && index === 0}
                        />
                      ))
                  : list
                      .slice(0, cardCount)
                      .map((id) => (
                        <JobCardSkeleton
                          key={id}
                          id={id}
                          isEntering={enteringId === id}
                        />
                      ))}
            </div>
          </div>
        </div>

        {/* Drawer: slides in from right; after cursor arrives, content scrolls up to show map */}
        {drawerOpen && (
          <>
            <div
              className="absolute inset-0 z-20 bg-black/20 dark:bg-black/40"
              aria-hidden
            />
            <div
              className={cn(
                "absolute top-0 right-0 bottom-0 z-30 w-[55%] max-w-[280px] flex flex-col",
                "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
                "shadow-2xl drawer-enter",
              )}
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                <div
                  className={cn("p-4 space-y-4 drawer-content-scrolled")}
                  style={{
                    transform: cursorArrivedAtDrawer
                      ? "translateY(-240px)"
                      : "translateY(0)",
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-24 rounded bg-gray-200/90 dark:bg-white/10" />
                      <Skeleton className="h-6 w-6 rounded-md bg-gray-200/90 dark:bg-white/10 shrink-0" />
                    </div>
                    <Skeleton className="h-5 w-full rounded bg-gray-200/90 dark:bg-white/10" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full rounded bg-gray-200/90 dark:bg-white/10" />
                      <Skeleton className="h-3 w-4/5 rounded bg-gray-200/90 dark:bg-white/10" />
                      <Skeleton className="h-3 w-3/4 rounded bg-gray-200/90 dark:bg-white/10" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-lg bg-gray-200/90 dark:bg-white/10" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20 rounded bg-gray-200/90 dark:bg-white/10" />
                      <Skeleton className="h-3 w-full rounded bg-gray-200/90 dark:bg-white/10" />
                      <Skeleton className="h-3 w-[92%] rounded bg-gray-200/90 dark:bg-white/10" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1 rounded-md bg-gray-200/90 dark:bg-white/10" />
                      <div
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-transform",
                          submitButtonClicked && "drawer-submit-btn-clicked",
                        )}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit
                      </div>
                    </div>
                  </div>

                  {/* Map section: visible after scroll */}
                  <div className="pt-2">
                    <Skeleton className="h-3 w-16 rounded mb-2 bg-gray-200/90 dark:bg-white/10" />
                    <div className="relative rounded-lg overflow-hidden bg-[#e8f0f5] dark:bg-[#0f1729] border border-gray-200/60 dark:border-white/10 aspect-[4/3] min-h-[100px] text-gray-500 dark:text-cyan-700">
                      {/* Realistic map (reference SVG): streets + building blocks */}
                      <svg
                        className="absolute inset-0 w-full h-full [color:inherit]"
                        viewBox="0 0 1000 1000"
                        fill="none"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <defs>
                          <clipPath
                            clipPathUnits="userSpaceOnUse"
                            id="jobs-map-cp"
                          >
                            <path d="m1000.21 1000.11h-1000.21v-1000.21h1000.21z" />
                          </clipPath>
                        </defs>
                        <style>{`.jobs-map-s0{fill:none;stroke:currentColor;stroke-linejoin:round;stroke-width:2}.jobs-map-s1{fill:none;stroke:currentColor;stroke-miterlimit:10;stroke-width:10}`}</style>
                        <g clipPath="url(#jobs-map-cp)">
                          <path
                            className="jobs-map-s0"
                            d="m903.93 961.6l7.41 64.09 84.87-12.46v-57.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m895.03 891.87l4.74 62.02 101.78-8.9v-61.72z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m830.05 909.97l56.96-12.16 12.17 131.74h-50.15z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m712.25 931.93l8.6 48.07 105.34-30.56-11.57-25.52-11.28-12.76z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m721.45 986.53l108.6-22.85 10.68 72.99-112.16 12.17z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m675.26 1026.98l36.99-8.31 8.11 30.17c0 0-22.89 5.28-32.84-2.67-9.89-7.92-12.26-19.19-12.26-19.19z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m638.27 1025l41.54 35.8h-91.19z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m710.27 991.37l-59.34 14.05c0 0 4.55 9.69 12.46 12.26 11.88 3.86 48.86-10.48 48.86-10.48z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m597.32 939.94l50.44 55.19 61.52-13.85-7.32-41.34c0 0-35.07 5.51-46.88 5.64-14.51 0.16-57.76-5.64-57.76-5.64z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m610.97 971.79l-20.37 25.71h48.86z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m574.57 935.59l-61.51 55.78 68.04 6.13 25.89-30.95z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m518.2 1008.58l103.06 5.74-69.83 53.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m521.96 1043.99l18 36.4-82.09 4.55z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m408.02 1014.12l100.09-2.37 12.66 23.34-84.86 42.92z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m369.45 1006.41h29.27l-0.79 36.49z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m312.87 1006.41l32.64-3.56 44.51 47.47-39.37 17.21-37.78-10.09z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m252.94 1002.85l40.94-0.99v46.88h-35.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m177.97 1002.85l58.15 1.38 9.1 44.51h-67.25z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m94.49 997.31l75.76 4.55v49.45h-75.76z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m84.2 997.31h-73.19v51.43h68.64z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-28.74 998.89l32.44 3.16-6.33 46.69h-26.11z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m217.33 980.3v11.86h-37.58v-11.86z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m236.91 966.25v25.91h-14.44v-25.91z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m217.33 962.1v11.27h-37.58l-5.94-53.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m179.75 912.25l42.72 48.66h9.7l-5.94-49.45z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m224.25 868.73v35.8l-48.86 2.38-2.57-35.61z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m218.71 836.02l4.55 22.42h-45.29l-7.13-20.96z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m159.97 840.64l-41.74 5.54 7.51 60.73h37.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m126.34 913.83l1.78 29.08 35.41-3.76v-25.32z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m128.71 948.84l1.98 21.17 34.42 1.58v-26.7z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m67.39 897.61h48.27l7.51 68.64h-56.97z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m21.1 901.76l39.57-2.37v63.5l-39.57 3.36z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-10.35 906.91l19.19 0.99v58.35h-18.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m14.18 849.74h-26.7l-1.39 49.65h28.09z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m21.1 854.09v42.53l40.95-3.95-4.75-38.58z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m70.95 854.09l41.34-6.86 2.57 43.85-43.91 0.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m26.84 804.34l79.52-4.15 4.45 32.64-88.42 10.98z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-10.35 800.19v35.83h24.53l5.54-31.97z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-7.92 722.33l34.91 0.73-5.89 74.16-28.68-5.34z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m33.37 723.34l63.12-1.66 8.39 66.05-74.78 12.46z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m102.09 718.82l46.19-19.97 4.37 84.13-41.84 4.75z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m116.15 795.74l36.5-2.97 1.48 40.95-35.9 1.19z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m163.53 733.73l48.76-19.88 5.04 113.04h-47.77z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m154.59 694.38l6.07 32.52 72.1-29.67-7.71-34.41z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m217.33 733.03h22.75l26.5 238.56 33.75 1.65-0.5 18.93-56.19-0.01z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m267.63 914.33l33.22-2.37-1.52 52.03-27-0.16z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m258.28 800.19l44.72-2.86-1.91 107.32-34.51 2.26z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m233.24 658.73l66.56-30.22 3.69 159.5-47.29 3.28z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m321.5 875.26h6.21v24.03l62.31 86.94-69 5.85z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m336.31 878.82l49.85-6.06 43.62 63.42-39.76 32.84-53.71-67.65z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m394.47 975.25l48.36-24.63 56.08 41.54-94.65-0.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m472.5 962.2h23.15l28.78 9.19-18.99 17.81z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m490.6 950.62l67.95-26.7 12.46 7.12-40.2 36.5z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m554.4 918.88l-90.01 30.26 58.78-47.81z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m445.5 939l9.8 10.14 60.92-51.28-15.6-10.48z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m490.6 881.19l-55.48 46.59-102.66-158.75z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m322.96 773.49v95.24l57.71-4.9z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m319.99 742.03l88.01-8.78 4.86 58.04-4.74 21.07-88.13-55.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m429.78 822.84l129.37 89.01v-43.12l-28.34-8.11 27.15-39.51z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m571.8 821.11h73.59l46.29 34.37v15.03l-150.73-12.46z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m567.06 872.88v33.53h96.13l28.49-28.58z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m608.8 914.42v18.99l-39.07-11.07v-5.94z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m661.41 913.04v20.37l-44.11-0.98v-20.58z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m694.05 887.92l-25.12 23.24v19.09h30.26z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m699.19 845.81l109.49-4.97v59.34l-96.43 18.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m688.81 814.43l119.87 9.2-101.77 9.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m820.85 817.99h64.68l-3.56 61.72-55.78 15.13z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m895.03 817.99l124.02-22.84-7.42 62.9-116.6 25.22z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m816.1 699.31l74.77-12.76 2.38 119.28h-69.14z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m906 774.67l3.27 28.19 108-20.18 6.23-16.61z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m902.44 726.01l3.56 40.06 119.88-10.68-2.38-31.16z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m907.49 686.55l5.34 37.68 110.67-9.49-8.31-40.36z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m674.27 707.91l70.32-2.37v93.46h-43.91z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m753.94 704.05l50.88-3.26 3.86 105.04-59.93-1.78z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m550.74 771.03l118.19-4.07 5.34 32.04h-124.77z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m549.25 734.25l1.24 23.61 109.24-4.55-4.45-21.96z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m419.39 733.03h116.95l-2.71 65.97h-108.9z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m348.48 698.71l-2.67 27.3 188.41-2.37-3.86-24.93z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m544.01 694.26l4.16 31.75 82.19-3.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m317.22 625.43c0 0 84.02-18.76 112.56-20.97 23.43-1.82 93.96 2.77 93.96 2.77l2.37 81.89h-185.94l-3.56 28.48-16.62 6.73z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m534.22 601.29l105.04-7.51 8.31 47.87-94.66 3.56 2.48 41.34h-14.44z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m561.32 649.16h29.57l2.08 40.36-28.48-6.33z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m600.49 649.16h47.08l12.16 75.17-59.24-21.76z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m266.19 506.74l-25.32 3.16 12.66-53.8z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m266.19 514.65l1.98 17.41-14.64 1.98v22.94l-20.77-2.37 8.11-35.61z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m258.28 539.18v14.24l16.61-1.98-6.72-12.26z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m232.76 562.52l45.69-5.54 16.22 49.85-59.17 27.67-18.17-15.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m145.53 640.16l5.31 32.66 74.66-34.07-9.36-8.28-43.76 2.08z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m136.48 638.48l6.77 37.02-46.12 18.81-4.72-48.41z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m91.5 700.69l-7.67 3.89-16.2 0.43-6.22-54.22 25.81-5.04z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m55.92 652.28h-15.73l-5.04 28.48 24.18-2.74z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m35.15 690.85l26.26-2.52v16.67l-26.26 0.5z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m30.1 657.92l-37.68 2.52v44.06h30.71z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m32.63 589.67v58.31l-42.58 4.3v-12.32z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m37.08 570.24l36.05-5.79 11.42 71.95-41.84 3.71z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m122.38 561.48l7.72 64.84-40.51 8.45-9.05-71.95z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m60.81 543.93l9.15 11.07h60.14l9.1 78.54 37.38-8.11 25.91 0.19 30.27-101.47z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-7.58 546.3l51.04-2.77v14.64l-45.7 51.83z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-5.4 476.67h52.81l-3.95 56.97-48.86 4.16z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m110.51 465l-56.77 12.86-1.78 57.17 68.64-7.72z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m118.23 465.99l5.34 28.09 25.32-8.9-2.1-25.32z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m153.24 490.52l-30.26 7.32 3.75 28.68 31.26-2.37z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m179.55 451.75v24.92l-23.34 2.77-3.56-21.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m157.99 482.21l26.9-1.58v-30.66l60.13-11.87 1.19 21.76-15.43 52.81-69.23 7.52z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m106.36 307.24l163.17 13.95-28.66 106.33-84.96 25.51-87.83 11.97z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-11.44 410.9l68.54 3.56-13.35 45.54-55.19-1.5z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-7.58 335.24l87.06-8-20.64 79.9-68.5-3.66z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m92.24 281.99l-8.31 31.71-78.45 13.82z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m101.75 282.75l106.68 13.11-19.29-54.38z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m209.02 268.48h48.96l-8.52 33.21-26.94-3.83z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m261.54 268.48h23.14l-14.89 36.1-15.22-2.17z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m226.83 212.99l-32.64 18.99 10.08 24.63 73 6.53 7.41-41.54z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m215.55 175.61l77.44 9.79-8.31 26.11-59.34-7.12z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m221.19 127.84l-12.17 39.75h79.22l4.75-20.77z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m239.44 75.32l63.05 5.34-14.25 58.45-61.12-17.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m219.9 207.65l-251.61 127.79-32.44-72.3 79.12-65.38 184.76-30.17z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m53.74 131.69l-20.37 43.92 6.13 9.1 56.97-13.06 9.1-30.86z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m-14.7 124.18l51.43 7.51-31.25 61.87h-15.14z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m77.87 69.18h46.69l-18.99 62.51-47.08-7.51z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m68.08 69.18l-22.65 58.66-60.13-11.97 11.08-52.62z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m298.63 66.81l-83.08 2.37-1.98-54.2 90.99 4.36z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m259.07-60.28l33.92-31.16 36.79 27.3-12.46 50.44-24.33 18.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m246.7-60.58l-15.72 43.32 28.09 14.54 19.98-8.6z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m237.21-62.66l-39.76-11.27-3.26 61.42 17.5 7.12z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m341.75-76.8l-11.97 54.6 47.18-38.38z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m327.51-17.06l39.56-5.14 13.85 16.81-60.53 34.22z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m376.96 9.45l17.01-6.14 35.48 37.4-18.86 28.47h-20.57z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m363.12 12.22l-31.65 18.99 45.49 17.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m317.62 37.93v34.82l59.34-10.29z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m311.29 80.66l-2.77 56.18 77.94-46.29v-13.85z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m395.95 80.26l31.26-11.08 18.67-25.06 27.98 29.63-77.91 17.59z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m374.75-38.25l32.68-23.91 47.07 65.47-23.38 10.15z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m418.11-73.93l73.19 5.83-34.03 58.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m494.07-46.34l60.53 26.51-60.53 77.15-42.88-35.42z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m562.9-49.5l-13.05 21.36-50.25-24.92 11.87-18.99z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m571.61-72.05l-5.15 14.64-33.62-16.52z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m660.62-33.28l-90.6 5.14 16.62-34.02 87.83-3.51z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m663.39-22.2l-106.42 8.3-40.35 60.53 58.15 60.14 42.33-11.87 5.15 12.31 52.22-7.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m514.34 53.66l-10.13 11.74 63.24 65.55 32.2-8.31v-10.98l7.86-7.12-39.76 6.98z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m578.33 146.73l96.14-20.18 15.82 64.49-45.1 12.26z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m772.98 102.02l13.84 66.86-86.24 19.39-15.03-66.86z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m655.08 212.4l109.98-28.09 14.29 52.5-21.66 57.75z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m772.98 184.31l18.59-6.92 2.74 18.33-11.98 30.61z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m780.89 98.86l60.38-11.48-41.59 90.01z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m729.46 56.03l2.08 27.3 9.19-1.78 2.67 15.72 74.18-14.54-9.19-40.22z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m719.96 59.29l3.56 23.74-40.65 9.27v-28.26z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m670.41-22.2l32.79-8.11 20.32-35.36 12.66 108.18-55.09 11.15z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m731.24-65.67l48.36-4.4 24.33 102.07-60.53 12.76z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m685.55-64.14h29.67l-18.99 27-21.76 3.27z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m794.74-67.11l113.64 24.68-62.91 118.23-20.47 2.19z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m820.25-70.07l94.95 21.06 18.1-21.06z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m942.23-67.43l12.27-4.07-57.64 131.77-18.56-9.89z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m874.2 58.37l19.06 10.17-64.7 148.74-20.06-9.33z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m804.7 217.83l19.73 8.93-9.9 22.75-18.97-7.84z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m792.96 246.22l19.17 8.81-23.92 54.99-13.06-9.2z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m884.71 106.01l-11.94 26.08 37.17 20.01 15.09-24.24z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m870.9 135.96l-21.87 48.35 13.65 6.13 20.48-24.33 17.5 0.89 6.89-11.05z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m845.77 190.44l-15.43 51.63 31.45-42.03z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m821.33 253.67l28.17 13-38.5 63.16-12.67-11.33z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m973.06-63.84l-15.72 32.34 44.8 29.37 37.68-48.66z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1046.65-47.23l-38.28 57.57 45.1 34.42z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m944.87-24.38l-20.77 44.51 48.2 31.81 27.94-44.88z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m968.44 58.14l-10.67 17.13-46.58-26.69 9.33-20.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m955.28 79.61l-9.88 15.54-44.19-24.91 7.62-16.53z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m942.57 99.69l-13.01 20.89-41.4-22.06 10.52-22.81z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1001.84 21.61l56.08 36.2-148.06 224.91-65.47-45.4 45-66.16 12.76 6.23z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1064.15 77.99l-76.25 123.43 68.24 18.69z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m989.97 207.95l24.93 12.16-24.93 50.74-35.01-24.63z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m946.95 260.76l35.01 16.62-25.51 37.39-37.98-21.66z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1026.02 230.8l29.23 2.37 4.45 88.12-60.53 4.45 1.78-48.95z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m991.16 285.69l-9.2 18.39 12.76 18.4z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1017.27 351.26l40.65 19.29-76.61 107.6-38.81-27.19z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1059.7 389.24l-6.53 110.08-42.13 3.56-24.92-18.39z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1029.73 510.89h23.44l6.53 71.81h-27z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m994.72 510.89h21.96v73h-16.47z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1057.92 593.38l-35.01 68.54v-68.54z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m302.49 164.92c0 0 14.18-17.76 20.27-22.15 60.93-43.91 156.76-63.1 156.76-63.1l-23.43 74.97-18.6 7.52z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m387.94 177.68l42.13-8.3 13.95 24.18-4.75 25.37-50.09-8.9z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m381.12 175.61v33.52l-33.63-5.83-19.78-33.92z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m302.49 169.38h12.76l22.84 39.75-7.41 27.6-37.69-4.45z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m344.32 209.13l36.8 6.83-10.39 57.27-81.89-8.02 2.67-23.73 46.58 5.34z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m386.46 217.44l-5.34 55.79h42.43l14.24-46.89z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m475.87 189.26l-21.17 14.04-9.2 15.63 51.93 8.9v-8.9z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m486.2 86.66l-16.37 69.66 6.38 8.6 44.07-10.97 7.71 10.97-47.77 4.46 30.56 60.23 57.46-9.53-9.77-57.79z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m483.78 238.06l85.45-11.72 13.95 56.08-103.85-3.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m475.87 235.25l-31.85-8.91-9.49 46.89 36.94 6.23z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m288.84 279.46h53.7l-7.75 34.35-47.9-6.8z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m349.07 282.42l22.55 1.34-7.12 34.27-23.5-3.34z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m377.26 285.84h42.13l-3.41 32.19h-38.72z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m434.53 283.76l-8.02 34.27h40.36l4.6-27.3z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m479.33 291.92l-3.46 26.11h37.58l7.72-26.11z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m527.4 291.92h55.78l5.04 26.11h-64.68z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m615.03 209.88l-46.23-38.22 10.92 63.68z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m626.11 219.05l-37.89 29.35 34.22 43.52 52.85-32.22z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m682.05 265.29l19.41 16.04-38.46 36.7h-22.56l-11.67-16.81z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m589.75 267.13l7.63 50.9 32.38-0.22z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m711.29 289.46l-32.96 30.18 46.17 4.86 19.5-8z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m737.71 339.63l26.76-13.24 17.61 3.11-1.19 38.77-41.72 9.23z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m727.83 344.17l-50.28-0.1 3.45 28.75 49.25-1.18z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m782.08 372.82l-11.67 6.53-32.45 4.15 19.79 36.99 26.3-13.45z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m761.01 429.79l23.04-12.66-3.56 49.45z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m751.81 432.36l-40.15 24.73v18l61.91-5.93z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m685.35 380.14h42.33l21.36 44.31-39.76 21.96-0.89-14.05z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m609.78 382.91l63.11-3.56 27.1 59.34-80.51 4.16z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m602.27 345.52l4.74 27.24 63.87-1.76 0.99-26.84z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m704.24 448.29v26.8l-75.66 2.72-6.83-24.08z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m659.43 484.49l46.59 35.01-2.38-35.01z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m628.87 489.38h19.73l38.28 32.2h-50.89z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m645.19 532.11l51.33-3.41 24.48 13.94 5.64 21.96-76.4 7.86z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m791.77 337.02l7.12 133.32 97.12-35.21z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m818.73 336.5l39.8-64.16 89.9 58.55 23.44-22.65 22.85 26.7-73.39 98.81z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m804.03 479.64l88.82-33.58 0.99 13.01-49.95 81.49h-20.87l-0.19-23.34-16.23-0.59z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m902.15 458.28l-49.65 87.03h78.33z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m915.8 458.28l42.43 128.87 31.74-2.07-5.22-78.58z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m1010.45 596.05l-89.02 7.71 9.4 68.55 85.85-8.61z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m713.73 484.49l2.82 42.13 66.17-7.12v-37.24z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m732.62 534.04l83.48-7.42 7.12 97.62-85.26 9.94z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m654.88 583.89l71.76-8.31 5.98 73.58 90.6-11.87 2.77 45.5-158.25 18z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m825.99 554.61h104.84l11.67 32.54-36.79 3.86 12.46 83.37-83.08 6.04z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m287.06 323.5v11.94l102.07 34.22 7.37-23.28h-12.25z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m411.75 364.53l98.75-0.78-3.13-17.37-91.26 0.09z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m514.5 346.38l3.5 16.75 80.63-0.13-3.38-17.63z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m280.53 341.77l-24.53 91.09 34.92 145.98z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m310.2 351.26l-12.16 48.07 33.82-3.27 27.89 16.03 33.53-8.9 0.78-20.9z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m294.67 407.64l34.82-2.67 66.17 33.13 16.27 145.96-106.77 16.74z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m404.26 435.53l110.08-19.88 2.64 161.1-98.64 6.65z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m402.78 382.17v38.23l78.63-9.3v-19.49l-62.02-1.78z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m488.54 395.47v13.35h21.65v-12.16z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m363.31 417.33l29.97-5.93v18.39z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m523.93 391.81v14.44l55.55-15.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m525.72 411.1l29.47-7.02 11.27 45.89-39.76 1.38z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m565.08 404.08l13.85-2.77 4.35 44.31h-9.1z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m525.72 458.28l43.12-1.59 2.57 24.73h-44.11z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m576.95 457.68h11.87l6.52 23.74h-19.18z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m531.06 491.11h37.98l2.37 34.82h-39.56z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m578.53 491.11h19.19l-2.38 18.79 6.73 12.66-23.54 1.98z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m532.44 538.78l40.55-7.91v28.49l-38.77 2.77z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m536 567.27l42.53-2.37v10.68l-42.53 0.99z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m582.88 531.86l22.16-0.99v7.91l8.5 16.03-30.66 2.96z"
                          />
                          <path
                            className="jobs-map-s0"
                            d="m582.88 564.9l29.87-3.57 7.52 12.27-37.39 0.79z"
                          />
                          <path
                            className="jobs-map-s1"
                            d="m0 469.06h51.96l46.04-174.17 109.24 11.86 75.26 6.23 103 22.46h341.14l30.36-15.63 55.64-150.43 43.86-96.63 46-85.41 34.69-55.56"
                          />
                          <path
                            className="jobs-map-s1"
                            d="m403.2-68.22l-52.55 36.57 30.27 9.45 49.85 51.03 23.73 6.17 113.83 121.33 138.34 116.01 46 35.33 28.22 7.1 143.44 136.58 75.67 53.09 22.91 3.39 2.42 79.32-8.65 12.85 3.32 61.92"
                          />
                          <path
                            className="jobs-map-s1"
                            d="m-7.58 713.85h93.86l222.14-99.85 118.09-20.22 212.82-13.38-43.99-167.13v-40.45h-197.01l11.12-37.38"
                          />
                          <path
                            className="jobs-map-s1"
                            d="m308.42 614l4.45 212.89-2.22 165.27-7.67 19.59v36.99"
                          />
                        </g>
                      </svg>
                      {/* Map pin with wave animation (cyan) + up-down bounce in sync with wave */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center overflow-visible map-pin-bounce">
                        <span
                          className="map-pin-wave text-cyan-400/70 dark:text-cyan-400/50"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="map-pin-wave text-cyan-400/70 dark:text-cyan-400/50"
                          style={{ animationDelay: "500ms" }}
                        />
                        <span
                          className="map-pin-wave text-cyan-400/70 dark:text-cyan-400/50"
                          style={{ animationDelay: "1000ms" }}
                        />
                        <MapPin className="w-6 h-6 drop-shadow-sm relative z-10 text-cyan-500 dark:text-cyan-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </MacWindow>
    </div>
  );
}
