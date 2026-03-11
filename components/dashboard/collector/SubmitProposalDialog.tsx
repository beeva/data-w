"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createProposal } from "@/lib/services/proposalService";
import type { Project, CreateProposalInput } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  Send,
  Info,
  Image,
  Video,
  Music,
  FileText,
  Table,
  MapPin,
  Activity,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = ["#d13447", "#ffbf00", "#263672"];

type ConfettiPiece = {
  leftStart: number;
  leftEnd: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
};

function ConfettiLayer() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const count = 301;
    const next: ConfettiPiece[] = [];
    for (let i = 0; i < count; i++) {
      const size = 1 + Math.floor(Math.random() * 8);
      const left = 1 + Math.floor(Math.random() * 100);
      const leftEnd = left + Math.floor(Math.random() * 15);
      next.push({
        leftStart: left,
        leftEnd,
        delay: Math.random(),
        duration: 4 + Math.random(),
        size,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        opacity: 0.5 + Math.random(),
        rotation: Math.random() * 360,
      });
    }
    setPieces(next);
  }, []);

  if (!pieces.length) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((piece, index) => (
          <div
            key={index}
            className="confetti-piece-proposal"
            style={{
              width: `${piece.size}px`,
              height: `${piece.size * 0.4}px`,
              backgroundColor: piece.color,
              opacity: Math.min(piece.opacity, 1),
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotation}deg)`,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              "--left-start": `${piece.leftStart}%`,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              "--left-end": `${piece.leftEnd}%`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .confetti-piece-proposal {
          position: absolute;
          top: -10%;
          left: var(--left-start);
          border-radius: 9999px;
          animation-name: confetti-fall-proposal;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes confetti-fall-proposal {
          0% {
            top: -10%;
            left: var(--left-start);
          }
          100% {
            top: 110%;
            left: var(--left-end);
          }
        }
      `}</style>
    </>
  );
}

interface SubmitProposalDialogProps {
  project: Project;
  onSuccess?: () => void;
  triggerClassName?: string;
}

const STEP_ORDER = [
  "location",
  "dataTypes",
  "equipment",
  "experience",
  "availability",
  "budget",
  "notes",
] as const;

type StepId = (typeof STEP_ORDER)[number];

const TOTAL_STEPS = STEP_ORDER.length;

const DATA_TYPES = [
  "Images",
  "Videos",
  "Audio Files",
  "Text Documents",
  "Spreadsheets",
  "GPS Coordinates",
  "Sensor Readings",
  "Other",
];

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

const EQUIPMENT_OPTIONS = [
  "Camera",
  "Video Camera",
  "Microphone",
  "GPS Device",
  "Smartphone",
  "Tablet",
  "Drone",
  "Sensor Equipment",
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Chinese", label: "中文" },
  { value: "Japanese", label: "日本語" },
  { value: "Arabic", label: "العربية" },
  { value: "Portuguese", label: "Português" },
];

const AVAILABILITY_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "weekends", label: "Weekends only" },
  { value: "flexible", label: "Flexible" },
];

const BUDGET_PRESETS = [100, 250, 500, 1000, 2500];

