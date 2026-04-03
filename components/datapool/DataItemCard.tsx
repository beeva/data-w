"use client";

import Link from "next/link";
import { DataItemRequirementsTags } from "./DataItemRequirementsTags";

export interface DataItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  price?: number;
  owner?: string;
  description?: string;
  /** From completed project requirements */
  data_types?: string[];
  formats?: string[];
  /** Completed project vs user-listed dataset */
  item_kind?: "project" | "dataset";
  /** Profile id of the listing owner (for edit) */
  owner_user_id?: string;
  /** Current user has bought this dataset (server RPC) */
  is_purchased?: boolean;
}

interface DataItemCardProps {
  item: DataItem;
  onRequestAccess: (item: DataItem) => void;
  /** When set with `onEditDataset`, Edit shows only for your own `dataset` rows */
  currentUserId?: string;
  onEditDataset?: (item: DataItem) => void;
}

export default function DataItemCard({
  item,
  onRequestAccess,
  currentUserId,
  onEditDataset,
}: DataItemCardProps) {
  const showEdit =
    !!onEditDataset &&
    item.item_kind === "dataset" &&
    !!item.owner_user_id &&
    !!currentUserId &&
    item.owner_user_id === currentUserId;

  const isOwner =
    !!currentUserId &&
    !!item.owner_user_id &&
    item.owner_user_id === currentUserId;
  const showPurchasedBadge = Boolean(item.is_purchased) && !isOwner;

  const detailHref = `/datapool/datasets?id=${encodeURIComponent(item.id)}`;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300">
      <div className="p-3.5">
        <Link
          href={detailHref}
          className="group/detail mb-3 block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1419]"
          aria-label={`Open dataset: ${item.title}`}
        >
          <div className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover/detail:opacity-95 transition-opacity">
            <svg
              className="h-10 w-10 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover/detail:text-cyan-100 transition-colors">
            {item.title}
          </h3>
          <p className="mb-2 line-clamp-1 text-sm leading-snug text-white/60">
            {item.description}
          </p>

          <DataItemRequirementsTags item={item} className="mb-3" size="card" />

          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-white/50">
              {item.owner ? `By ${item.owner}` : ""}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {showPurchasedBadge ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                  Purchased
                </span>
              ) : null}
              <span className="text-xs text-white/50">{item.category}</span>
            </span>
          </div>
        </Link>

        <div className="space-y-2.5">
          {typeof item.price === "number" ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-emerald-400">
                ${item.price.toLocaleString()}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {showEdit && (
                  <button
                    type="button"
                    onClick={() => onEditDataset!(item)}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400/80 hover:bg-white/15"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRequestAccess(item)}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  View details
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {showEdit && (
                <button
                  type="button"
                  onClick={() => onEditDataset!(item)}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400/80 sm:w-auto"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => onRequestAccess(item)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] sm:flex-1"
              >
                View details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

