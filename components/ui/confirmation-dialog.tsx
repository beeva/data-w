"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  confirmTone?: "default" | "danger";
  hideCancel?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmTone = "default",
  hideCancel = false,
}: ConfirmationDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          {!hideCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={
              confirmTone === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : undefined
            }
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