export default function SubmitProposalDialog({
  project,
  onSuccess,
  triggerClassName = "",
}: SubmitProposalDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"form" | "processing" | "completed">(
    "form",
  );
  const [error, setError] = useState("");
  const [showCongratsOverlay, setShowCongratsOverlay] = useState(false);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    country: "",
    lat: null as number | null,
    lng: null as number | null,
    data_types: [] as string[],
    equipment: [] as string[],
    experience_years: "",
    languages: [] as string[],
    availability: "",
    notes: "",
    proposed_budget: "",
    message: "",
  });

  const currentStepId: StepId = STEP_ORDER[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const progressPercent = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  function toggleItem(
    field: "data_types" | "equipment" | "languages",
    value: string,
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  }

  function canProceed(): boolean {
    if (phase !== "form") return false;
    switch (currentStepId) {
      case "location":
        return !!(formData.address && formData.city && formData.country);
      case "dataTypes":
        return formData.data_types.length > 0;
      default:
        return true;
    }
  }

  function handleNext() {
    if (!canProceed()) return;
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    setError("");
    if (!user) {
      setError("You must be logged in to submit a proposal");
      return;
    }
    setPhase("processing");
    try {
      const proposalData: CreateProposalInput = {
        request_id: project.id,
        location: {
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          city: formData.city,
          country: formData.country,
        },
        capabilities: {
          data_types: formData.data_types,
          equipment:
            formData.equipment.length > 0 ? formData.equipment : undefined,
          experience_years: formData.experience_years
            ? parseInt(formData.experience_years)
            : undefined,
          languages:
            formData.languages.length > 0 ? formData.languages : undefined,
          availability: formData.availability || undefined,
          notes: formData.notes || undefined,
        },
        proposed_budget: formData.proposed_budget
          ? parseFloat(formData.proposed_budget)
          : null,
        message: formData.message || null,
      };

      const { error: createError } = await createProposal(
        user.id,
        proposalData,
      );
      if (createError) throw createError;

      setPhase("completed");
      setShowCongratsOverlay(true);
    } catch (err: unknown) {
      setPhase("form");
      setError(
        err instanceof Error ? err.message : "Failed to submit proposal",
      );
    }
  }

  function resetForm() {
    setStepIndex(0);
    setPhase("form");
    setError("");
    setShowCongratsOverlay(false);
    setFormData({
      address: "",
      city: "",
      country: "",
      lat: null,
      lng: null,
      data_types: [],
      equipment: [],
      experience_years: "",
      languages: [],
      availability: "",
      notes: "",
      proposed_budget: "",
      message: "",
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleCongratsClose() {
    setShowCongratsOverlay(false);
    setOpen(false);
    resetForm();
    onSuccess?.();
  }

  // Lottie processing animation
  useEffect(() => {
    if (phase !== "processing") return;
    if (typeof window === "undefined") return;
    const canvas = processingCanvasRef.current;
    if (!canvas) return;

    let animation: any;
    import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        animation = new DotLottie({
          canvas,
          src: "/lottie/creating.lottie",
          autoplay: true,
          loop: true,
        });
      })
      .catch((err) => console.error("Processing lottie failed", err));

    return () => {
      if (animation) animation.destroy();
    };
  }, [phase]);

  // Lottie completion animation: congratulation once → confirm once
  useEffect(() => {
    if (phase !== "completed") return;
    if (typeof window === "undefined") return;
    const canvas = completedCanvasRef.current;
    if (!canvas) return;

    let animation: any;
    let cancelled = false;

    import("@lottiefiles/dotlottie-web")
      .then(({ DotLottie }) => {
        if (cancelled) return;

        const playConfirm = () => {
          if (cancelled) return;
          if (animation) {
            animation.destroy();
            animation = null;
          }
          animation = new DotLottie({
            canvas,
            src: "/lottie/confirm.lottie",
            autoplay: true,
            loop: false,
          });
        };

        animation = new DotLottie({
          canvas,
          src: "/lottie/congratulation.lottie",
          autoplay: true,
          loop: false,
        });
        animation.addEventListener?.("complete", playConfirm);
      })
      .catch((err) => console.error("Completion lottie failed", err));

    return () => {
      cancelled = true;
      if (animation) animation.destroy();
    };
  }, [phase]);

  const congratsOverlay =
    typeof document === "undefined" || !showCongratsOverlay
      ? null
      : createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
            <div className="relative w-full h-full max-h-screen flex items-center justify-center overflow-hidden">
              <ConfettiLayer />
              <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
                <div className="w-56 h-56 sm:w-72 sm:h-72 bg-transparent">
                  <canvas
                    ref={completedCanvasRef}
                    className="w-full h-full"
                    aria-label="Congratulations animation"
                  />
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  Proposal Submitted! 🎉
                </p>
                <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto">
                  Your proposal for{" "}
                  <span className="font-semibold text-white">
                    {project.title}
                  </span>{" "}
                  has been submitted successfully.
                </p>
                <Button
                  type="button"
                  onClick={handleCongratsClose}
                  className="btn-gelatine mt-2 rounded-full bg-white text-[#0a0a0a] hover:bg-[#f0f0f0] px-6 py-2.5 text-sm font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        );

  return (
    <>
      {congratsOverlay}
      {!showCongratsOverlay && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl ${triggerClassName}`}
            >
              Submit Proposal
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogTrigger>

          <DialogContent
            showCloseButton={false}
            className="sm:max-w-4xl h-[80vh] overflow-hidden rounded-2xl border-0 bg-transparent shadow-none flex flex-col p-0 gap-0"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            {/* Top info bar */}
            <div className="mx-6">
              <div className="flex items-center gap-3 w-full py-2 px-3 bg-white dark:bg-[#1a1a1a] text-black dark:text-white rounded-xl">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <Info className="h-3.5 w-3.5 text-foreground dark:text-white" />
                </div>
                <span className="flex-1 text-center text-xs truncate">
                  Submitting a proposal for{" "}
                  <span className="font-semibold">{project.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="btn-gelatine shrink-0 rounded-full px-4 py-1.5 text-xs font-medium bg-[#2a2a2a] text-white hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Header */}
            <DialogHeader className="shrink-0 flex-row items-center justify-between space-y-0 py-4 px-6 mt-4 bg-white dark:bg-[#0a0a0a] rounded-t-xl">
              <DialogTitle className="text-base font-semibold text-black dark:text-white">
                Submit Proposal
              </DialogTitle>
              {phase === "form" && (
                <span className="text-xs text-black dark:text-white/50">
                  Step {stepIndex + 1} of {TOTAL_STEPS}
                </span>
              )}
            </DialogHeader>

            {/* Main content */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#0a0a0a] px-6 py-8">
              {phase === "form" && (
                <div className="flex flex-col justify-center min-h-full">
                  {error && (
                    <div className="mb-6 p-3 bg-red-900/20 dark:bg-red-900/20 border border-red-800 dark:border-red-800 rounded-xl text-red-400 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Step 1 — Location */}
                  {currentStepId === "location" && (
                    <div className="space-y-8 pl-4 mb-24">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Where are you located?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Search and select your location so requesters know
                          where you can collect data.
                        </p>
                      </div>
                      <div className="space-y-3 max-w-md">
                        <AddressAutocomplete
                          value={formData.address}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, address: value }))
                          }
                          onSelect={(result) =>
                            setFormData((prev) => ({
                              ...prev,
                              address: result.address,
                              city: result.city,
                              country: result.country,
                              lat: result.lat ?? null,
                              lng: result.lng ?? null,
                            }))
                          }
                          placeholder="Search for your location..."
                          className="h-12 text-sm rounded-full border border-[#0a0a0a] dark:border-gray-700 shadow-none bg-white dark:bg-[#0a0a0a]  ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Data Types */}
                  {currentStepId === "dataTypes" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What types of data can you collect?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Select all data types you are able to collect for this
                          project.
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
                              setFormData((prev) => ({
                                ...prev,
                                data_types: [],
                              }))
                            }
                            className="text-xs font-medium text-black dark:text-white/70 hover:text-white underline underline-offset-2"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {DATA_TYPES.map((type) => {
                          const selected = formData.data_types.includes(type);
                          const IconComponent =
                            DATA_TYPE_ICONS[type] ?? MoreHorizontal;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleItem("data_types", type)}
                              className={cn(
                                "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                                selected
                                  ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                                  : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                              )}
                            >
                              <span className="flex shrink-0 w-8 h-8 flex items-center justify-center rounded overflow-hidden">
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

                  {/* Step 3 — Equipment */}
                  {currentStepId === "equipment" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What equipment do you have available?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Select any equipment you can use for data
                          collection.
                        </p>
                      </div>
                      {formData.equipment.length > 0 && (
                        <div className="flex items-center gap-2 -mt-4">
                          <span className="text-xs font-medium text-black dark:text-white/70">
                            {formData.equipment.length} selected
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                equipment: [],
                              }))
                            }
                            className="text-xs font-medium text-black dark:text-white/70 hover:text-white underline underline-offset-2"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {EQUIPMENT_OPTIONS.map((item) => {
                          const selected = formData.equipment.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleItem("equipment", item)}
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
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Experience & Languages */}
                  {currentStepId === "experience" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Tell us about your experience.
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Share your years of experience and the
                          languages you speak.
                        </p>
                      </div>
                      <div className="space-y-3 max-w-xs">
                        <Label className="text-black dark:text-white/80 text-sm">
                          Years of Experience
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.experience_years}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              experience_years: e.target.value,
                            }))
                          }
                          placeholder="e.g., 3"
                          className="rounded-full h-12 px-6 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-black dark:text-white/80 text-sm">
                          Languages
                        </Label>
                        <p className="text-xs text-black dark:text-white/50">
                          Select all languages you speak.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {LANGUAGE_OPTIONS.map((opt) => {
                            const selected = formData.languages.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleItem("languages", opt.value)}
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
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5 — Availability */}
                  {currentStepId === "availability" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What is your availability?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Let the requester know when you&apos;re
                          available to work.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {AVAILABILITY_OPTIONS.map((opt) => {
                          const selected = formData.availability === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  availability: opt.value,
                                }));
                                setStepIndex((i) =>
                                  Math.min(i + 1, TOTAL_STEPS - 1),
                                );
                              }}
                              className={cn(
                                "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                                selected
                                  ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                                  : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 6 — Budget */}
                  {currentStepId === "budget" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What is your proposed budget?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Leave empty to accept the project&apos;s
                          budget.
                        </p>
                      </div>
                      <div className="space-y-6">
                        <div className="relative max-w-[360px]">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white/50 pointer-events-none" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Custom amount"
                            value={formData.proposed_budget}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                proposed_budget: e.target.value,
                              }))
                            }
                            className="rounded-full h-12 w-full pl-10 pr-16 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-black dark:text-white/50 pointer-events-none">
                            USD
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {BUDGET_PRESETS.map((val) => {
                            const selected =
                              formData.proposed_budget === String(val);
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    proposed_budget: String(val),
                                  }))
                                }
                                className={cn(
                                  "btn-gelatine flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all border",
                                  selected
                                    ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white"
                                    : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-[#2a2a2a] dark:hover:border-[#2a2a2a]",
                                )}
                              >
                                ${val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 7 — Notes & Message */}
                  {currentStepId === "notes" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Anything else to add?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Add notes about your capabilities or a
                          personal message to the requester.
                        </p>
                      </div>
                      <div className="space-y-5 max-w-lg">
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Additional Notes
                          </Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Any additional information about your capabilities..."
                            rows={3}
                            className="rounded-xl bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Message to Requester
                          </Label>
                          <Textarea
                            value={formData.message}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                message: e.target.value,
                              }))
                            }
                            placeholder="Add a personal message..."
                            rows={4}
                            className="rounded-xl bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Processing phase */}
              {phase === "processing" && (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 bg-transparent">
                    <canvas
                      ref={processingCanvasRef}
                      className="w-full h-full"
                      aria-label="Processing animation"
                    />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                    Submitting your proposal...
                  </p>
                </div>
              )}

              {/* Completed phase — shown briefly before portal overlay takes over */}
              {phase === "completed" && (
                <div className="relative flex flex-col items-center justify-center h-full gap-6 text-center">
                  <ConfettiLayer />
                  <div className="w-56 h-56 sm:w-72 sm:h-72 bg-transparent relative z-10">
                    <canvas
                      ref={completedCanvasRef}
                      className="w-full h-full"
                      aria-label="Congratulations animation"
                    />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                      Proposal Submitted! 🎉
                    </p>
                    <p className="text-sm sm:text-base text-black dark:text-white/70 max-w-md mx-auto">
                      Your proposal for{" "}
                      <span className="font-semibold text-black dark:text-white">
                        {project.title}
                      </span>{" "}
                      has been submitted successfully.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer — progress bar + navigation */}
            <div className="shrink-0 flex flex-col gap-4 py-4 px-6 bg-white dark:bg-[#0a0a0a] rounded-b-xl">
              <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-[#2a2a2a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-black dark:bg-white transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {phase === "form" && (
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
                      className="btn-gelatine rounded-full bg-[#0a0a0a] dark:bg-white hover:bg-[#0a0a0a] dark:hover:bg-white text-white dark:text-black disabled:bg-white dark:disabled:bg-[#0a0a0a] disabled:text-black dark:disabled:text-white disabled:pointer-events-none !px-6 h-11 text-sm font-medium"
                    >
                      <ChevronLeft className="h-4 w-4 inline-block" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="btn-gelatine rounded-full bg-[#0a0a0a] dark:bg-white hover:bg-[#0a0a0a] dark:hover:bg-white text-white dark:text-black disabled:bg-white dark:disabled:bg-[#0a0a0a] disabled:text-black disabled:dark:text-white disabled:pointer-events-none !px-6 h-11 text-sm font-medium"
                  >
                    {isLastStep ? (
                      "Submit Proposal"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1 inline-block" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
