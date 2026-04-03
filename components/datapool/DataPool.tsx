"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import DataItemCard, { type DataItem } from "./DataItemCard";
import DataItemListItem from "./DataItemListItem";
import CreateDataSetDialog from "./CreateDataSetDialog";
import DataPoolPurchasesPanel from "./DataPoolPurchasesPanel";
import { Tabs, TabsUnderlineList, TabsUnderlineTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Camera,
  Check,
  Cpu,
  FileText,
  Image,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  MapPinned,
  Music,
  Mic,
  MoreHorizontal,
  Table,
  Video,
  Activity,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import {
  getDataPoolItems,
  listMyDataPoolPurchases,
  type DataPoolPurchaseListRow,
} from "@/lib/services/dataPoolService";
import {
  JOB_CATEGORIES,
  JOB_CATEGORY_DISPLAY,
  PROJECT_DATA_TYPES,
  PROJECT_FORMATS,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Same category icons as `components/Projects.tsx` filter sidebar */
const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Photography: Camera,
  Video: Video,
  Audio: Mic,
  Text: FileText,
  Survey: BarChart3,
  "Location Data": MapPinned,
  "Sensor Data": Cpu,
  Other: MoreHorizontal,
};

/** Keep data type icon mapping consistent with create project flow. */
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
  title,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "btn-gelatine flex w-full min-w-0 items-center gap-2 rounded-full pl-3 pr-4 py-2.5 text-sm font-medium transition-all border text-left",
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
        "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const [poolTab, setPoolTabState] = useState<"browse" | "purchases">("browse");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  const [datasetDialogMode, setDatasetDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [datasetBeingEdited, setDatasetBeingEdited] =
    useState<DataItem | null>(null);
  const [purchaseRows, setPurchaseRows] = useState<DataPoolPurchaseListRow[]>(
    [],
  );
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState("");
  const itemsPerPage = 8;

  const canListDatasets =
    profile?.role === "personal" || profile?.role === "company";

  const openCreateDatasetDialog = () => {
    setDatasetDialogMode("create");
    setDatasetBeingEdited(null);
    setDatasetDialogOpen(true);
  };

  const openEditDatasetDialog = (item: DataItem) => {
    setDatasetDialogMode("edit");
    setDatasetBeingEdited(item);
    setDatasetDialogOpen(true);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const toggleDataType = (value: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleFormat = (value: string) => {
    setSelectedFormats((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const fetchDataPoolItems = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setLoading(true);
      setError("");
    }

    const { data, error: fetchError } = await getDataPoolItems();

    if (fetchError) {
      if (!silent) {
        setError(fetchError.message || "Failed to load DataPool items.");
        setDataItems([]);
      }
    } else {
      setDataItems(data || []);
      if (!silent) setError("");
    }

    if (!silent) setLoading(false);
  }, []);

  const fetchPurchases = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!profile?.id) {
        setPurchaseRows([]);
        if (!silent) {
          setPurchasesLoading(false);
          setPurchasesError("");
        }
        return;
      }
      if (!silent) {
        setPurchasesLoading(true);
        setPurchasesError("");
      }
      const { data, error: pErr } = await listMyDataPoolPurchases();
      if (pErr) {
        if (!silent) {
          setPurchasesError(pErr.message || "Failed to load purchases.");
          setPurchaseRows([]);
        }
      } else {
        setPurchaseRows(data ?? []);
        if (!silent) setPurchasesError("");
      }
      if (!silent) setPurchasesLoading(false);
    },
    [profile?.id],
  );

  useEffect(() => {
    void fetchDataPoolItems();
  }, [fetchDataPoolItems]);

  useEffect(() => {
    if (poolTab !== "purchases") return;
    void fetchPurchases();
  }, [poolTab, fetchPurchases]);

  useEffect(() => {
    const keyword = searchParams.get("keyword")?.trim();
    if (!keyword) return;
    setSearchQuery(keyword);
  }, [searchParams]);

  useEffect(() => {
    const t = searchParams.get("tab")?.toLowerCase();
    if (t === "purchases") setPoolTabState("purchases");
  }, [searchParams]);

  const setPoolTab = useCallback(
    (v: string) => {
      const next = v === "purchases" ? "purchases" : "browse";
      setPoolTabState(next);
      if (next === "browse") {
        void fetchDataPoolItems({ silent: true });
      }
      const params = new URLSearchParams(searchParams.toString());
      if (next === "purchases") params.set("tab", "purchases");
      else params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `/datapool?${qs}` : "/datapool", { scroll: false });
    },
    [router, searchParams, fetchDataPoolItems],
  );

  const filteredItems = dataItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);
    const matchesDataTypes = matchesFacetSelection(selectedDataTypes, item.data_types);
    const matchesFormats = matchesFacetSelection(selectedFormats, item.formats);
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.data_types?.some((t) => t.toLowerCase().includes(q)) ||
      item.formats?.some((f) => f.toLowerCase().includes(q));
    return matchesCategory && matchesDataTypes && matchesFormats && matchesSearch;
  });

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return purchaseRows.filter((row) => {
      const ds = row.dataset;
      if (!ds) {
        const matchesSearch =
          searchQuery === "" ||
          "removed dataset".includes(q) ||
          "removed".includes(q);
        const noFacets =
          selectedCategories.length === 0 &&
          selectedDataTypes.length === 0 &&
          selectedFormats.length === 0;
        return noFacets && matchesSearch;
      }
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(ds.category);
      const matchesDataTypes = matchesFacetSelection(
        selectedDataTypes,
        ds.data_types,
      );
      const matchesFormats = matchesFacetSelection(selectedFormats, ds.formats);
      const matchesSearch =
        searchQuery === "" ||
        ds.title.toLowerCase().includes(q) ||
        (ds.description?.toLowerCase().includes(q) ?? false) ||
        ds.category.toLowerCase().includes(q) ||
        ds.data_types.some((t) => t.toLowerCase().includes(q)) ||
        ds.formats.some((f) => f.toLowerCase().includes(q));
      return (
        matchesCategory && matchesDataTypes && matchesFormats && matchesSearch
      );
    });
  }, [
    purchaseRows,
    searchQuery,
    selectedCategories,
    selectedDataTypes,
    selectedFormats,
  ]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  const visiblePurchaseRows = filteredPurchases.slice(0, visibleCount);
  const hasMorePurchases = filteredPurchases.length > visibleCount;

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [
    selectedCategories,
    selectedDataTypes,
    selectedFormats,
    searchQuery,
    viewMode,
    poolTab,
  ]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  const handleOpenDatasetDetail = (item: DataItem) => {
    router.push(`/datapool/datasets?id=${encodeURIComponent(item.id)}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />
      <PageHero
        title="Data"
        subtitle="Marketplace"
        description="Browse and access curated datasets gathered from our global network"
        compact
      />
      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">
          <Tabs
            value={poolTab}
            onValueChange={setPoolTab}
            className="w-full gap-0"
          >
            <TabsUnderlineList className="mb-6 border-white/10 px-0">
              <TabsUnderlineTrigger
                value="browse"
                className="text-white/60 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-200"
              >
                <LayoutGrid className="h-4 w-4" />
                Browse
              </TabsUnderlineTrigger>
              <TabsUnderlineTrigger
                value="purchases"
                className="text-white/60 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-200"
              >
                <ShoppingBag className="h-4 w-4" />
                My purchases
              </TabsUnderlineTrigger>
            </TabsUnderlineList>

            <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-80 lg:shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-2">
                  {JOB_CATEGORIES.map((category) => {
                    const selected = selectedCategories.includes(category);
                    const { label } = JOB_CATEGORY_DISPLAY[category];
                    const Icon = CATEGORY_ICONS[category] ?? MoreHorizontal;
                    return (
                      <GelFilterChip
                        key={category}
                        selected={selected}
                        onClick={() => toggleCategory(category)}
                        title={label}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selected
                              ? "text-white dark:text-black"
                              : "text-cyan-400",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 min-w-0 text-left break-words line-clamp-2">
                          {label}
                        </span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 my-5" />

                <div className="space-y-2 mb-3">
                  <h2 className="text-white font-semibold">Data types</h2>
                  <p className="text-sm text-white/60">
                    Select one or more data types you need (matches project requirements).
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
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_DATA_TYPES.map((type) => {
                    const selected = selectedDataTypes.includes(type);
                    const Icon = DATA_TYPE_ICONS[type] ?? MoreHorizontal;
                    return (
                      <GelFilterChip
                        key={type}
                        selected={selected}
                        onClick={() => toggleDataType(type)}
                        title={type}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selected
                              ? "text-white dark:text-black"
                              : "text-cyan-400",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 min-w-0 text-left break-words line-clamp-2">
                          {type}
                        </span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 my-5" />

                <div className="space-y-2 mb-3">
                  <h2 className="text-white font-semibold">Formats</h2>
                  <p className="text-sm text-white/60">
                    Select one or more file formats (matches project requirements).
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
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_FORMATS.map((format) => {
                    const selected = selectedFormats.includes(format);
                    return (
                      <GelFilterChip
                        key={format}
                        selected={selected}
                        onClick={() => toggleFormat(format)}
                        title={format}
                      >
                        <span className="flex-1 min-w-0 text-left break-words line-clamp-2">
                          {format}
                        </span>
                        <TrailingCheckCircle selected={selected} />
                      </GelFilterChip>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className="flex-1 min-w-0">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                  {canListDatasets && (
                    <button
                      type="button"
                      onClick={openCreateDatasetDialog}
                      className="shrink-0 rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-500/25"
                    >
                      List a dataset
                    </button>
                  )}
                  <div className="relative flex-shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        poolTab === "purchases"
                          ? "Search your purchases..."
                          : "Search datasets..."
                      }
                      aria-label={
                        poolTab === "purchases"
                          ? "Search purchases"
                          : "Search datasets"
                      }
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
                  {poolTab === "browse" && !loading && !error && (
                    <p className="text-sm text-white/50 truncate">
                      {filteredItems.length === 0
                        ? "No matches"
                        : `Showing ${visibleItems.length} of ${filteredItems.length} dataset${filteredItems.length === 1 ? "" : "s"}`}
                    </p>
                  )}
                  {poolTab === "purchases" &&
                    profile?.id &&
                    !purchasesLoading &&
                    !purchasesError && (
                      <p className="text-sm text-white/50 truncate">
                        {filteredPurchases.length === 0
                          ? "No matches"
                          : `Showing ${visiblePurchaseRows.length} of ${filteredPurchases.length} purchase${filteredPurchases.length === 1 ? "" : "s"}`}
                      </p>
                    )}
                </div>
                {poolTab === "browse" && (
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
                )}
              </div>

              {poolTab === "browse" ? (
                <>
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
                          onRequestAccess={handleOpenDatasetDetail}
                          currentUserId={profile?.id}
                          onEditDataset={
                            canListDatasets ? openEditDatasetDialog : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {visibleItems.map((item) => (
                        <DataItemListItem
                          key={item.id}
                          item={item}
                          onRequestAccess={handleOpenDatasetDetail}
                          currentUserId={profile?.id}
                          onEditDataset={
                            canListDatasets ? openEditDatasetDialog : undefined
                          }
                        />
                      ))}
                    </div>
                  )}

                  {hasMore && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="mt-12 mx-auto block px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                    >
                      Load More
                    </button>
                  )}

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
                </>
              ) : (
                <DataPoolPurchasesPanel
                  userId={profile?.id}
                  loading={purchasesLoading}
                  error={purchasesError}
                  visibleRows={visiblePurchaseRows}
                  totalLoaded={purchaseRows.length}
                  totalFiltered={filteredPurchases.length}
                  hasMore={hasMorePurchases}
                  onLoadMore={handleLoadMore}
                  onBrowseClick={() => setPoolTab("browse")}
                />
              )}
            </section>
          </div>
          </Tabs>
        </div>
      </main>

      <CreateDataSetDialog
        open={datasetDialogOpen}
        onOpenChange={(open) => {
          setDatasetDialogOpen(open);
          if (!open) setDatasetBeingEdited(null);
        }}
        mode={datasetDialogMode}
        dataset={datasetBeingEdited}
        onSuccess={() => {
          void fetchDataPoolItems();
        }}
      />

    </div>
  );
}

