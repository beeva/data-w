"use client";

import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import heroAnimation from "@/lib/assets/lottie/hero.json";
import { GlobeConnectSvg } from "./svg/GlobeConnectSvg";
import { IncomeSvg } from "./svg/IncomeSvg";
import { EarthSvg } from "./svg/EarthSvg";

export default function Hero() {
  const tubesCanvasRef = useRef<HTMLCanvasElement>(null);
  const tubesAppRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to data pool page
    window.location.href = "/datapool";
  };

  return (
    <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 text-white relative overflow-hidden min-h-screen bg-gradient-to-b from-[#0a0f1e] via-[#0f172a] to-[#1e293b]">
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

              {/* Bullet Points */}
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <GlobeConnectSvg color="#00B8DB" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                        Global Connections
                      </h3>
                      <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                        Fill your data gap by connecting with people{" "}
                        <span className="text-cyan-400 font-medium">
                          worldwide
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <IncomeSvg color="#00B8DB" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                        Earn While You Help
                      </h3>
                      <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                        <span className="text-cyan-400 font-medium">
                          Earn income
                        </span>{" "}
                        by helping clean data and making the collection process
                        easier and more efficient
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="pt-2 sm:pt-4">
                <form
                  onSubmit={handleSearchSubmit}
                  className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6"
                >
                  <div className="relative group flex-1 w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden hover:border-cyan-400/50 transition-all duration-300 shadow-xl">
                      {/* Magnifying Glass Icon */}
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

                      {/* Input Field */}
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
          </div>
        </div>
      </div>
    </section>
  );
}
