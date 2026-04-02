"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createDataPoolDataset,
  updateDataPoolDataset,
} from "@/lib/services/dataPoolService";
import type { DataItem } from "@/components/DataItemCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  DollarSign,
  Image,
  Video,
  Music,
  FileText,
  Table,
  MapPin,
  Activity,
  MoreHorizontal,
  Info,
  TriangleAlert,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  JOB_CATEGORIES,
  PROJECT_DATA_TYPES,
  PROJECT_FORMATS,
} from "@/lib/categories";

export interface CreateDataSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  dataset?: DataItem | null;
}

const STEP_ORDER = [
  "title",
  "description",
  "category",
  "price",
  "dataTypes",
  "formats",
] as const;

type StepId = (typeof STEP_ORDER)[number];

const TOTAL_STEPS = STEP_ORDER.length;

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

export type DataSetFormState = {
  title: string;
  description: string;
  category: string;
  price: string;
  data_types: string[];
  formats: string[];
};

const initialForm: DataSetFormState = {
  title: "",
  description: "",
  category: "",
  price: "",
  data_types: [],
  formats: [],
};

function formFromDataset(d: DataItem): DataSetFormState {
  return {
    title: d.title ?? "",
    description: d.description ?? "",
    category: d.category ?? "",
    price:
      typeof d.price === "number" && Number.isFinite(d.price)
        ? String(d.price)
        : "",
    data_types: [...(d.data_types ?? [])],
    formats: [...(d.formats ?? [])],
  };
}

