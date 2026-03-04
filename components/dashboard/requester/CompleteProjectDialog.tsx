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

interface CompleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}

export default function CompleteProjectDialog({
  open,
  onOpenChange,
  projectTitle,
  onSubmit,
}: CompleteProjectDialogProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setRating(0);
      setFeedback("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }
    if (!feedback.trim()) {
      setError("Please provide feedback.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSubmit(rating, feedback.trim());
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
            Rate this project and share feedback before marking{" "}
            <span className="font-medium">{projectTitle}</span> as completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Star rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  className="rounded p-1 hover:bg-muted"
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      star <= rating
                        ? "fill-yellow-400 text-yellow-500"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-feedback">Feedback</Label>
            <Textarea
              id="completion-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback about this project..."
              rows={4}
              disabled={submitting}
            />
          </div>

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
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
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
