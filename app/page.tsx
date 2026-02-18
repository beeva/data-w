"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
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
      setToastMessage("Signed out successfully");
      setShowToast(true);

      router.replace("/");
    }
  }, [searchParams, router]);

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  return (
    <main className="min-h-screen bg-[#0f172a] overflow-x-hidden">
      {showToast && toastMessage && (
        <ToastNotification
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={handleCloseToast}
        />
      )}
      <Header />
      <Hero />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
