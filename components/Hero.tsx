"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import heroAnimation from "@/lib/assets/lottie/hero.json";
import { supabase } from "@/lib/supabase/client";
import { GlobeConnectSvg } from "./svg/GlobeConnectSvg";
import { IncomeSvg } from "./svg/IncomeSvg";
import { EarthSvg } from "./svg/EarthSvg";

type HeroTab = "requester" | "collector";

export default function Hero() {
  const tubesCanvasRef = useRef<HTMLCanvasElement>(null);
  const tubesAppRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HeroTab>("requester");
  const router = useRouter();

  // Tubes Cursor Animation
  useEffect(() => {
    if (!tubesCanvasRef.current) return;

    const canvas = tubesCanvasRef.current;

    // Create a module script that imports and exposes TubesCursor
    const existingScript = document.querySelector("script[data-tubes-loader]");
    if (!existingScript) {
      const script = document.createElement("script");
      script.type = "module";
      script.setAttribute("data-tubes-loader", "true");
      script.textContent = `
        import TubesCursor from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js';
        window.TubesCursor = TubesCursor;
        window.dispatchEvent(new Event('tubesCursorLoaded'));
      `;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      if (!canvas || !(window as any).TubesCursor) return;

      try {
        // Initialize TubesCursor with colors matching the dark theme
        tubesAppRef.current = (window as any).TubesCursor(canvas, {
          tubes: {
            colors: ["#67e8f9", "#3b82f6", "#6366f1"],
            lights: {
              intensity: 200,
              colors: ["#67e8f9", "#3b82f6", "#6366f1", "#8b5cf6"],
            },
          },
        });
      } catch (error) {
        console.error("Failed to initialize TubesCursor:", error);
      }
    };

    // Check if already loaded
    if ((window as any).TubesCursor) {
      handleLoad();
    } else {
      window.addEventListener("tubesCursorLoaded", handleLoad);
    }

    return () => {
      window.removeEventListener("tubesCursorLoaded", handleLoad);
      if (tubesAppRef.current) {
        tubesAppRef.current = null;
      }
    };
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const findProjectsParams = new URLSearchParams();
      if (trimmedQuery) {
        findProjectsParams.set("keyword", trimmedQuery);
      }
      const findProjectsUrl = findProjectsParams.toString()
        ? `/dashboard/projects/find?${findProjectsParams.toString()}`
        : "/dashboard/projects/find";
      router.push(findProjectsUrl);
      return;
    }

    const signupParams = new URLSearchParams({ role: "requester" });
    if (trimmedQuery) {
      signupParams.set("request", trimmedQuery);
    }
    router.push(`/signup?${signupParams.toString()}`);
  };

  return (
    <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 text-white relative overflow-hidden min-h-screen bg-gradient-to-b from-[#0a0f1e] via-[#0f172a] to-[#0f1419]">
      <div
        className="absolute top-0 bottom-0 overflow-hidden pointer-events-none hidden md:block"
        style={{
          zIndex: 0,
          top: "5%",
          left: "45%",
          width: "60%",
          height: "95%",
          opacity: 0.8,
        }}
      >
        <Lottie
          animationData={heroAnimation}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="container mx-auto relative z-10">
        <div className="min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-15rem)] md:min-h-[calc(100vh-20rem)] flex items-center pt-[5%]">
          <div className="max-w-4xl w-full">
            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              {/* Main Headline */}
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-[1.1] tracking-tight">
                  <span className="block text-white">Connect, Collect,</span>
                  <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    and Earn
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/70 max-w-2xl leading-relaxed">
                  Transform data collection into a global opportunity. Connect
                  with people worldwide and earn while you help build better
                  datasets.
                </p>
              </div>

              {/* Role switcher — compact inline */}
              <div className="space-y-4 sm:space-y-6">
                <div
                  role="tablist"
                  aria-label="Choose your role"
                  className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 gap-1"
                >
                  {(
                    [
                      {
                        id: "requester" as const,
                        label: "I need data",
                        icon: (
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "collector" as const,
                        label: "I want to collect",
                        icon: (
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        ),
                      },
                    ] as const
                  ).map(({ id, label, icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`hero-panel-${id}`}
                        id={`hero-tab-${id}`}
                        onClick={() => setActiveTab(id)}
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-cyan-500/20 text-white border border-cyan-400/40 shadow-[0_0_20px_-6px_rgba(34,211,238,0.3)]"
                            : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "requester" && (
                  <div
                    id="hero-panel-requester"
                    role="tabpanel"
                    aria-labelledby="hero-tab-requester"
                    className="max-w-2xl space-y-6"
                  >
                    <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                      Describe the data you need—surveys, annotations, or custom
                      collection tasks. We match your request with{" "}
                      <span className="text-cyan-400 font-medium">
                        qualified collectors worldwide
                      </span>{" "}
                      and deliver validated datasets to you.
                    </p>
                    {/* Search Bar */}
                    <div>
                      <form
                        onSubmit={handleSearchSubmit}
                        className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6"
                      >
                        <div className="relative group flex-1 w-full">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden hover:border-cyan-400/50 transition-all duration-300 shadow-xl">
                            <div className="pl-4 sm:pl-6 pr-3 sm:pr-4 flex items-center">
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Submit your request here..."
                              className="flex-1 bg-transparent py-3 sm:py-4 pr-4 sm:pr-6 text-white placeholder-white/50 focus:outline-none text-sm sm:text-base md:text-lg font-medium"
                            />
                          </div>
                        </div>
                        <div className="relative group flex-shrink-0 self-center sm:self-auto hidden md:block">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full">
                            <EarthSvg color="#00B8DB" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-indigo-500/50 rounded-full blur-xl opacity-100" />
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {activeTab === "collector" && (
                  <div
                    id="hero-panel-collector"
                    role="tabpanel"
                    aria-labelledby="hero-tab-collector"
                    className="max-w-2xl space-y-6"
                  >
                    <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                      Browse open data collection projects, apply to tasks that
                      match your skills, and{" "}
                      <span className="text-cyan-400 font-medium">
                        earn while you help
                      </span>
                      . Complete quality work and get paid for your
                      contributions.
                    </p>
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:opacity-95 transition-all duration-300"
                    >
                      Browse projects
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
