'use client'

import { useState, useEffect } from 'react'
import Header from './Header'
import PageHero from './PageHero'
import DataItemCard, { DataItem } from './DataItemCard'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export default function DataPool() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(8)
  const [accessDialogItem, setAccessDialogItem] = useState<DataItem | null>(null)
  const itemsPerPage = 8

  const categories = ['All', 'Healthcare', 'E-commerce', 'Finance', 'Logistics', 'Surveillance', 'Sports', 'Other']

  const dataItems: DataItem[] = [
    {
      id: '1',
      title: 'Patient Imaging Dataset',
      category: 'Healthcare',
      thumbnail: '/api/placeholder/300/200',
      isPublic: false,
      price: 5000,
      owner: 'Medical Research Institute',
      description: 'De-identified patient imaging and diagnostic labels for AI model training'
    },
    {
      id: '2',
      title: 'E-commerce Transaction History',
      category: 'E-commerce',
      thumbnail: '/api/placeholder/300/200',
      isPublic: true,
      description: 'Large batches of labeled customer transaction histories and browsing events'
    },
    {
      id: '3',
      title: 'Casino Floor Surveillance',
      category: 'Surveillance',
      thumbnail: '/api/placeholder/300/200',
      isPublic: false,
      price: 12000,
      owner: 'Casino Operations Inc',
      description: 'High-resolution surveillance footage with annotated event logs'
    },
    {
      id: '4',
      title: 'Sports Betting Data',
      category: 'Sports',
      thumbnail: '/api/placeholder/300/200',
      isPublic: false,
      price: 8000,
      owner: 'Sports Analytics Co',
      description: 'Historical betting slips, odds movements, and game outcomes'
    },
    {
      id: '5',
      title: 'Vehicle Telemetry Data',
      category: 'Logistics',
      thumbnail: '/api/placeholder/300/200',
      isPublic: true,
      description: 'De-identified vehicle telemetry, route traces, and delivery timestamps'
    },
    {
      id: '6',
      title: 'Financial Transaction Records',
      category: 'Finance',
      thumbnail: '/api/placeholder/300/200',
      isPublic: false,
      price: 15000,
      owner: 'Financial Services Group',
      description: 'Anonymized financial transaction data for fraud detection models'
    },
    {
      id: '7',
      title: 'Product Catalog Metadata',
      category: 'E-commerce',
      thumbnail: '/api/placeholder/300/200',
      isPublic: true,
      description: 'Comprehensive product catalog with metadata for recommendation systems'
    },
    {
      id: '8',
      title: 'Customer Behavior Analytics',
      category: 'E-commerce',
      thumbnail: '/api/placeholder/300/200',
      isPublic: false,
      price: 6000,
      owner: 'Retail Analytics Platform',
      description: 'Customer browsing patterns and purchase behavior data'
    }
  ]

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleItems.map((item) => (
              <DataItemCard
                key={item.id}
                item={item}
                onRequestAccess={handleRequestAccess}
              />
            ))}
          </div>

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
          {filteredItems.length === 0 && (
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

