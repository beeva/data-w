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
import ToastNotification from "@/components/ui/toast-notification";
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "signout-success") {
      setToastMessage("You have been signed out successfully.");
      setShowToast(true);
      router.replace("/");
    }
  }, [searchParams, router]);

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
    <main className="min-h-screen bg-[#0f1419] overflow-x-hidden">
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
      <div className="py-12 md:py-24 container mx-auto bg-[#0f1419]">
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
