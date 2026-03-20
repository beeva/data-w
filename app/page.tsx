"use client";

import { Suspense, type ComponentType } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ArrowUpToLine } from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";
import MicrosoftSvg from "@/components/svg/company-logos/MicrosoftSvg";
import YamahaSvg from "@/components/svg/company-logos/YamahaSvg";
import AppleMusicSvg from "@/components/svg/company-logos/AppleMusicSvg";
import ShopifySvg from "@/components/svg/company-logos/ShopifySvg";
import YoutubeSvg from "@/components/svg/company-logos/YoutubeSvg";
import NetflixSvg from "@/components/svg/company-logos/NetflixSvg";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "signout-success") {
      setToastMessage("You have been signed out successfully.");
      setShowToast(true);
      router.replace("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  // Logos from public/company-logos (add image files and list them here)
  const publicLogos: { name: string; slug: string; file: string }[] = [
    { name: "Spotify", slug: "spotify", file: "Bellomy-logo.png" },
    { name: "Stripe", slug: "stripe", file: "Clariti Logo.png" },
    { name: "Slack", slug: "slack", file: "ElevenMR Logo.png" },
    { name: "enosanswers", slug: "slack", file: "enosanswers logo.png" },
    { name: "Fieldwork", slug: "slack", file: "Fieldwork Logo.png" },
    {
      name: "Full-Circle-Research-Logo",
      slug: "slack",
      file: "Full-Circle-Research-Logo.png",
    },
    { name: "Harmon", slug: "slack", file: "Harmon Research Logo.png" },
    { name: "Indiefield", slug: "slack", file: "Indiefield Logo.png" },
    { name: "KANTAR", slug: "slack", file: "KANTAR-Logo.png" },
    { name: "Quantifyai", slug: "slack", file: "Quantifyai Logo.png" },
    { name: "Quest", slug: "slack", file: "Quest Mindshare.png" },
  ];

  const trustedByLogos: {
    name: string;
    slug: string;
    src?: string;
    Logo?: ComponentType;
  }[] = [
    ...publicLogos.map((p) => ({
      name: p.name,
      slug: p.slug,
      src: `/company-logos/${p.file}`,
    })),
  ];

  return (
    <main className="min-h-screen bg-[#28303E] overflow-x-hidden">
      {showToast && toastMessage && (
        <ToastNotification
          title="Signed out"
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={handleCloseToast}
        />
      )}
      <Header />
      <Hero />
      <div className="py-12 md:py-24 container mx-auto bg-[#28303E]">
        <div className="relative overflow-hidden">
          <div className="logo-ticker-track flex items-center gap-10 sm:gap-14 md:gap-20 w-max">
            {[...trustedByLogos, ...trustedByLogos].map((client, i) => (
              <div
                key={`${client.slug}-${i}`}
                className="group flex-shrink-0 flex items-center justify-center h-8 md:h-10 opacity-80 hover:opacity-100 transition-all duration-300 [&_svg]:brightness-0 [&_svg]:invert [&_img]:brightness-0 [&_img]:invert group-hover:[&_svg]:!filter-none group-hover:[&_img]:!filter-none"
                title={client.name}
              >
                {client.Logo ? (
                  <span className="h-full w-auto max-w-[140px] [&_svg]:h-full [&_svg]:w-auto [&_svg]:object-contain">
                    <client.Logo />
                  </span>
                ) : client.src ? (
                  <img
                    src={client.src}
                    alt={client.name}
                    className="h-full w-auto object-contain max-w-[140px] transition-all duration-300"
                  />
                ) : (
                  <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white/80 whitespace-nowrap">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/90 text-white shadow-lg transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#28303E]"
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
