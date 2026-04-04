"use client";

import Link from "next/link";
import type { DataPoolPurchaseListRow } from "@/lib/services/dataPoolService";
import { Loader2, ChevronRight, Filter, ShoppingBag, Sparkles } from "lucide-react";

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
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-14 text-center shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
          <ShoppingBag className="h-7 w-7 text-cyan-300/80" aria-hidden />
        </div>
        <p className="mt-5 text-lg font-semibold text-white/95">Sign in to see your library</p>
        <p className="mt-2 max-w-sm mx-auto text-sm text-white/55 leading-relaxed">
          Purchases show up here so you can jump back to downloads and discussions anytime.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/45 bg-gradient-to-r from-cyan-500/20 to-teal-600/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-300/55 hover:from-cyan-500/30 hover:to-teal-600/25"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <ul className="space-y-3" aria-busy aria-label="Loading purchases">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.08]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-[60%] rounded bg-white/10" />
                <div className="h-3 w-40 rounded bg-white/[0.06]" />
              </div>
              <div className="h-4 w-14 rounded bg-white/[0.08]" />
            </div>
          </li>
        ))}
        <li className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400/40" aria-hidden />
        </li>
      </ul>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (totalLoaded === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-cyan-400/45" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-white/90">Your shelf is ready</p>
        <p className="mt-2 max-w-md mx-auto text-sm text-white/55 leading-relaxed">
          When you buy a dataset, it lands here. Browse the marketplace, open a listing, and checkout with your wallet.
        </p>
        <button
          type="button"
          onClick={onBrowseClick}
          className="mt-7 inline-flex items-center justify-center rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/18"
        >
          Explore datasets
        </button>
      </div>
    );
  }

  if (totalFiltered === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
        <Filter className="mx-auto h-9 w-9 text-white/25" aria-hidden />
        <p className="mt-3 text-base font-semibold text-white/85">No purchases match</p>
        <p className="mt-2 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
          Loosen filters in the sidebar or clear the search box—your full library is still there.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {visibleRows.map((row) => {
          const ds = row.dataset;
          const href = ds
            ? `/datapool/datasets?id=${encodeURIComponent(ds.id)}`
            : "#";
          return (
            <li key={row.id}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 shadow-[0_12px_32px_-28px_rgba(0,0,0,0.55)] transition-all hover:border-cyan-400/30 hover:bg-white/[0.06] hover:shadow-[0_16px_40px_-26px_rgba(34,211,238,0.08)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-indigo-600/20 ring-1 ring-inset ring-white/10">
                  <ShoppingBag className="h-4 w-4 text-cyan-200/80" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-cyan-100 transition-colors">
                    {ds?.title ?? "Removed dataset"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    Purchased {formatDate(row.created_at)}
                    {ds?.owner_display_name ? ` · ${ds.owner_display_name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {formatMoney(row.price_paid)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300/80" aria-hidden />
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
          className="mt-6 mx-auto flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-8 py-3 text-sm font-semibold text-white transition-all hover:border-cyan-400/45 hover:bg-white/[0.12] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.3)]"
        >
          Load more
        </button>
      )}

    </div>
  );
}
