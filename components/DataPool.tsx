"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Header from "./Header";
import PageHero from "./PageHero";
import DataItemCard, { DataItem } from "./DataItemCard";
import DataItemListItem from "./DataItemListItem";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Activity,
  Check,
  FileText,
  Image,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  MoreHorizontal,
  Music,
  Table,
  Video,
  type LucideIcon,
} from "lucide-react";
import { getDataPoolItems } from "@/lib/services/dataPoolService";
import {
  CATEGORY_ICON_COLOR,
  JOB_CATEGORIES,
  JOB_CATEGORY_DISPLAY,
  PROJECT_DATA_TYPES,
  PROJECT_FORMATS,
  type JobCategory,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

const DATA_TYPE_ICONS: Record<string, LucideIcon> = {
  Images: Image,
  Videos: Video,
  "Audio Files": Music,
  "Text Documents": FileText,
  Spreadsheets: Table,
  "GPS Coordinates": MapPin,
  "Sensor Readings": Activity,
  Other: MoreHorizontal,
};

function matchesFacetSelection(
  selected: string[],
  itemValues: string[] | undefined,
): boolean {
  if (selected.length === 0) return true;
  if (!itemValues?.length) return false;
  return selected.some((s) => itemValues.includes(s));
}

function GelFilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "btn-gelatine inline-flex max-w-full items-center gap-2 rounded-full pl-3 pr-4 py-2.5 text-sm font-medium transition-all border text-left",
        selected
          ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
          : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
      )}
    >
      {children}
    </button>
  );
}

function TrailingCheckCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ml-1.5",
        selected
          ? "bg-white dark:bg-[#0a0a0a] border-white dark:border-[#0a0a0a] text-[#0a0a0a] dark:text-white"
          : "dark:border-white/50 border-[#0a0a0a] bg-transparent",
      )}
      aria-hidden
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

export default function DataPool() {
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [accessDialogItem, setAccessDialogItem] = useState<DataItem | null>(
    null,
  );
  const itemsPerPage = 8;

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const toggleDataType = (value: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const toggleFormat = (value: string) => {
    setSelectedFormats((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
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

  useEffect(() => {
    const keyword = searchParams.get("keyword")?.trim();
    if (!keyword) return;
    setSearchQuery(keyword);
  }, [searchParams]);

  const filteredItems = dataItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);
    const matchesDataTypes = matchesFacetSelection(
      selectedDataTypes,
      item.data_types,
    );
    const matchesFormats = matchesFacetSelection(selectedFormats, item.formats);
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.data_types?.some((t) => t.toLowerCase().includes(q)) ||
      item.formats?.some((f) => f.toLowerCase().includes(q));
    return (
      matchesCategory &&
      matchesDataTypes &&
      matchesFormats &&
      matchesSearch
    );
  });

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [
    selectedCategories,
    selectedDataTypes,
    selectedFormats,
    searchQuery,
    viewMode,
  ]);

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
            {/* Left filters — categories, data types, formats (same options as create/edit project) */}
            <aside className="w-full lg:w-80 lg:shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Categories */}
                <div className="space-y-2 mb-3">
                  <h2 className="text-white font-semibold">Categories</h2>
                  <p className="text-sm text-white/60">
                    Select one or more categories to filter datasets.
                  </p>
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-white/70">
                      {selectedCategories.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {JOB_CATEGORIES.map((category) => {
                    const selected = selectedCategories.includes(category);
                    const { icon: IconComponent, label } =
                      JOB_CATEGORY_DISPLAY[category as JobCategory];
                    return (
                      <GelFilterChip
                        key={category}
                        selected={selected}
                        onClick={() => toggleCategory(category)}
                      >
                        <span className="flex shrink-0 w-7 h-7 items-center justify-center rounded overflow-hidden">
                          <span className="dark:hidden block w-5 h-5 [&_svg]:size-full">
                            <IconComponent
                              color={
                                selected ? "#ffffff" : CATEGORY_ICON_COLOR
                              }
                            />
                          </span>
                          <span className="hidden dark:block w-5 h-5 [&_svg]:size-full">
                            <IconComponent
                              color={
                                selected ? "#0a0a0a" : CATEGORY_ICON_COLOR
                              }
                            />
                          </span>
                        </span>
                        <span className="text-left">{label}</span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 my-5" />

                {/* Data types */}
                <div className="space-y-2 mb-3">
                  <h2 className="text-white font-semibold">Data types</h2>
                  <p className="text-sm text-white/60">
                    Select one or more data types you need (matches project
                    requirements).
                  </p>
                </div>
                {selectedDataTypes.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-white/70">
                      {selectedDataTypes.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDataTypes([])}
                      className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {PROJECT_DATA_TYPES.map((type) => {
                    const selected = selectedDataTypes.includes(type);
                    const IconComponent = DATA_TYPE_ICONS[type] ?? MoreHorizontal;
                    return (
                      <GelFilterChip
                        key={type}
                        selected={selected}
                        onClick={() => toggleDataType(type)}
                      >
                        <span className="flex shrink-0 w-7 h-7 items-center justify-center rounded overflow-hidden">
                          <IconComponent
                            className={cn(
                              "w-5 h-5 object-contain",
                              selected
                                ? "dark:text-[#0a0a0a] text-white"
                                : "text-[#0a0a0a] dark:text-white",
                            )}
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </span>
                        <span className="text-left">{type}</span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 my-5" />

                {/* Formats */}
                <div className="space-y-2 mb-3">
                  <h2 className="text-white font-semibold">Formats</h2>
                  <p className="text-sm text-white/60">
                    Select one or more file formats (matches project
                    requirements).
                  </p>
                </div>
                {selectedFormats.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-white/70">
                      {selectedFormats.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFormats([])}
                      className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {PROJECT_FORMATS.map((format) => {
                    const selected = selectedFormats.includes(format);
                    return (
                      <GelFilterChip
                        key={format}
                        selected={selected}
                        onClick={() => toggleFormat(format)}
                      >
                        <span className="text-left">{format}</span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
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
                </div>
              </div>

              {/* Data Content */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
