"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import PageHero from "./PageHero";
import DataItemCard, { DataItem } from "./DataItemCard";
import DataItemListItem from "./DataItemListItem";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { getDataPoolItems } from "@/lib/services/dataPoolService";

export default function DataPool() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [accessDialogItem, setAccessDialogItem] = useState<DataItem | null>(
    null,
  );
  const itemsPerPage = 8;

  const categories = useMemo(
    () => Array.from(new Set(dataItems.map((item) => item.category))).sort(),
    [dataItems],
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  useEffect(() => {
    const fetchDataPoolItems = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await getDataPoolItems();

      if (fetchError) {
        setError(fetchError.message || "Failed to load DataPool items.");
        setDataItems([]);
      } else {
        setDataItems(data || []);
      }

      setLoading(false);
    };

    fetchDataPoolItems();
  }, []);

  const filteredItems = dataItems.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [selectedCategories, searchQuery, viewMode]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  const handleRequestAccess = (item: DataItem) => {
    // Handle request access
    console.log("Requesting access to:", item);
    setAccessDialogItem(item);
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />
      <PageHero
        title="Data"
        subtitle="Marketplace"
        description="Browse and access curated datasets gathered from our global network"
      />
      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Category Panel */}
            <aside className="w-full lg:w-60 lg:shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold">Categories</h2>
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                        selectedCategories.includes(category)
                          ? "bg-slate-700 text-white border-slate-500"
                          : "bg-transparent text-white/75 border-white/10 hover:border-cyan-400/50 hover:text-white"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1 min-w-0">
              {/* Search and view toggle */}
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search datasets..."
                      aria-label="Search datasets"
                      className="w-full sm:w-72 px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {!loading && !error && (
                    <p className="text-sm text-white/50 truncate">
                      {filteredItems.length === 0
                        ? "No matches"
                        : `Showing ${visibleItems.length} of ${filteredItems.length} dataset${filteredItems.length === 1 ? "" : "s"}`}
                    </p>
                  )}
                </div>
                <div
                  className="inline-flex w-fit rounded-lg border border-white/10 p-1 bg-white/5"
                  role="group"
                  aria-label="Layout"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    title="Card layout"
                    aria-pressed={viewMode === "card"}
                    aria-label="Card layout"
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "card"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List layout (two columns)"
                    aria-pressed={viewMode === "list"}
                    aria-label="List layout"
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <List className="w-5 h-5" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Data Content */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleItems.map((item) => (
                    <DataItemCard
                      key={item.id}
                      item={item}
                      onRequestAccess={handleRequestAccess}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {visibleItems.map((item) => (
                    <DataItemListItem
                      key={item.id}
                      item={item}
                      onRequestAccess={handleRequestAccess}
                    />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="mt-12 mx-auto block px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                >
                  Load More
                </button>
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
            </section>
          </div>
        </div>
      </main>
      <ConfirmationDialog
        open={!!accessDialogItem}
        onOpenChange={(open) => {
          if (!open) setAccessDialogItem(null);
        }}
        title="Access Request Sent"
        description={
          accessDialogItem
            ? `Requesting access to ${accessDialogItem.title} from ${accessDialogItem.owner || "the data owner"}.`
            : ""
        }
        confirmText="OK"
        hideCancel
        onConfirm={async () => {
          setAccessDialogItem(null);
        }}
      />
    </div>
  );
}
