"use client";

import { useRef, useEffect } from "react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  /** Compact mode for content-heavy pages (e.g. DataPool/detail pages). */
  compact?: boolean;
  /** When set, layout becomes left (title + children) | right (Lottie). e.g. "/lottie/job-search.lottie" */
  rightLottie?: string;
  /** When set, used as the right column instead of rightLottie (e.g. macOS-style jobs list window). Takes precedence over rightLottie. */
  rightContent?: React.ReactNode;
}

export default function PageHero({
  title,
  subtitle,
  description,
  children,
  compact = true,
  rightLottie,
  rightContent,
}: PageHeroProps) {
  const lottieCanvasRef = useRef<HTMLCanvasElement>(null);
  const useRightContent = Boolean(rightContent);
  const useRightLottie = Boolean(rightLottie) && !useRightContent;

  useEffect(() => {
    if (!useRightLottie || typeof window === "undefined") return;
    const canvas = lottieCanvasRef.current;
    if (!canvas) return;

    let animation: any;
    import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        animation = new DotLottie({
          canvas,
          src: rightLottie!,
          autoplay: true,
          loop: true,
        });
      })
      .catch((err) => console.error("PageHero Lottie failed", err));

    return () => {
      if (animation) animation.destroy();
    };
  }, [rightLottie, useRightLottie]);

  const hasTwoColumns = useRightContent || useRightLottie;

  return (
    <section
      className={`px-4 sm:px-6 text-white relative overflow-hidden bg-gradient-to-b from-[#0a0f1e] via-[#0f172a] to-[#0f1419] ${
        compact
          ? "pt-[calc(var(--site-header-height)+2rem)] pb-12 sm:pb-14"
          : "pt-[calc(var(--site-header-height)+1rem)] pb-16 sm:pb-20"
      }`}
    >
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-500/8 rounded-full blur-2xl" />
      <div className="container mx-auto relative z-10">
        <div
          className={`flex ${
            compact
              ? "items-start lg:items-center min-h-[clamp(11.5rem,24vh,19rem)] gap-8 lg:gap-10"
              : "items-center min-h-[clamp(20rem,42vh,36rem)] sm:min-h-[clamp(22rem,48vh,40rem)]"
          } ${hasTwoColumns ? "flex-col lg:flex-row lg:justify-between lg:gap-12 xl:gap-16" : "justify-center"}`}
        >
          {/* Left: title + description + children (e.g. search) */}
          <div
            className={`w-full ${hasTwoColumns ? "lg:flex-1 lg:max-w-2xl lg:text-left" : "max-w-3xl text-center"}`}
          >
            <div className={`${compact ? "space-y-3" : "space-y-4"}`}>
              <h1
                className={`font-bold leading-tight tracking-tight ${
                  compact ? "text-2xl sm:text-3xl md:text-7xl" : "text-2xl sm:text-3xl md:text-7xl"
                }`}
              >
                {subtitle ? (
                  <>
                    <span className="text-white">{title} </span>
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      {subtitle}
                    </span>
                  </>
                ) : (
                  <span className="text-white">{title}</span>
                )}
              </h1>

              {description && (
                <p
                  className={`text-sm sm:text-base md:text-lg text-white/70 leading-relaxed max-w-2xl ${hasTwoColumns ? "" : "mx-auto"} ${compact ? "mt-0.5" : ""}`}
                >
                  {description}
                </p>
              )}
              {children && (
                <div
                  className={`${compact ? "mt-5 sm:mt-6" : "mt-8"} w-full ${hasTwoColumns ? "" : "max-w-2xl mx-auto"}`}
                >
                  {children}
                </div>
              )}
            </div>
          </div>

          {/* Right: custom content (e.g. macOS jobs window) or Lottie */}
          {hasTwoColumns && (
            <div className="w-full lg:w-[42%] xl:w-[45%] lg:max-w-xl flex-shrink-0 flex items-center justify-center mt-6 sm:mt-8 lg:mt-0 min-h-[200px] sm:min-h-[220px] lg:min-h-0 lg:self-center">
              {useRightContent ? (
                rightContent
              ) : (
                <canvas
                  ref={lottieCanvasRef}
                  className="w-full h-full min-h-[200px] sm:min-h-[260px] lg:min-h-[420px] xl:min-h-[480px]"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
