"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CollectorFeedbackTarget {
  collectorId: string;
  collectorName: string;
}

export interface CollectorCompletionFeedback {
  collectorId: string;
  rating: number;
  feedback: string;
}

interface CompleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  collectors: CollectorFeedbackTarget[];
  onSubmit: (feedbacks: CollectorCompletionFeedback[]) => Promise<void>;
}

export default function CompleteProjectDialog({
  open,
  onOpenChange,
  projectTitle,
  collectors,
  onSubmit,
}: CompleteProjectDialogProps) {
  const [feedbackByCollector, setFeedbackByCollector] = useState<
    Record<string, { rating: number; feedback: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFeedbackByCollector({});
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setFeedbackByCollector((prev) => {
      const next = { ...prev };
      collectors.forEach((collector) => {
        if (!next[collector.collectorId]) {
          next[collector.collectorId] = { rating: 0, feedback: "" };
        }
      });
      Object.keys(next).forEach((collectorId) => {
        if (!collectors.some((collector) => collector.collectorId === collectorId)) {
          delete next[collectorId];
        }
      });
      return next;
    });
  }, [collectors, open]);

  const updateCollectorFeedback = (
    collectorId: string,
    updates: Partial<{ rating: number; feedback: string }>,
  ) => {
    setFeedbackByCollector((prev) => ({
      ...prev,
      [collectorId]: {
        rating: prev[collectorId]?.rating ?? 0,
        feedback: prev[collectorId]?.feedback ?? "",
        ...updates,
      },
    }));
  };

  const handleSubmit = async () => {
    if (collectors.length === 0) {
      setError("No accepted collectors found for this project.");
      return;
    }

    const payload: CollectorCompletionFeedback[] = [];
    for (const collector of collectors) {
      const collectorInput = feedbackByCollector[collector.collectorId];
      const rating = collectorInput?.rating ?? 0;
      const feedback = collectorInput?.feedback?.trim() ?? "";
      if (rating < 1 || rating > 5) {
        setError(`Please select a star rating for ${collector.collectorName}.`);
        return;
      }
      if (!feedback) {
        setError(`Please provide feedback for ${collector.collectorName}.`);
        return;
      }
      payload.push({
        collectorId: collector.collectorId,
        rating,
        feedback,
      });
    }

    try {
      setSubmitting(true);
      setError("");
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to complete project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Project</DialogTitle>
          <DialogDescription>
            Rate each accepted collector and share feedback before marking{" "}
            <span className="font-medium">{projectTitle}</span> as completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No accepted collectors found for this project.
            </p>
          ) : (
            <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
              {collectors.map((collector) => {
                const current = feedbackByCollector[collector.collectorId] ?? {
                  rating: 0,
                  feedback: "",
                };
                return (
                  <div
                    key={collector.collectorId}
                    className="rounded-lg border border-border p-3 space-y-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {collector.collectorName}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Star rating</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            aria-label={`Rate ${collector.collectorName} ${star} star${star > 1 ? "s" : ""}`}
                            className="rounded p-1 hover:bg-muted"
                            onClick={() =>
                              updateCollectorFeedback(collector.collectorId, {
                                rating: star,
                              })
                            }
                          >
                            <Star
                              className={cn(
                                "w-5 h-5",
                                star <= current.rating
                                  ? "fill-yellow-400 text-yellow-500"
                                  : "text-muted-foreground",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`completion-feedback-${collector.collectorId}`}>
                        Feedback
                      </Label>
                      <Textarea
                        id={`completion-feedback-${collector.collectorId}`}
                        value={current.feedback}
                        onChange={(e) =>
                          updateCollectorFeedback(collector.collectorId, {
                            feedback: e.target.value,
                          })
                        }
                        placeholder={`Write your feedback about ${collector.collectorName}...`}
                        rows={3}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || collectors.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
