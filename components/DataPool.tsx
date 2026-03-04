'use client'

import { useEffect, useMemo, useState } from 'react'
import Header from './Header'
import PageHero from './PageHero'
import DataItemCard, { DataItem } from './DataItemCard'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Loader2 } from 'lucide-react'
import { getDataPoolItems } from '@/lib/services/dataPoolService'

export default function DataPool() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [dataItems, setDataItems] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState<number>(8)
  const [accessDialogItem, setAccessDialogItem] = useState<DataItem | null>(null)
  const itemsPerPage = 8

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(dataItems.map((item) => item.category))).sort()],
    [dataItems]
  )

  useEffect(() => {
    const fetchDataPoolItems = async () => {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await getDataPoolItems()

      if (fetchError) {
        setError(fetchError.message || 'Failed to load DataPool items.')
        setDataItems([])
      } else {
        setDataItems(data || [])
      }

      setLoading(false)
    }

    fetchDataPoolItems()
  }, [])

  const filteredItems = dataItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const visibleItems = filteredItems.slice(0, visibleCount)
  const hasMore = filteredItems.length > visibleCount

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(itemsPerPage)
  }, [selectedCategory, searchQuery])

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + itemsPerPage)
  }

  const handleRequestAccess = (item: DataItem) => {
    // Handle request access
    console.log('Requesting access to:', item)
    setAccessDialogItem(item)
  }

  return (
    <div className="min-h-screen bg-[#28303E]">
      <Header />
      <PageHero 
        title="Data"
        subtitle="Marketplace"
        description="Browse and access curated datasets gathered from our global network"
      />
      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">

          {/* Categories and Search */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === category
                      ? 'bg-slate-700 text-white border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                      : 'border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search data..."
                  className="w-full md:w-64 px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Data Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-white/70" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleItems.map((item) => (
                <DataItemCard
                  key={item.id}
                  item={item}
                  onRequestAccess={handleRequestAccess}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              >
                Load More
              </button>
            </div>
          )}

          {/* No Results Message */}
          {!loading && error && (
            <div className="text-center py-6">
              <p className="text-red-300 text-base">{error}</p>
            </div>
          )}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">
                No data found matching your search criteria.
              </p>
            </div>
          )}
        </div>
      </main>
      <ConfirmationDialog
        open={!!accessDialogItem}
        onOpenChange={(open) => {
          if (!open) setAccessDialogItem(null)
        }}
        title="Access Request Sent"
        description={
          accessDialogItem
            ? `Requesting access to ${accessDialogItem.title} from ${accessDialogItem.owner || 'the data owner'}.`
            : ''
        }
        confirmText="OK"
        hideCancel
        onConfirm={async () => {
          setAccessDialogItem(null)
        }}
      />
    </div>
  )
}

