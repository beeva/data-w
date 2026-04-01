'use client'

import { DataItemRequirementsTags } from "./DataItemRequirementsTags";

export interface DataItem {
  id: string
  title: string
  category: string
  thumbnail: string
  price?: number
  owner?: string
  description?: string
  /** From completed project requirements */
  data_types?: string[]
  formats?: string[]
}

interface DataItemCardProps {
  item: DataItem
  onRequestAccess: (item: DataItem) => void
}

export default function DataItemCard({ item, onRequestAccess }: DataItemCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300">
      <div className="p-3.5">
        <div className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
          <svg className="h-10 w-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white">{item.title}</h3>
        <p className="mb-2 line-clamp-1 text-sm leading-snug text-white/60">{item.description}</p>

        <DataItemRequirementsTags item={item} className="mb-3" size="card" />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-white/50">{item.owner ? `By ${item.owner}` : ""}</span>
            <span className="shrink-0 text-xs text-white/50">{item.category}</span>
          </div>

          {typeof item.price === "number" ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-emerald-400">
                ${item.price.toLocaleString()}
              </span>
              <button
                onClick={() => onRequestAccess(item)}
                className="shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                Request Access
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRequestAccess(item)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              Request Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
