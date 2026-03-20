"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import CTASceneCanvas from "./CTASceneCanvas";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141a24] to-[#0d1117]">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[320px]">
            {/* Left: content + CTA */}
            <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium uppercase tracking-widest text-cyan-400/90">
                    Get started
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Ready to connect and earn?
                  </h2>
                  <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
                    Post your project and get access to our global network of
                    verified data collectors—or browse open projects and earn
                    while you contribute.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link href="/signup?role=requester">
                    <Button
                      size="lg"
                      className="group bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 transition-all duration-200 hover:scale-[1.02]"
                    >
                      Post a Project
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 hover:text-white"
                    >
                      Browse projects
                    </Button>
                  </Link>
                </div>
                <span className="text-sm text-white/40">
                  Free to post · Pay only for results
                </span>
              </div>
            </div>
            {/* Right: Three.js wireframe scene */}
            <div className="relative rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl overflow-hidden py-12">
              <CTASceneCanvas />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