export default function CreateDataSetDialog({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  dataset,
}: CreateDataSetDialogProps) {
  const { user, profile } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<DataSetFormState>(initialForm);

  const isEditMode = mode === "edit";
  const currentStepId: StepId = STEP_ORDER[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const progressPercent = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  function resetForm() {
    setStepIndex(0);
    setError("");
    setSaving(false);
    setFormData(
      isEditMode && dataset ? formFromDataset(dataset) : initialForm,
    );
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) resetForm();
  }

  useEffect(() => {
    if (!open) return;
    if (isEditMode && dataset) {
      setFormData(formFromDataset(dataset));
    } else {
      setFormData(initialForm);
    }
    setStepIndex(0);
    setError("");
    setSaving(false);
  }, [open, isEditMode, dataset]);

  function toggleArrayField(
    field: "data_types" | "formats",
    value: string,
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));
  }

  function canProceed(): boolean {
    switch (currentStepId) {
      case "title":
        return !!formData.title.trim();
      case "description":
        return !!formData.description.trim();
      case "category":
        return !!formData.category;
      case "price": {
        const n = parseFloat(formData.price);
        return !!formData.price && Number.isFinite(n) && n > 0;
      }
      case "dataTypes":
        return formData.data_types.length > 0;
      case "formats":
        return formData.formats.length > 0;
      default:
        return true;
    }
  }

  function handleNext() {
    if (!canProceed()) return;
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleStepKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    if (saving) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName?.toLowerCase();
    if (tag === "textarea" && currentStepId !== "description") return;
    if (tag === "button") return;
    if (target.getAttribute("role") === "combobox") return;

    e.preventDefault();
    handleNext();
  }

  async function handleSubmit() {
    setError("");
    if (!user || !profile) {
      setError(
        isEditMode
          ? "You must be logged in to edit this listing"
          : "You must be logged in to list a dataset",
      );
      return;
    }
    if (profile.role !== "personal" && profile.role !== "company") {
      setError("Only personal and company accounts can list datasets.");
      return;
    }
    if (!canProceed()) return;

    setSaving(true);
    try {
      const input = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        data_types: formData.data_types,
        formats: formData.formats,
      };

      if (isEditMode) {
        if (!dataset?.id || dataset.item_kind !== "dataset") {
          throw new Error("Invalid dataset to edit");
        }
        const { error: upErr } = await updateDataPoolDataset(
          dataset.id,
          input,
        );
        if (upErr) throw upErr;
      } else {
        const { error: crErr } = await createDataPoolDataset(user.id, input);
        if (crErr) throw crErr;
      }

      onSuccess?.();
      handleOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update listing"
            : "Failed to create listing",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-4xl h-[80vh] overflow-hidden rounded-2xl border-0 bg-transparent shadow-none flex flex-col p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onKeyDown={handleStepKeyDown}
      >
        <div className="mx-6">
          <div className="flex items-center gap-3 w-full py-2 px-3 bg-white dark:bg-[#1a1a1a] text-black dark:text-white rounded-xl">
            <div className="flex items-center justify-center w-6 h-6 shrink-0">
              <Info className="h-3.5 w-3.5 text-foreground dark:text-white" />
            </div>
            <span className="flex-1 text-center text-xs truncate">
              {isEditMode
                ? `Editing dataset: ${dataset?.title ?? ""}`
                : "List a dataset on the Data Pool marketplace"}
            </span>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
              className="btn-gelatine shrink-0 rounded-full px-4 py-1.5 text-xs font-medium bg-[#2a2a2a] text-white hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <DialogHeader className="shrink-0 flex-row items-center justify-between space-y-0 py-4 px-6 mt-4 bg-white dark:bg-[#0a0a0a] rounded-t-xl">
          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold text-black dark:text-white">
              {isEditMode ? "Edit Dataset" : "List a Dataset"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditMode
                ? "Update your marketplace listing."
                : "Create a marketplace listing with category, types, formats, and price."}
            </DialogDescription>
          </div>
          <span className="text-xs text-black dark:text-white/50">
            Step {stepIndex + 1} of {TOTAL_STEPS}
          </span>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#0a0a0a] px-6 py-8">
          <div className="h-full min-h-0 overflow-y-auto lg:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
            <div className="flex flex-col justify-center min-h-full">
              {error && (
                <div className="mb-6 p-3 bg-red-500/10 dark:bg-red-900/20 border border-red-500 dark:border-red-800 rounded-xl text-red-500 dark:text-red-400 text-sm">
                  <TriangleAlert
                    className="h-4 w-4 inline-block mr-2"
                    strokeWidth={3}
                  />
                  {error}
                </div>
              )}

              {currentStepId === "title" && (
                <div className="space-y-8 pl-4 mb-32">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Name your dataset
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Choose a clear title buyers will see on the Data Pool.
                    </p>
                  </div>
                  <div className="space-y-2 max-w-lg">
                    <Label className="text-black dark:text-white/80 text-sm">
                      Title *
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="e.g., Urban traffic camera samples"
                      className="rounded-full h-12 px-6 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                    />
                  </div>
                </div>
              )}

              {currentStepId === "description" && (
                <div className="space-y-8 pl-4 mb-24">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Describe the dataset
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Explain what the data contains and how it can be used.
                    </p>
                  </div>
                  <div className="space-y-2 max-w-lg">
                    <Label className="text-black dark:text-white/80 text-sm">
                      Description *
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe your dataset..."
                      rows={6}
                      className="rounded-xl bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                    />
                  </div>
                </div>
              )}

              {currentStepId === "category" && (
                <div className="space-y-8 pl-4">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Category
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Pick the category that best matches your listing.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {JOB_CATEGORIES.map((cat) => {
                      const selected = formData.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setFormData((p) => ({ ...p, category: "" }));
                            } else {
                              setFormData((p) => ({ ...p, category: cat }));
                              setStepIndex((i) =>
                                Math.min(i + 1, TOTAL_STEPS - 1),
                              );
                            }
                          }}
                          className={cn(
                            "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                            selected
                              ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                              : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                          )}
                        >
                          {selected && (
                            <Check
                              className="h-3.5 w-3.5 shrink-0"
                              strokeWidth={3}
                            />
                          )}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStepId === "price" && (
                <div className="space-y-8 pl-4 mb-24">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Price
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Set your listing price in USD (same currency as the rest
                      of the marketplace).
                    </p>
                  </div>
                  <div className="space-y-2 max-w-md">
                    <Label className="text-black dark:text-white/80 text-sm">
                      Price (USD) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white/50 pointer-events-none" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, price: e.target.value }))
                        }
                        className="rounded-full h-12 w-full pl-10 pr-4 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === "dataTypes" && (
                <div className="space-y-8 pl-4">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Data types
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Select all types that apply (same options as project
                      requirements).
                    </p>
                  </div>
                  {formData.data_types.length > 0 && (
                    <div className="flex items-center gap-2 -mt-4">
                      <span className="text-xs font-medium text-black dark:text-white/70">
                        {formData.data_types.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, data_types: [] }))
                        }
                        className="text-xs font-medium text-black dark:text-white/70 hover:text-white underline underline-offset-2"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {PROJECT_DATA_TYPES.map((type) => {
                      const selected = formData.data_types.includes(type);
                      const IconComponent =
                        DATA_TYPE_ICONS[type] ?? MoreHorizontal;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleArrayField("data_types", type)}
                          className={cn(
                            "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                            selected
                              ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                              : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                          )}
                        >
                          <span className="flex shrink-0 w-8 h-8 items-center justify-center rounded overflow-hidden">
                            <IconComponent
                              className={cn(
                                "w-6 h-6 object-contain",
                                selected
                                  ? "dark:text-[#0a0a0a] text-white"
                                  : "text-[#0a0a0a] dark:text-white",
                              )}
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          </span>
                          <span className="flex-1 min-w-0 truncate">
                            {type}
                          </span>
                          <span
                            className={cn(
                              "flex shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ml-4",
                              selected
                                ? "bg-white dark:bg-[#0a0a0a] border-white dark:border-[#0a0a0a] text-[#0a0a0a] dark:text-white"
                                : "dark:border-white/50 border-[#0a0a0a] bg-transparent",
                            )}
                          >
                            {selected && (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStepId === "formats" && (
                <div className="space-y-8 pl-4">
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-black dark:text-white">
                      Formats
                    </p>
                    <p className="text-sm text-black dark:text-white/60">
                      Select the file formats included in this dataset.
                    </p>
                  </div>
                  {formData.formats.length > 0 && (
                    <div className="flex items-center gap-2 -mt-4">
                      <span className="text-xs font-medium text-black dark:text-white/70">
                        {formData.formats.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, formats: [] }))
                        }
                        className="text-xs font-medium text-black dark:text-white/70 hover:text-white underline underline-offset-2"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {PROJECT_FORMATS.map((format) => {
                      const selected = formData.formats.includes(format);
                      return (
                        <button
                          key={format}
                          type="button"
                          onClick={() => toggleArrayField("formats", format)}
                          className={cn(
                            "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                            selected
                              ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                              : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                          )}
                        >
                          {selected && (
                            <Check
                              className="h-3.5 w-3.5 shrink-0"
                              strokeWidth={3}
                            />
                          )}
                          {format}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-4 py-4 px-6 bg-white dark:bg-[#0a0a0a] rounded-b-xl">
          <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-[#2a2a2a] overflow-hidden">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className={cn(
              "flex items-center w-full gap-2",
              isFirstStep ? "justify-end" : "justify-between",
            )}
          >
            {!isFirstStep && (
              <Button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="btn-gelatine rounded-full bg-[#0a0a0a] dark:bg-white hover:bg-[#0a0a0a] dark:hover:bg-white text-white dark:text-black disabled:opacity-50 !px-6 h-11 text-sm font-medium"
              >
                <ChevronLeft className="h-4 w-4 inline-block" />
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || saving}
              className="btn-gelatine rounded-full bg-[#0a0a0a] dark:bg-white hover:bg-[#0a0a0a] dark:hover:bg-white text-white dark:text-black disabled:bg-white dark:disabled:bg-[#0a0a0a] disabled:text-black disabled:dark:text-white disabled:pointer-events-none !px-6 h-11 text-sm font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Saving…
                </>
              ) : isLastStep ? (
                isEditMode ? (
                  "Save Changes"
                ) : (
                  "Publish Listing"
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1 inline-block" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
