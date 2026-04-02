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
          <div className="container mx-auto px-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white/70">
              No dataset selected. Open a dataset from{" "}
              <Link href="/datapool" className="text-cyan-200 hover:underline">
                DataPool
              </Link>
              .
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DatasetDetail datasetId={datasetId} />;
}

