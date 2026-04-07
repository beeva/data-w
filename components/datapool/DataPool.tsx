"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
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
  Filter,
  FileText,
  FolderKanban,
  FolderSearch,
  Image,
  LayoutGrid,
  List,
  MapPin,
  MapPinned,
  Music,
  Mic,
  MoreHorizontal,
  RefreshCw,
  Search,
  Sparkles,
  Table,
  Video,
  Activity,
  ShoppingBag,
  X,
  type LucideIcon,
} from "lucide-react";

type PoolTab = "browse" | "purchases" | "mine";
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
  type JobCategory,
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
        "btn-gelatine flex w-full min-w-0 items-center gap-2 rounded-xl pl-3 pr-3 py-2.5 text-sm font-medium transition-all border text-left",
        selected
          ? "border-cyan-400/45 bg-gradient-to-br from-cyan-500/25 to-teal-600/20 text-white shadow-[0_0_20px_-8px_rgba(34,211,238,0.45)]"
          : "border-white/10 bg-white/[0.04] text-white/85 hover:border-white/20 hover:bg-white/[0.07]",
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
          ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
          : "border-white/20 bg-transparent",
      )}
      aria-hidden
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

function BrowseResultsSkeleton({ viewMode }: { viewMode: "card" | "list" }) {
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
          >
            <div className="h-32 bg-white/[0.06]" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-[85%] rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/[0.06]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded-full bg-white/10" />
                <div className="h-6 w-20 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-white/[0.08]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-[55%] max-w-md rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/[0.06]" />
                <div className="h-3 w-[80%] rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end sm:pl-4 sm:border-l sm:border-white/10">
              <div className="h-8 w-20 rounded-lg bg-white/[0.08]" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.08]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataPool() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const [poolTab, setPoolTabState] = useState<PoolTab>("browse");
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
    profile?.role === "personal" ||
    profile?.role === "company" ||
    profile?.role === "collector";

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
    if (t === "purchases") setPoolTabState(profile?.id ? "purchases" : "browse");
    else if (t === "mine") setPoolTabState(profile?.id ? "mine" : "browse");
  }, [searchParams, profile?.id]);

  const setPoolTab = useCallback(
    (v: string) => {
      let next: PoolTab = "browse";
      if (v === "purchases") next = profile?.id ? "purchases" : "browse";
      else if (v === "mine") next = profile?.id ? "mine" : "browse";
      setPoolTabState(next);
      if (next === "browse" || next === "mine") {
        void fetchDataPoolItems({ silent: true });
      }
      const params = new URLSearchParams(searchParams.toString());
      if (next === "purchases") params.set("tab", "purchases");
      else if (next === "mine") params.set("tab", "mine");
      else params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `/datapool?${qs}` : "/datapool", { scroll: false });
    },
    [router, searchParams, fetchDataPoolItems, profile?.id],
  );

  useEffect(() => {
    if (!profile?.id && (poolTab === "mine" || poolTab === "purchases")) {
      setPoolTab("browse");
    }
  }, [profile?.id, poolTab, setPoolTab]);

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

  const filteredMyItems = useMemo(() => {
    if (!profile?.id) return [];
    return filteredItems.filter((item) => item.owner_user_id === profile.id);
  }, [filteredItems, profile?.id]);

  const ownedDatasetCount = useMemo(() => {
    if (!profile?.id) return 0;
    return dataItems.filter((item) => item.owner_user_id === profile.id).length;
  }, [dataItems, profile?.id]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  const visiblePurchaseRows = filteredPurchases.slice(0, visibleCount);
  const hasMorePurchases = filteredPurchases.length > visibleCount;

  const visibleMyItems = filteredMyItems.slice(0, visibleCount);
  const hasMoreMine = filteredMyItems.length > visibleCount;

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

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedDataTypes([]);
    setSelectedFormats([]);
  }, []);

  const activeFilterCount =
    selectedCategories.length +
    selectedDataTypes.length +
    selectedFormats.length;

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    for (const c of selectedCategories) {
      const label =
        JOB_CATEGORY_DISPLAY[c as JobCategory]?.label ?? c;
      chips.push({
        key: `cat-${c}`,
        label,
        onRemove: () =>
          setSelectedCategories((prev) => prev.filter((x) => x !== c)),
      });
    }
    for (const t of selectedDataTypes) {
      chips.push({
        key: `dt-${t}`,
        label: t,
        onRemove: () =>
          setSelectedDataTypes((prev) => prev.filter((x) => x !== t)),
      });
    }
    for (const f of selectedFormats) {
      chips.push({
        key: `fmt-${f}`,
        label: f,
        onRemove: () =>
          setSelectedFormats((prev) => prev.filter((x) => x !== f)),
      });
    }
    return chips;
  }, [selectedCategories, selectedDataTypes, selectedFormats]);

  useEffect(() => {
    if (!showMobileFilters) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showMobileFilters]);

  useEffect(() => {
    if (!showMobileFilters) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMobileFilters(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showMobileFilters]);

  const renderFiltersPanel = (isMobile = false) => (
    <div
      className={cn(
        "datapool-filter-scrollbar border border-white/10 bg-white/[0.04] p-4 pr-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-y-auto overscroll-y-contain",
        isMobile
          ? "h-full rounded-none border-l-0 border-y-0"
          : "rounded-xl sticky top-6 max-h-[calc(100vh-8rem)]",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.07] px-3 py-2.5">
        <div className="flex gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-300/90 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/90">Refine results</p>
            <p className="text-[11px] leading-snug text-white/50 mt-0.5">
              Tap to combine filters. Your search applies to titles and descriptions too.
            </p>
          </div>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="mb-4 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-cyan-500/35 hover:bg-white/[0.1] hover:text-white"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
      <div className="space-y-2 mb-3">
        <h2 className="text-white font-semibold text-sm tracking-wide">Categories</h2>
        <p className="text-xs text-white/55 leading-relaxed">
          What kind of work does this dataset support?
        </p>
      </div>
      {selectedCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-medium text-cyan-200/80">
            {selectedCategories.length} selected
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className="text-[11px] font-medium text-white/55 hover:text-white underline underline-offset-2"
          >
            Reset section
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
                  selected ? "text-cyan-100" : "text-cyan-400/85",
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
        <h2 className="text-white font-semibold text-sm tracking-wide">Data types</h2>
        <p className="text-xs text-white/55 leading-relaxed">
          Match the kind of media or signals you need in a project.
        </p>
      </div>
      {selectedDataTypes.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-medium text-cyan-200/80">
            {selectedDataTypes.length} selected
          </span>
          <button
            type="button"
            onClick={() => setSelectedDataTypes([])}
            className="text-[11px] font-medium text-white/55 hover:text-white underline underline-offset-2"
          >
            Reset section
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
                  selected ? "text-cyan-100" : "text-cyan-400/85",
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
        <h2 className="text-white font-semibold text-sm tracking-wide">Formats</h2>
        <p className="text-xs text-white/55 leading-relaxed">
          Narrow down by file types such as CSV, JSON, or imagery.
        </p>
      </div>
      {selectedFormats.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-medium text-cyan-200/80">
            {selectedFormats.length} selected
          </span>
          <button
            type="button"
            onClick={() => setSelectedFormats([])}
            className="text-[11px] font-medium text-white/55 hover:text-white underline underline-offset-2"
          >
            Reset section
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
  );

  return (
    <div className="relative min-h-screen bg-[#0f1419] overflow-x-clip">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(42rem,55vh)] bg-gradient-to-b from-cyan-950/25 via-transparent to-transparent"
        aria-hidden
      />
      <Header />
      <PageHero
        title="Data"
        subtitle="Marketplace"
        description="Discover datasets from contributors worldwide—filter by category, then open a listing to preview files and purchase with your wallet."
        compact
      />
      <main className="relative pb-24 pt-6">
        <div className="container mx-auto px-4 sm:px-6">
          <Tabs
            value={poolTab}
            onValueChange={setPoolTab}
            className="w-full gap-0"
          >
            <TabsUnderlineList
              className={cn(
                "mb-6 border-white/10 px-0",
                "max-sm:grid max-sm:gap-0 max-sm:items-stretch",
                profile?.id ? "max-sm:grid-cols-3" : "max-sm:grid-cols-1",
                "sm:flex sm:w-full sm:items-end sm:justify-start sm:gap-10",
              )}
            >
              <TabsUnderlineTrigger
                value="browse"
                className={cn(
                  "text-white/55 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-100",
                  "max-sm:inline-flex max-sm:min-h-[52px] max-sm:w-full max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-1 max-sm:px-1 max-sm:pb-2.5 max-sm:text-[11px] max-sm:leading-tight",
                  "sm:gap-2 sm:shrink-0 sm:pb-3",
                )}
              >
                <LayoutGrid className="h-4 w-4 opacity-80" aria-hidden />
                <span className="max-sm:block max-sm:text-center max-sm:max-w-full max-sm:truncate sm:inline">
                  Browse
                </span>
              </TabsUnderlineTrigger>
              {profile?.id ? (
                <TabsUnderlineTrigger
                  value="mine"
                  className={cn(
                    "text-white/55 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-100",
                    "max-sm:inline-flex max-sm:min-h-[52px] max-sm:w-full max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-1 max-sm:px-1 max-sm:pb-2.5 max-sm:text-[11px] max-sm:leading-tight",
                    "sm:gap-2 sm:shrink-0 sm:pb-3",
                  )}
                >
                  <FolderKanban className="h-4 w-4 opacity-80" aria-hidden />
                  <span className="max-sm:text-center max-sm:max-w-full max-sm:truncate sm:hidden">
                    Mine
                  </span>
                  <span className="hidden sm:inline">My datasets</span>
                </TabsUnderlineTrigger>
              ) : null}
              {profile?.id ? (
                <TabsUnderlineTrigger
                  value="purchases"
                  className={cn(
                    "text-white/55 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-100",
                    "max-sm:inline-flex max-sm:min-h-[52px] max-sm:w-full max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-1 max-sm:px-1 max-sm:pb-2.5 max-sm:text-[11px] max-sm:leading-tight",
                    "sm:gap-2 sm:shrink-0 sm:pb-3",
                  )}
                >
                  <ShoppingBag className="h-4 w-4 opacity-80" aria-hidden />
                  <span className="max-sm:block max-sm:text-center max-sm:max-w-full max-sm:truncate sm:inline">
                    Purchases
                  </span>
                </TabsUnderlineTrigger>
              ) : null}
            </TabsUnderlineList>

            <div className="flex flex-col lg:flex-row gap-6">
            <aside className="hidden lg:block w-full lg:w-80 lg:shrink-0">
              {renderFiltersPanel()}
            </aside>

            <section className="flex-1 min-w-0">
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                  <div className="lg:hidden flex items-center justify-between gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setShowMobileFilters(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:border-cyan-400/45 hover:bg-white/[0.14] transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      Filters
                      {activeFilterCount > 0 ? (
                        <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[11px] text-cyan-100">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </button>
                    {canListDatasets && (
                      <button
                        type="button"
                        onClick={openCreateDatasetDialog}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-teal-600/15 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_-12px_rgba(34,211,238,0.5)] transition-all hover:border-cyan-300/60 hover:from-cyan-500/30 hover:to-teal-600/25"
                      >
                        <Sparkles className="h-4 w-4 opacity-80 group-hover:opacity-100" aria-hidden />
                        List a dataset
                      </button>
                    )}
                  </div>
                  {canListDatasets && (
                    <button
                      type="button"
                      onClick={openCreateDatasetDialog}
                      className="group hidden lg:inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-teal-600/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_-12px_rgba(34,211,238,0.5)] transition-all hover:border-cyan-300/60 hover:from-cyan-500/30 hover:to-teal-600/25"
                    >
                      <Sparkles className="h-4 w-4 opacity-80 group-hover:opacity-100" aria-hidden />
                      List a dataset
                    </button>
                  )}
                  <div className="relative flex-shrink-0 w-full sm:w-80 max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        poolTab === "purchases"
                          ? "Search by title, owner, or type…"
                          : poolTab === "mine"
                            ? "Search your listings…"
                            : "Search titles, descriptions, tags…"
                      }
                      aria-label={
                        poolTab === "purchases"
                          ? "Search purchases"
                          : poolTab === "mine"
                            ? "Search my datasets"
                            : "Search datasets"
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 shadow-inner transition-colors focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {poolTab === "browse" && !loading && !error && (
                    <p className="text-sm text-white/50 truncate">
                      {filteredItems.length === 0
                        ? "No matches"
                        : `Showing ${visibleItems.length} of ${filteredItems.length} dataset${filteredItems.length === 1 ? "" : "s"}`}
                    </p>
                  )}
                  {poolTab === "mine" &&
                    profile?.id &&
                    !loading &&
                    !error && (
                      <p className="text-sm text-white/50 truncate">
                        {filteredMyItems.length === 0
                          ? "No matches"
                          : `Showing ${visibleMyItems.length} of ${filteredMyItems.length} listing${filteredMyItems.length === 1 ? "" : "s"}`}
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
                {(poolTab === "browse" || poolTab === "mine") && (
                  <div
                    className="inline-flex w-fit rounded-xl border border-white/10 p-1 bg-white/[0.05]"
                    role="group"
                    aria-label="Layout"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      title="Single-column rows — easy to scan full width"
                      aria-pressed={viewMode === "list"}
                      aria-label="List layout"
                      className={cn(
                        "rounded-lg p-2 transition-all",
                        viewMode === "list"
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/50 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      <List className="w-5 h-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      title="Larger cards with more detail per dataset"
                      aria-pressed={viewMode === "card"}
                      aria-label="Card layout"
                      className={cn(
                        "rounded-lg p-2 transition-all",
                        viewMode === "card"
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/50 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      <LayoutGrid className="w-5 h-5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
                  showMobileFilters
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none",
                )}
                aria-hidden={!showMobileFilters}
              >
                <button
                  type="button"
                  className={cn(
                    "absolute inset-0 bg-black/65 transition-opacity duration-300",
                    showMobileFilters ? "opacity-100" : "opacity-0",
                  )}
                  aria-label="Close filters"
                  onClick={() => setShowMobileFilters(false)}
                />
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-[88%] max-w-sm bg-[#0f1419] border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out flex min-h-0 flex-col",
                    showMobileFilters ? "translate-x-0" : "-translate-x-full",
                  )}
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
                    <h2 className="text-sm font-semibold text-white">Filters</h2>
                    <button
                      type="button"
                      onClick={() => setShowMobileFilters(false)}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                      aria-label="Close filters panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    {renderFiltersPanel(true)}
                  </div>
                </div>
              </div>

                {(poolTab === "browse" || poolTab === "mine" || poolTab === "purchases") &&
                  activeFilterChips.length > 0 &&
                  !(poolTab === "browse" && loading) &&
                  !(poolTab === "mine" && loading) &&
                  !(poolTab === "purchases" && purchasesLoading) && (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        Active
                      </span>
                      {activeFilterChips.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={c.onRemove}
                          className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-cyan-100 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/20"
                          title={`Remove ${c.label}`}
                        >
                          <span className="truncate">{c.label}</span>
                          <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="ml-auto text-[11px] font-semibold text-white/45 hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
              </div>

              {poolTab === "browse" ? (
                <>
                  {loading ? (
                    <BrowseResultsSkeleton viewMode={viewMode} />
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
                    <div className="flex flex-col gap-3">
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
                      className="mt-12 mx-auto flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-8 py-3 text-sm font-semibold text-white transition-all hover:border-cyan-400/45 hover:bg-white/[0.12] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]"
                    >
                      Load more datasets
                    </button>
                  )}

                  {!loading && error && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-6 py-8 text-center">
                      <p className="text-red-200/95 text-base font-medium">{error}</p>
                      <p className="mt-2 text-sm text-white/50">
                        Check your connection and try again—we will reload the marketplace.
                      </p>
                      <button
                        type="button"
                        onClick={() => void fetchDataPoolItems()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-cyan-400/40 hover:bg-white/[0.12]"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Try again
                      </button>
                    </div>
                  )}
                  {!loading && !error && filteredItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-8 py-14 text-center">
                      <FolderSearch
                        className="mx-auto h-12 w-12 text-cyan-400/50"
                        strokeWidth={1.25}
                        aria-hidden
                      />
                      <p className="mt-4 text-lg font-semibold text-white/90">
                        Nothing matches yet
                      </p>
                      <p className="mt-2 max-w-md mx-auto text-sm text-white/55 leading-relaxed">
                        {dataItems.length === 0
                          ? "New datasets appear here as they are listed. Check back soon, or list your own if you are a contributor."
                          : "Try clearing a few filters or shortening your search—we look at titles, descriptions, categories, and tags."}
                      </p>
                      {(activeFilterCount > 0 || searchQuery.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            clearAllFilters();
                            setSearchQuery("");
                          }}
                          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-400/55 hover:bg-cyan-500/15"
                        >
                          Reset search & filters
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : poolTab === "mine" ? (
                <>
                  {!profile?.id ? (
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-14 text-center shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                        <FolderKanban className="h-7 w-7 text-cyan-300/80" aria-hidden />
                      </div>
                      <p className="mt-5 text-lg font-semibold text-white/95">
                        Sign in to manage your listings
                      </p>
                      <p className="mt-2 max-w-sm mx-auto text-sm text-white/55 leading-relaxed">
                        Listed datasets appear here so you can open, edit, or track what you sell on the Data Pool.
                      </p>
                      <Link
                        href="/login"
                        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/45 bg-gradient-to-r from-cyan-500/20 to-teal-600/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-300/55 hover:from-cyan-500/30 hover:to-teal-600/25"
                      >
                        Sign in
                      </Link>
                    </div>
                  ) : loading ? (
                    <BrowseResultsSkeleton viewMode={viewMode} />
                  ) : viewMode === "card" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {visibleMyItems.map((item) => (
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
                    <div className="flex flex-col gap-3">
                      {visibleMyItems.map((item) => (
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

                  {profile?.id && hasMoreMine && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="mt-12 mx-auto flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-8 py-3 text-sm font-semibold text-white transition-all hover:border-cyan-400/45 hover:bg-white/[0.12] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]"
                    >
                      Load more datasets
                    </button>
                  )}

                  {profile?.id && !loading && error && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-6 py-8 text-center">
                      <p className="text-red-200/95 text-base font-medium">{error}</p>
                      <p className="mt-2 text-sm text-white/50">
                        Check your connection and try again—we will reload your listings.
                      </p>
                      <button
                        type="button"
                        onClick={() => void fetchDataPoolItems()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-cyan-400/40 hover:bg-white/[0.12]"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Try again
                      </button>
                    </div>
                  )}
                  {profile?.id &&
                    !loading &&
                    !error &&
                    filteredMyItems.length === 0 &&
                    ownedDatasetCount === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 sm:px-8 py-12 sm:py-14 text-center">
                        <FolderKanban
                          className="mx-auto h-12 w-12 text-cyan-400/50"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                        <p className="mt-4 text-lg font-semibold text-white/90">
                          No listings yet
                        </p>
                        <p className="mt-2 max-w-md mx-auto text-sm text-white/55 leading-relaxed">
                          When you list a dataset, it appears here so you can update pricing, files, and details anytime.
                        </p>
                        {canListDatasets ? (
                          <button
                            type="button"
                            onClick={openCreateDatasetDialog}
                            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-400/55 hover:bg-cyan-500/15"
                          >
                            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                            List a dataset
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPoolTab("browse")}
                            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-400/55 hover:bg-cyan-500/15"
                          >
                            Browse marketplace
                          </button>
                        )}
                      </div>
                    )}
                  {profile?.id &&
                    !loading &&
                    !error &&
                    filteredMyItems.length === 0 &&
                    ownedDatasetCount > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                        <Filter className="mx-auto h-9 w-9 text-white/25" aria-hidden />
                        <p className="mt-3 text-base font-semibold text-white/85">No listings match</p>
                        <p className="mt-2 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                          Loosen filters or clear the search—your listings are still there.
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

