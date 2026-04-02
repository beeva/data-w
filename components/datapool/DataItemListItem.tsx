"use client";

import Link from "next/link";
import type { DataItem } from "./DataItemCard";
import { DataItemRequirementsTags } from "./DataItemRequirementsTags";

interface DataItemListItemProps {
  item: DataItem;
  onRequestAccess: (item: DataItem) => void;
  currentUserId?: string;
  onEditDataset?: (item: DataItem) => void;
}

export default function DataItemListItem({
  item,
  onRequestAccess,
  currentUserId,
  onEditDataset,
}: DataItemListItemProps) {
  const showEdit =
    !!onEditDataset &&
    item.item_kind === "dataset" &&
    !!item.owner_user_id &&
    !!currentUserId &&
    item.owner_user_id === currentUserId;
  return (
    <article className="group flex flex-col rounded-lg border border-white/10 bg-white/[0.04] p-2.5 transition-colors hover:border-cyan-500/40 hover:bg-white/[0.06]">
      <div className="mb-1.5 flex items-start gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
          <svg
            className="h-5 w-5 text-cyan-400"
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
        <div className="min-w-0 flex-1 flex flex-col items-start">
          <Link
            href={`/datapool/datasets?id=${encodeURIComponent(item.id)}`}
            className="inline-block max-w-full"
          >
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white transition-colors group-hover:text-cyan-100 line-clamp-1">
              {item.title}
            </h3>
          </Link>
          <span className="mt-1 block rounded bg-white/10 px-1.5 py-px text-[11px] font-medium text-cyan-300/90">
            {item.category}
          </span>
        </div>
      </div>
      <p className="mb-1.5 line-clamp-1 flex-1 text-xs leading-snug text-white/55">
        {item.description?.trim() || "No description provided."}
      </p>
      <DataItemRequirementsTags item={item} className="mb-2" size="list" />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 border-t border-white/10 pt-2">
        <span className="text-[11px] text-white/45">
          {item.owner ? (
            <>
              <span className="text-white/35">Owner </span>
              <span className="text-white/75">{item.owner}</span>
            </>
          ) : (
            <span className="text-white/35">Owner not listed</span>
          )}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {typeof item.price === "number" && (
            <span className="text-xs font-semibold text-emerald-400">
              ${item.price.toLocaleString()}
            </span>
          )}
          {showEdit && (
            <button
              type="button"
              onClick={() => onEditDataset!(item)}
              className="shrink-0 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:border-cyan-400/80"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onRequestAccess(item)}
            className="shrink-0 rounded-md border border-slate-600 bg-slate-700 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          >
            Request
          </button>
        </div>
      </div>
    </article>
  );
}

