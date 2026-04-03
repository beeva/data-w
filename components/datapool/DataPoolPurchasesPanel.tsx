"use client";

import Link from "next/link";
import type { DataPoolPurchaseListRow } from "@/lib/services/dataPoolService";
import { Loader2, ChevronRight, ShoppingBag } from "lucide-react";

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** List body for purchased datasets (fetch + filters live in `DataPool`). */
export default function DataPoolPurchasesPanel({
  userId,
  loading,
  error,
  visibleRows,
  totalLoaded,
  totalFiltered,
  hasMore,
  onLoadMore,
  onBrowseClick,
}: {
  userId: string | undefined;
  loading: boolean;
  error: string;
  visibleRows: DataPoolPurchaseListRow[];
  /** Purchases returned from the server (before sidebar/search filters) */
  totalLoaded: number;
  totalFiltered: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onBrowseClick: () => void;
}) {
  if (!userId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-white/35" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-white/90">Sign in to see purchases</p>
        <p className="mt-2 text-sm text-white/55">
          Your purchased datasets appear here for quick access and downloads.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/25"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (totalLoaded === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-white/90">No purchases yet</p>
        <p className="mt-2 text-sm text-white/55">
          Browse the marketplace tab and open a dataset to buy with your wallet balance.
        </p>
        <button
          type="button"
          onClick={onBrowseClick}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:border-cyan-500/40 hover:bg-white/10"
        >
          Browse datasets
        </button>
      </div>
    );
  }

  if (totalFiltered === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 text-lg">
          No purchases match your filters. Try adjusting the sidebar or search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {visibleRows.map((row) => {
          const ds = row.dataset;
          const href = ds
            ? `/datapool/datasets?id=${encodeURIComponent(ds.id)}`
            : "#";
          return (
            <li key={row.id}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-cyan-500/35 hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/90">
                    {ds?.title ?? "Removed dataset"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    Purchased {formatDate(row.created_at)}
                    {ds?.owner_display_name ? ` · From ${ds.owner_display_name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-300/90">
                    {formatMoney(row.price_paid)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/40" aria-hidden />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-8 mx-auto block px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
        >
          Load More
        </button>
      )}

    </div>
  );
}
