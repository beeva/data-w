"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DatasetDetail from "@/components/datapool/DatasetDetail";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";

export default function DatasetDetailFromQuery() {
  const searchParams = useSearchParams();
  const datasetId = useMemo(() => {
    const raw = searchParams.get("id")?.trim();
    return raw || "";
  }, [searchParams]);

  if (!datasetId) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <Header />
        <PageHero
          title="Dataset"
          subtitle="Detail"
          description="Missing dataset id."
          compact
        />
        <main className="pb-20 pt-6">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white/90">No dataset selected</p>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Use a link from the marketplace, or pick a dataset from the browse tab.
              </p>
              <Link
                href="/datapool"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/18"
              >
                Go to DataPool
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DatasetDetail datasetId={datasetId} />;
}

