'use client'

export interface DataItem {
  id: string
  title: string
  category: string
  thumbnail: string
  price?: number
  owner?: string
  description?: string
}

interface DataItemCardProps {
  item: DataItem
  onRequestAccess: (item: DataItem) => void
}

export default function DataItemCard({ item, onRequestAccess }: DataItemCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300">
      <div className="p-4">
        <div className="w-full h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="font-semibold text-white mb-2">{item.title}</h3>
        <p className="text-sm text-white/60 mb-3 line-clamp-2">{item.description}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">{item.owner ? `By ${item.owner}` : ""}</span>
            <span className="text-xs text-white/50">{item.category}</span>
          </div>

          {typeof item.price === "number" ? (
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-400">
                ${item.price.toLocaleString()}
              </span>
              <button
                onClick={() => onRequestAccess(item)}
                className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              >
                Request Access
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRequestAccess(item)}
              className="w-full px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
            >
              Request Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
