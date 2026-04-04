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

  const isOwner =
    !!currentUserId &&
    !!item.owner_user_id &&
    item.owner_user_id === currentUserId;
  const showPurchasedBadge = Boolean(item.is_purchased) && !isOwner;

  const detailHref = `/datapool/datasets?id=${encodeURIComponent(item.id)}`;

  return (
    <article className="group/row flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_32px_-28px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:shadow-[0_16px_40px_-26px_rgba(34,211,238,0.1)] sm:flex-row sm:items-stretch sm:gap-0 sm:p-0 sm:pr-4">
      <Link
        href={detailHref}
        className="group/detail flex min-w-0 flex-1 gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1419] sm:gap-4 sm:p-4 sm:pr-5"
        aria-label={`Open dataset: ${item.title}`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-indigo-600/20 ring-1 ring-inset ring-white/10 transition-colors group-hover/row:from-cyan-500/25 sm:h-14 sm:w-14">
          <svg
            className="h-6 w-6 text-cyan-400 sm:h-7 sm:w-7"
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
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-white transition-colors group-hover/detail:text-cyan-100 sm:text-base">
                {item.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {showPurchasedBadge ? (
                  <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                    Purchased
                  </span>
                ) : null}
                <span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-cyan-200/90">
                  {item.category}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
            {item.description?.trim() ||
              "No description yet—open the listing for full details."}
          </p>
          <DataItemRequirementsTags
            item={item}
            className="mt-2.5"
            size="list"
            layout="row"
          />
          <p className="mt-2.5 text-xs text-white/40 sm:hidden">
            {item.owner ? (
              <>
                <span className="text-white/30">Listed by </span>
                <span className="font-medium text-white/65">{item.owner}</span>
              </>
            ) : (
              <span className="text-white/30">Seller not shown</span>
            )}
          </p>
        </div>
      </Link>

      <div className="mt-3 flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-3 sm:mt-0 sm:min-w-[10rem] sm:max-w-[12rem] sm:shrink-0 sm:flex-col sm:items-stretch sm:justify-center sm:gap-3 sm:border-l sm:border-t-0 sm:py-4 sm:pl-5">
        <p className="hidden text-left text-[11px] leading-snug text-white/40 sm:order-3 sm:block">
          {item.owner ? (
            <>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/30">
                Listed by
              </span>
              <span className="mt-0.5 line-clamp-2 font-medium text-white/70">
                {item.owner}
              </span>
            </>
          ) : (
            <span className="text-white/30">Seller not shown</span>
          )}
        </p>
        {typeof item.price === "number" ? (
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-center text-sm font-bold text-emerald-300 sm:order-1">
            ${item.price.toLocaleString()}
          </span>
        ) : null}
        <div className="flex flex-1 items-center justify-end gap-2 sm:order-2 sm:flex-none sm:w-full sm:flex-col sm:gap-2">
          {showEdit && (
            <button
              type="button"
              onClick={() => onEditDataset!(item)}
              className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-all hover:border-cyan-400/80 hover:bg-white/[0.14] sm:w-full sm:py-1.5"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onRequestAccess(item)}
            className="min-w-[5.5rem] shrink-0 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-600/75 to-teal-600/65 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:border-cyan-300/55 hover:from-cyan-500 hover:to-teal-500 sm:w-full sm:py-1.5"
          >
            Open
          </button>
        </div>
      </div>
    </article>
  );
}
