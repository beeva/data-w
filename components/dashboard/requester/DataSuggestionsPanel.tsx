"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Database,
  Sparkles,
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
} from "lucide-react";
import {
  searchSimilarProjects,
  searchHuggingFaceDatasets,
  calculateBudgetSuggestions,
  type SimilarProject,
  type HuggingFaceDataset,
  type BudgetSuggestions,
} from "@/lib/services/dataSuggestionsService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";
import { getCategoryColor } from "@/lib/utils";

// Card: title+link row → description → tag pills → footer (author left, stats right)
const CARD_BASE =
  "rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all p-4 min-w-0 overflow-hidden";

interface DataSuggestionsPanelProps {
  title: string;
  description: string;
  onBudgetSelect?: (budget: number) => void;
}

export default function DataSuggestionsPanel({
  title,
  description,
  onBudgetSelect,
}: DataSuggestionsPanelProps) {
  const [similarProjects, setSimilarProjects] = useState<SimilarProject[]>([]);
  const [huggingFaceDatasets, setHuggingFaceDatasets] = useState<
    HuggingFaceDataset[]
  >([]);
  const [budgetSuggestions, setBudgetSuggestions] =
    useState<BudgetSuggestions | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [expandedProjectDescriptions, setExpandedProjectDescriptions] =
    useState<Record<string, boolean>>({});
  const [expandedDatasetDescriptions, setExpandedDatasetDescriptions] =
    useState<Record<string, boolean>>({});

  // Debounce search queries
  const searchQuery = useMemo(() => {
    return `${title} ${description}`.trim();
  }, [title, description]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSimilarProjects([]);
      setHuggingFaceDatasets([]);
      return;
    }

    const searchTimeout = setTimeout(() => {
      // Search similar projects
      setLoadingProjects(true);
      searchSimilarProjects(title, description, 5)
        .then(({ data, error }) => {
          if (!error && data) {
            setSimilarProjects(data);
            // Calculate budget suggestions from similar projects
            const suggestions = calculateBudgetSuggestions(data);
            setBudgetSuggestions(suggestions);
          }
        })
        .catch((err) => {
          console.error("Error searching similar projects:", err);
        })
        .finally(() => {
          setLoadingProjects(false);
        });

      // Search Hugging Face datasets
      setLoadingDatasets(true);
      searchHuggingFaceDatasets(searchQuery, 5)
        .then(({ data, error }) => {
          if (!error && data) {
            setHuggingFaceDatasets(data);
          }
        })
        .catch((err) => {
          console.error("Error searching Hugging Face datasets:", err);
        })
        .finally(() => {
          setLoadingDatasets(false);
        });
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, title, description]);

  const hasContent =
    similarProjects.length > 0 ||
    huggingFaceDatasets.length > 0 ||
    budgetSuggestions !== null;
  const isLoading = loadingProjects || loadingDatasets;
  const showLoadingSkeleton = isLoading && !hasContent;

  const toggleProjectDescription = (projectId: string) => {
    setExpandedProjectDescriptions((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const toggleDatasetDescription = (datasetId: string) => {
    setExpandedDatasetDescriptions((prev) => ({
      ...prev,
      [datasetId]: !prev[datasetId],
    }));
  };

  return (
    <div className="h-full min-w-0 overflow-hidden flex flex-col">
      {!searchQuery || searchQuery.length < 3 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Enter a project title and description to see suggestions</p>
        </div>
      ) : showLoadingSkeleton ? (
        <ScrollArea className="h-full min-w-0">
          <div className="space-y-4 p-4">
            {/* Budget skeleton */}
            <div>
              <Skeleton className="h-3.5 w-36 mb-2" />
              <div className={CARD_BASE}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>
            {/* Similar projects skeleton */}
            <div>
              <Skeleton className="h-3.5 w-28 mb-2" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className={CARD_BASE}>
                    <Skeleton className="h-4 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-4/5 mb-3" />
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Hugging Face section skeleton */}
            <div>
              <Skeleton className="h-3.5 w-40 mb-2" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className={CARD_BASE}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Skeleton className="h-4 flex-1 max-w-[200px]" />
                      <Skeleton className="h-4 w-4 rounded shrink-0" />
                    </div>
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-5/6 mb-3" />
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center py-2">
              Searching...
            </p>
          </div>
        </ScrollArea>
      ) : !hasContent ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 px-4">
          <div className="w-24 h-24 shrink-0">
            <EmptyDataSvg />
          </div>
          <h3 className="text-sm font-semibold text-foreground text-center">
            No suggestions found
          </h3>
          <p className="text-xs text-muted-foreground text-center">
            Try different keywords or a longer description.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-full min-w-0">
          <div className="space-y-4 pr-4 overflow-x-hidden min-w-0">
            {/* Budget Suggestions Section */}
            {budgetSuggestions && (
              <div className="min-w-0">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                  <TrendingUp className="w-3 h-3" />
                  Budget Suggestions
                </h3>
                <div className={CARD_BASE}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Recommended
                      </span>
                      <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                        ${budgetSuggestions.recommended.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Average:</span>
                        <span className="ml-1 font-medium text-foreground">
                          ${budgetSuggestions.average.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Median:</span>
                        <span className="ml-1 font-medium text-foreground">
                          ${budgetSuggestions.median.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min:</span>
                        <span className="ml-1 font-medium text-foreground">
                          ${budgetSuggestions.min.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max:</span>
                        <span className="ml-1 font-medium text-foreground">
                          ${budgetSuggestions.max.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Based on {budgetSuggestions.count} similar project
                        {budgetSuggestions.count !== 1 ? "s" : ""}
                      </p>
                      <Button
                        size="sm"
                        className="w-full min-w-0 h-auto py-2 text-xs leading-tight whitespace-normal break-words text-center bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() =>
                          onBudgetSelect?.(budgetSuggestions.recommended)
                        }
                      >
                        Use Recommended: $
                        {budgetSuggestions.recommended.toFixed(2)}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Projects Section */}
            {similarProjects.length > 0 && (
              <div className="min-w-0">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                  <Database className="w-3 h-3" />
                  Similar Projects
                </h3>
                <div className="space-y-3">
                  {similarProjects.map((project) => (
                    <div key={project.id} className={CARD_BASE}>
                      {/* Header: title only */}
                      <h4 className="text-base font-semibold text-foreground leading-tight line-clamp-2 break-words mb-1.5">
                        {project.title}
                      </h4>
                      {/* Description */}
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed mb-2 ${
                          expandedProjectDescriptions[project.id]
                            ? ""
                            : "line-clamp-3"
                        }`}
                      >
                        {project.description}
                      </p>
                      {project.description.length > 180 && (
                        <button
                          type="button"
                          onClick={() => toggleProjectDescription(project.id)}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline mb-3"
                        >
                          {expandedProjectDescriptions[project.id]
                            ? "Show less"
                            : "Show more"}
                        </button>
                      )}
                      {/* Tags: category + budget pills */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-1 border-none rounded-full max-w-full whitespace-normal break-words ${getCategoryColor(project.category)}`}
                        >
                          {project.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-2.5 py-1 border-none rounded-full bg-gray-100 dark:bg-gray-800 text-muted-foreground max-w-full whitespace-normal break-all"
                        >
                          <DollarSign className="w-3 h-3 mr-1 inline" />
                          {project.budget.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hugging Face Datasets Section */}
            {huggingFaceDatasets.length > 0 && (
              <div className="min-w-0">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                  <Sparkles className="w-3 h-3" />
                  Hugging Face Datasets
                </h3>
                <div className="space-y-3">
                  {huggingFaceDatasets.map((dataset) => (
                    <div key={dataset.id} className={CARD_BASE}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-base font-semibold text-foreground leading-tight line-clamp-2 break-words flex-1 min-w-0">
                          {dataset.name}
                        </h4>
                        <a
                          href={dataset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Open dataset"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      {/* Description */}
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed mb-2 ${
                          expandedDatasetDescriptions[dataset.id]
                            ? ""
                            : "line-clamp-3"
                        }`}
                      >
                        {dataset.description}
                      </p>
                      {dataset.description.length > 180 && (
                        <button
                          type="button"
                          onClick={() => toggleDatasetDescription(dataset.id)}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline mb-3"
                        >
                          {expandedDatasetDescriptions[dataset.id]
                            ? "Show less"
                            : "Show more"}
                        </button>
                      )}
                      {/* Tags: pill row */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {dataset.tags.slice(0, 5).map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs px-2.5 py-1 border-none text-muted-foreground bg-gray-100 dark:bg-gray-700 rounded-full font-normal max-w-full whitespace-normal break-all"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {/* Footer: [avatar] By Author (left) | views · likes (right) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="w-6 h-6 shrink-0">
                            <AvatarImage src="/default-avatar.svg" alt="" />
                            <AvatarFallback className="p-0 overflow-hidden bg-muted">
                              <img
                                src="/default-avatar.svg"
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground break-all">
                            By {dataset.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {dataset.downloads.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {dataset.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
