"use client";

import Lottie from "lottie-react";
import { useEffect, useState, useMemo } from "react";
import loadingAnimation from "@/lib/assets/lottie/loading.json";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animationPath?: any;
}

// Cache for animation data to avoid refetching (keyed by path)
const animationDataCache: Record<string, any> = {};
const animationLoadPromises: Record<string, Promise<any>> = {};

export function Loading({
  className = "",
  size = "md",
  animationPath = loadingAnimation,
}: LoadingProps) {
  // Check if animationPath is already an object (imported JSON) or a string (URL)
  const isObject = typeof animationPath === "object" && animationPath !== null;
  const cacheKey = isObject ? "imported-default" : String(animationPath);

  const [animationData, setAnimationData] = useState<any>(
    isObject ? animationPath : animationDataCache[cacheKey] || null
  );

  useEffect(() => {
    // If animationPath is already an object (imported JSON), use it directly
    if (isObject) {
      setAnimationData(animationPath);
      return;
    }

    // If already cached, use it immediately
    if (animationDataCache[cacheKey]) {
      setAnimationData(animationDataCache[cacheKey]);
      return;
    }

    // If already loading, wait for existing promise
    if (cacheKey in animationLoadPromises) {
      animationLoadPromises[cacheKey].then((data) => {
        setAnimationData(data);
      });
      return;
    }

    // Start loading animation from URL
    animationLoadPromises[cacheKey] = fetch(animationPath as string)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch animation");
        return res.json();
      })
      .then((data) => {
        animationDataCache[cacheKey] = data;
        delete animationLoadPromises[cacheKey];
        return data;
      })
      .catch((err) => {
        console.error("Failed to load animation:", err);
        delete animationLoadPromises[cacheKey];
        return null;
      });

    animationLoadPromises[cacheKey].then((data) => {
      if (data) {
        setAnimationData(data);
      }
    });
  }, [animationPath, isObject, cacheKey]);

  const sizeClasses = useMemo(
    () => ({
      sm: "w-48 h-48",
      md: "w-64 h-64",
      lg: "w-128 h-128",
    }),
    []
  );

  if (!animationData) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-2xl ${className}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-2xl ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Lottie
          animationData={animationData}
          loop={true}
          className={sizeClasses[size]}
        />
      </div>
    </div>
  );
}
