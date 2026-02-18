"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ExternalLink, Database, Sparkles, DollarSign, Calendar, TrendingUp } from "lucide-react";
import {
  searchSimilarProjects,
  searchHuggingFaceDatasets,
  calculateBudgetSuggestions,
  type SimilarProject,
  type HuggingFaceDataset,
  type BudgetSuggestions,
} from "@/lib/services/dataSuggestionsService";
import { Button } from "@/components/ui/button";

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
  const [huggingFaceDatasets, setHuggingFaceDatasets] = useState<HuggingFaceDataset[]>([]);
  const [budgetSuggestions, setBudgetSuggestions] = useState<BudgetSuggestions | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

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

  const hasContent = similarProjects.length > 0 || huggingFaceDatasets.length > 0 || budgetSuggestions !== null;
  const isLoading = loadingProjects || loadingDatasets;

  return (
    <div className="h-full flex flex-col">
      <Card className="dark:bg-gray-800/50 border-none flex-1 flex flex-col">
        <CardHeader className="py-2 px-3 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Data Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {!searchQuery || searchQuery.length < 3 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Enter a project title and description to see suggestions</p>
            </div>
          ) : isLoading && !hasContent ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-cyan-400" />
              <p className="text-xs text-muted-foreground">Searching...</p>
            </div>
          ) : !hasContent ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              <p>No suggestions found. Try different keywords.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                {/* Budget Suggestions Section */}
                {budgetSuggestions && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                      <TrendingUp className="w-3 h-3" />
                      Budget Suggestions
                    </h3>
                    <Card className="dark:bg-gray-700/50 border border-gray-600/50 p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Recommended</span>
                          <span className="text-sm font-semibold text-cyan-400">
                            ${budgetSuggestions.recommended.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-muted-foreground">Average:</span>
                            <span className="ml-1 font-medium">
                              ${budgetSuggestions.average.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Median:</span>
                            <span className="ml-1 font-medium">
                              ${budgetSuggestions.median.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min:</span>
                            <span className="ml-1 font-medium">
                              ${budgetSuggestions.min.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max:</span>
                            <span className="ml-1 font-medium">
                              ${budgetSuggestions.max.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-600/50">
                          <p className="text-[9px] text-muted-foreground mb-2">
                            Based on {budgetSuggestions.count} similar project{budgetSuggestions.count !== 1 ? 's' : ''}
                          </p>
                          <Button
                            size="sm"
                            className="w-full h-6 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => onBudgetSelect?.(budgetSuggestions.recommended)}
                          >
                            Use Recommended: ${budgetSuggestions.recommended.toFixed(2)}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Similar Projects Section */}
                {similarProjects.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                      <Database className="w-3 h-3" />
                      Similar Projects
                    </h3>
                    <div className="space-y-2">
                      {similarProjects.map((project) => (
                        <Card
                          key={project.id}
                          className="dark:bg-gray-700/50 border border-gray-600/50 p-2 hover:border-cyan-400/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-medium line-clamp-1">
                              {project.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 border-cyan-400/30 text-cyan-300/80"
                              >
                                {project.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                <DollarSign className="w-2.5 h-2.5" />
                                ${project.budget.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hugging Face Datasets Section */}
                {huggingFaceDatasets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-cyan-400">
                      <Sparkles className="w-3 h-3" />
                      Hugging Face Datasets
                    </h3>
                    <div className="space-y-2">
                      {huggingFaceDatasets.map((dataset) => (
                        <Card
                          key={dataset.id}
                          className="dark:bg-gray-700/50 border border-gray-600/50 p-2 hover:border-cyan-400/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-medium line-clamp-1 flex-1">
                                {dataset.name}
                              </h4>
                              <a
                                href={dataset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                              {dataset.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {dataset.tags.slice(0, 3).map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 border-cyan-400/30 text-cyan-300/80"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground ml-auto">
                                <span>👁 {dataset.downloads.toLocaleString()}</span>
                                <span className="ml-1">❤️ {dataset.likes}</span>
                              </div>
                            </div>
                            <p className="text-[9px] text-muted-foreground">
                              by {dataset.author}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
