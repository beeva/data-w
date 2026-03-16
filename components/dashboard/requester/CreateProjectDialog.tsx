"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, updateProject } from "@/lib/services/projectService";
import { deductProjectBudget } from "@/lib/services/walletService";
import type { Project, ProjectFormData } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Calendar,
  Users,
  Image,
  Video,
  Music,
  FileText,
  Table,
  MapPin,
  Activity,
  MoreHorizontal,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import DataSuggestionsPanel from "./DataSuggestionsPanel";
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
            className="confetti-piece-project"
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
        .confetti-piece-project {
          position: absolute;
          top: -10%;
          left: var(--left-start);
          border-radius: 9999px;
          animation-name: confetti-fall-project;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes confetti-fall-project {
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

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  project?: Project;
}

const STEP_ORDER = [
  "title",
  "description",
  "category",
  "budget",
  "dataTypes",
  "formats",
  "specifications",
  "location",
] as const;

type StepId = (typeof STEP_ORDER)[number];

const TOTAL_STEPS = STEP_ORDER.length;

const CATEGORIES = [
  "Photography",
  "Video",
  "Audio",
  "Text",
  "Survey",
  "Location Data",
  "Sensor Data",
  "Other",
];

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

const FORMATS = ["JPEG", "PNG", "MP4", "PDF", "CSV", "JSON", "XML", "Other"];

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDeadlineDisplay(ymd: string): string {
  if (!ymd) return "";
  const [y, m, day] = ymd.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type CalendarDay = {
  ymd: string;
  label: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

function getCalendarDays(
  year: number,
  month: number,
  selectedYmd: string,
): CalendarDay[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const todayYmd = toYMD(new Date());
  const out: CalendarDay[] = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, 1 - (startPad - i));
    out.push({
      ymd: toYMD(d),
      label: d.getDate(),
      isCurrentMonth: false,
      isToday: toYMD(d) === todayYmd,
      isSelected: toYMD(d) === selectedYmd,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const ymd = toYMD(d);
    out.push({
      ymd,
      label: i,
      isCurrentMonth: true,
      isToday: ymd === todayYmd,
      isSelected: ymd === selectedYmd,
    });
  }
  const remaining = 42 - out.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    out.push({
      ymd: toYMD(d),
      label: d.getDate(),
      isCurrentMonth: false,
      isToday: toYMD(d) === todayYmd,
      isSelected: toYMD(d) === selectedYmd,
    });
  }
  return out;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CALENDAR_YEAR_MIN = new Date().getFullYear();
const CALENDAR_YEAR_MAX = new Date().getFullYear() + 10;

const initialFormData: ProjectFormData = {
  title: "",
  description: "",
  category: "",
  budget: "",
  deadline: "",
  max_collectors: "1",
  data_types: [],
  formats: [],
  specifications: "",
  location_address: "",
  location_lat: "",
  location_lng: "",
  radius_km: "5",
};

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  project,
}: CreateProjectDialogProps) {
  const { user, profile } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"form" | "processing" | "completed">(
    "form",
  );
  const [error, setError] = useState("");
  const [showCongratsOverlay, setShowCongratsOverlay] = useState(false);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [deadlineCalendarOpen, setDeadlineCalendarOpen] = useState(false);
  const [deadlineCalendarView, setDeadlineCalendarView] = useState<{
    year: number;
    month: number;
  }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [deadlineCalendarPosition, setDeadlineCalendarPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const deadlineTriggerRef = useRef<HTMLDivElement>(null);
  const deadlineCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deadlineCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = deadlineTriggerRef.current?.contains(target);
      const inCalendar = deadlineCalendarRef.current?.contains(target);
      if (!inTrigger && !inCalendar) {
        setDeadlineCalendarOpen(false);
        setDeadlineCalendarPosition(null);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, [deadlineCalendarOpen]);

  const currentStepId: StepId = STEP_ORDER[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const progressPercent = ((stepIndex + 1) / TOTAL_STEPS) * 100;
  const isEditMode = mode === "edit";

  function getInitialFormDataForProject(editProject: Project): ProjectFormData {
    return {
      title: editProject.title || "",
      description: editProject.description || "",
      category: editProject.category || "",
      budget: editProject.budget?.toString() || "",
      deadline: editProject.deadline
        ? new Date(editProject.deadline).toISOString().split("T")[0]
        : "",
      max_collectors: editProject.max_collectors?.toString() || "1",
      data_types: editProject.requirements?.data_types || [],
      formats: editProject.requirements?.formats || [],
      specifications: editProject.requirements?.specifications || "",
      location_address: editProject.location?.address || "",
      location_lat: editProject.location?.lat?.toString() || "",
      location_lng: editProject.location?.lng?.toString() || "",
      radius_km: editProject.location?.radius_km?.toString() || "5",
    };
  }

  function toggleItem(field: "data_types" | "formats", value: string) {
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
      case "title":
        return !!formData.title.trim();
      case "description":
        return !!formData.description.trim();
      case "category":
        return !!formData.category;
      case "budget":
        return !!(
          formData.budget &&
          parseFloat(formData.budget) > 0 &&
          formData.deadline &&
          formData.max_collectors &&
          parseInt(formData.max_collectors) >= 1
        );
      case "dataTypes":
        return formData.data_types.length > 0;
      case "formats":
        return formData.formats.length > 0;
      case "specifications":
        return true;
      case "location":
        return !!formData.location_address.trim();
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
    if (!user || !profile) {
      setError(
        isEditMode
          ? "You must be logged in to edit this project"
          : "You must be logged in to create a project",
      );
      return;
    }
    if (profile.role !== "requester" && profile.role !== "admin") {
      setError(
        isEditMode
          ? "Only requesters can edit projects"
          : "Only requesters can create projects",
      );
      return;
    }
    if (!formData.location_address) {
      setError("Location is required");
      return;
    }

    setPhase("processing");
    try {
      const budgetAmount = parseFloat(formData.budget);

      const requirements = {
        data_types: formData.data_types,
        formats: formData.formats,
        specifications: formData.specifications || undefined,
      };

      const location = formData.location_address
        ? {
            address: formData.location_address,
            lat: formData.location_lat
              ? parseFloat(formData.location_lat)
              : null,
            lng: formData.location_lng
              ? parseFloat(formData.location_lng)
              : null,
            radius_km: formData.radius_km
              ? parseFloat(formData.radius_km)
              : null,
          }
        : null;

      if (isEditMode) {
        if (!project) {
          throw new Error("Project not found");
        }
        const { error: editError } = await updateProject(project.id, user.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget: budgetAmount,
          deadline: formData.deadline || null,
          max_collectors: parseInt(formData.max_collectors),
          location,
          requirements,
        });
        if (editError) throw editError;
      } else {
        const { error: budgetError } = await deductProjectBudget(
          user.id,
          budgetAmount,
        );
        if (budgetError) {
          throw budgetError;
        }

        const { error: createError } = await createProject(user.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget: budgetAmount,
          deadline: formData.deadline || null,
          max_collectors: parseInt(formData.max_collectors),
          location,
          requirements,
        });

        if (createError) throw createError;
      }

      setPhase("completed");
      setShowCongratsOverlay(true);
    } catch (err: unknown) {
      setPhase("form");
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update project"
            : "Failed to create project",
      );
    }
  }

  function resetForm() {
    setStepIndex(0);
    setPhase("form");
    setError("");
    setShowCongratsOverlay(false);
    setFormData(
      isEditMode && project ? getInitialFormDataForProject(project) : initialFormData,
    );
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) resetForm();
  }

  function handleCongratsClose() {
    setShowCongratsOverlay(false);
    onOpenChange(false);
    resetForm();
    onSuccess?.();
  }

  useEffect(() => {
    if (!open) return;
    if (isEditMode && project) {
      setFormData(getInitialFormDataForProject(project));
    } else if (!isEditMode) {
      setFormData(initialFormData);
    }
    setStepIndex(0);
    setPhase("form");
    setError("");
    setShowCongratsOverlay(false);
  }, [open, isEditMode, project]);

  useEffect(() => {
    if (phase !== "processing") return;
    if (typeof window === "undefined") return;
    const canvas = processingCanvasRef.current;
    if (!canvas) return;

    let animation: { destroy: () => void } | undefined;
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

  useEffect(() => {
    if (phase !== "completed") return;
    if (typeof window === "undefined") return;
    const canvas = completedCanvasRef.current;
    if (!canvas) return;

    let animation: {
      destroy: () => void;
      addEventListener?: (type: "complete", fn: () => void) => void;
    } | null = null;
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
                  {isEditMode ? "Project Updated! 🎉" : "Project Created! 🎉"}
                </p>
                <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto">
                  Your project{" "}
                  <span className="font-semibold text-white">
                    {formData.title}
                  </span>{" "}
                  {isEditMode
                    ? "has been updated successfully."
                    : "has been created successfully."}
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
          <DialogContent
            showCloseButton={false}
            className="w-[96vw] sm:max-w-6xl h-[80vh] overflow-hidden rounded-2xl border-0 bg-transparent shadow-none flex flex-col p-0 gap-0"
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
                  {isEditMode
                    ? `Editing project: ${project?.title ?? ""}`
                    : "Creating a new data collection project"}
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
                {isEditMode ? "Edit Project" : "Create Project"}
              </DialogTitle>
              {phase === "form" && (
                <span className="text-xs text-black dark:text-white/50">
                  Step {stepIndex + 1} of {TOTAL_STEPS}
                </span>
              )}
            </DialogHeader>

            {/* Main content */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#0a0a0a] px-6 py-8">
              {phase === "form" && (
                <div
                  className="h-full min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6"
                >
                  <div className="h-full min-h-0 overflow-y-auto lg:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
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

                  {/* Step 1 — Title */}
                  {currentStepId === "title" && (
                    <div className="space-y-8 pl-4 mb-24">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What is your project about?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Give your project a title.
                        </p>
                      </div>
                      <div className="space-y-5 max-w-lg">
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Project Title *
                          </Label>
                          <Input
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="e.g., Collect Street Sign Images"
                            className="rounded-full h-12 px-6 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Description */}
                  {currentStepId === "description" && (
                    <div className="space-y-8 pl-4 mb-24">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Describe your project
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Describe what data you need and how it will be used.
                        </p>
                      </div>
                      <div className="space-y-5 max-w-lg">
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Description *
                          </Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe what data you need..."
                            rows={6}
                            className="rounded-xl bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Category (single select, chip UI) */}
                  {currentStepId === "category" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Category
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Select one category for your project.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {CATEGORIES.map((cat) => {
                          const selected = formData.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                if (selected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    category: "",
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    category: cat,
                                  }));
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

                  {/* Step 4 — Budget & Timeline */}
                  {currentStepId === "budget" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Budget and timeline
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Set your budget, deadline, and how many collectors you
                          need.
                        </p>
                      </div>
                      <div className="space-y-5 max-w-md">
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Budget (USD) *
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white/50 pointer-events-none" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={formData.budget}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  budget: e.target.value,
                                }))
                              }
                              className="rounded-full h-12 w-full pl-10 pr-4 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Deadline *
                          </Label>
                          <div
                            ref={deadlineTriggerRef}
                            className="relative flex items-center"
                          >
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white/50 pointer-events-none" />
                            <Input
                              type="date"
                              value={formData.deadline}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  deadline: e.target.value,
                                }))
                              }
                              className="rounded-full h-12 w-full pl-10 pr-12 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-10 [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-default"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!deadlineCalendarOpen) {
                                  const rect =
                                    deadlineTriggerRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    setDeadlineCalendarPosition({
                                      top: rect.bottom + 8,
                                      left: rect.left,
                                    });
                                  }
                                  if (formData.deadline) {
                                    const [y, m] = formData.deadline
                                      .split("-")
                                      .map(Number);
                                    setDeadlineCalendarView({
                                      year: y,
                                      month: m - 1,
                                    });
                                  } else {
                                    const d = new Date();
                                    setDeadlineCalendarView({
                                      year: d.getFullYear(),
                                      month: d.getMonth(),
                                    });
                                  }
                                  setDeadlineCalendarOpen(true);
                                } else {
                                  setDeadlineCalendarOpen(false);
                                  setDeadlineCalendarPosition(null);
                                }
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
                              aria-label="Open calendar"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            {deadlineCalendarOpen &&
                              deadlineCalendarPosition &&
                              typeof document !== "undefined" &&
                              createPortal(
                                <div
                                  ref={deadlineCalendarRef}
                                  style={{
                                    position: "fixed",
                                    top: deadlineCalendarPosition.top,
                                    left: deadlineCalendarPosition.left,
                                    zIndex: 99999,
                                    pointerEvents: "auto",
                                  }}
                                  className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#0a0a0a] shadow-lg p-4 animate-in fade-in-0 zoom-in-95 duration-200"
                                  role="dialog"
                                  aria-label="Choose deadline date"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Select
                                        value={String(
                                          deadlineCalendarView.month,
                                        )}
                                        onValueChange={(val) =>
                                          setDeadlineCalendarView((v) => ({
                                            ...v,
                                            month: Number(val),
                                          }))
                                        }
                                      >
                                        <SelectTrigger
                                          className="flex-1 min-w-0 text-sm font-medium text-black dark:text-white bg-transparent border border-[#e5e5e5] dark:border-[#333] rounded-lg h-8 px-2 py-1.5 focus:ring-2 focus:ring-[#263672] dark:focus:ring-[#5b7cce]"
                                          aria-label="Select month"
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100000] bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333]">
                                          {MONTH_NAMES.map((name, i) => (
                                            <SelectItem
                                              key={name}
                                              value={String(i)}
                                              className="text-sm cursor-pointer"
                                            >
                                              {name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={String(
                                          deadlineCalendarView.year,
                                        )}
                                        onValueChange={(val) =>
                                          setDeadlineCalendarView((v) => ({
                                            ...v,
                                            year: Number(val),
                                          }))
                                        }
                                      >
                                        <SelectTrigger
                                          className="w-[72px] shrink-0 text-sm font-medium text-black dark:text-white bg-transparent border border-[#e5e5e5] dark:border-[#333] rounded-lg h-8 px-2 py-1.5 focus:ring-2 focus:ring-[#263672] dark:focus:ring-[#5b7cce]"
                                          aria-label="Select year"
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100000] bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333]">
                                          {Array.from(
                                            {
                                              length:
                                                CALENDAR_YEAR_MAX -
                                                CALENDAR_YEAR_MIN +
                                                1,
                                            },
                                            (_, i) => CALENDAR_YEAR_MIN + i,
                                          ).map((y) => (
                                            <SelectItem
                                              key={y}
                                              value={String(y)}
                                              className="text-sm cursor-pointer"
                                            >
                                              {y}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeadlineCalendarView((v) => {
                                            const d = new Date(
                                              v.year,
                                              v.month - 1,
                                              1,
                                            );
                                            return {
                                              year: d.getFullYear(),
                                              month: d.getMonth(),
                                            };
                                          })
                                        }
                                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"
                                        aria-label="Previous month"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeadlineCalendarView((v) => {
                                            const d = new Date(
                                              v.year,
                                              v.month + 1,
                                              1,
                                            );
                                            return {
                                              year: d.getFullYear(),
                                              month: d.getMonth(),
                                            };
                                          })
                                        }
                                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"
                                        aria-label="Next month"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-7 gap-0.5 mb-3">
                                    {[
                                      "Su",
                                      "Mo",
                                      "Tu",
                                      "We",
                                      "Th",
                                      "Fr",
                                      "Sa",
                                    ].map((day) => (
                                      <div
                                        key={day}
                                        className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                                      >
                                        {day}
                                      </div>
                                    ))}
                                    {getCalendarDays(
                                      deadlineCalendarView.year,
                                      deadlineCalendarView.month,
                                      formData.deadline,
                                    ).map((cell) => (
                                      <button
                                        key={cell.ymd}
                                        type="button"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            deadline: cell.ymd,
                                          }));
                                          setDeadlineCalendarOpen(false);
                                          setDeadlineCalendarPosition(null);
                                        }}
                                        className={cn(
                                          "h-9 w-9 rounded-lg text-sm transition-colors",
                                          !cell.isCurrentMonth &&
                                            "text-gray-400 dark:text-gray-500",
                                          cell.isToday &&
                                            "bg-black/10 dark:bg-white/10 font-medium",
                                          cell.isSelected &&
                                            "bg-[#263672] dark:bg-[#3b4a7d] text-white font-medium hover:bg-[#1e2a4a] dark:hover:bg-[#4a5d8f]",
                                          !cell.isSelected &&
                                            cell.isCurrentMonth &&
                                            "hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white",
                                        )}
                                      >
                                        {cell.label}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5] dark:border-[#333]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          deadline: "",
                                        }));
                                        setDeadlineCalendarOpen(false);
                                        setDeadlineCalendarPosition(null);
                                      }}
                                      className="text-sm font-medium text-[#263672] dark:text-[#5b7cce] hover:underline"
                                    >
                                      Clear
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          deadline: toYMD(new Date()),
                                        }));
                                        setDeadlineCalendarOpen(false);
                                        setDeadlineCalendarPosition(null);
                                      }}
                                      className="text-sm font-medium text-[#263672] dark:text-[#5b7cce] hover:underline"
                                    >
                                      Today
                                    </button>
                                  </div>
                                </div>,
                                document.body,
                              )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Max Collectors *
                          </Label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white/50 pointer-events-none" />
                            <Input
                              type="number"
                              min="1"
                              value={formData.max_collectors}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  max_collectors: e.target.value,
                                }))
                              }
                              className="rounded-full h-12 w-full pl-10 pr-4 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5 — Data Types */}
                  {currentStepId === "dataTypes" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What types of data do you need?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Select all data types required for this project.
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

                  {/* Step 6 — Formats */}
                  {currentStepId === "formats" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          What formats do you accept?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Select all file formats collectors can submit.
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
                              setFormData((prev) => ({
                                ...prev,
                                formats: [],
                              }))
                            }
                            className="text-xs font-medium text-black dark:text-white/70 hover:text-white underline underline-offset-2"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {FORMATS.map((format) => {
                          const selected = formData.formats.includes(format);
                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() => toggleItem("formats", format)}
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

                  {/* Step 7 — Specifications */}
                  {currentStepId === "specifications" && (
                    <div className="space-y-8 pl-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Additional specifications
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Optional. Add any extra requirements for the data.
                        </p>
                      </div>
                      <div className="space-y-2 max-w-lg">
                        <Label className="text-black dark:text-white/80 text-sm">
                          Notes for collectors
                        </Label>
                        <Textarea
                          value={formData.specifications}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              specifications: e.target.value,
                            }))
                          }
                          placeholder="Any additional requirements..."
                          rows={5}
                          className="rounded-xl bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 8 — Location */}
                  {currentStepId === "location" && (
                    <div className="space-y-8 pl-4 mb-24">
                      <div className="space-y-2">
                        <p className="text-2xl font-semibold text-black dark:text-white">
                          Where should data be collected?
                        </p>
                        <p className="text-sm text-black dark:text-white/60">
                          Search and select the location (and radius) for this
                          project.
                        </p>
                      </div>
                      <div className="space-y-5 max-w-md">
                        <AddressAutocomplete
                          value={formData.location_address}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              location_address: value,
                            }))
                          }
                          onSelect={(result) =>
                            setFormData((prev) => ({
                              ...prev,
                              location_address: result.address,
                              location_lat: result.lat?.toString() ?? "",
                              location_lng: result.lng?.toString() ?? "",
                              radius_km: prev.radius_km || "5",
                            }))
                          }
                          placeholder="Search for a location..."
                          className="h-12 text-sm rounded-full border border-[#0a0a0a] dark:border-gray-700 shadow-none bg-white dark:bg-[#0a0a0a] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                        />
                        <div className="space-y-2">
                          <Label className="text-black dark:text-white/80 text-sm">
                            Radius (km)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.radius_km}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                radius_km: e.target.value,
                              }))
                            }
                            className="rounded-full h-12 px-6 bg-white border-[#0a0a0a] dark:border-[#333] text-black dark:text-white ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0a0a0a]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                  <aside className="hidden lg:block h-full min-h-0">
                    <div className="h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-[#fafafa] dark:bg-[#0f0f0f] p-4">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-black dark:text-white">
                          Data suggestions
                        </p>
                        <p className="text-xs text-black dark:text-white/60 mt-1">
                          Similar projects and budget ideas stay visible while
                          {isEditMode
                            ? " editing your project."
                            : " creating your project."}
                        </p>
                      </div>
                      <DataSuggestionsPanel
                        title={formData.title}
                        description={formData.description}
                        onBudgetSelect={(budget) =>
                          setFormData((prev) => ({
                            ...prev,
                            budget: budget.toFixed(2),
                          }))
                        }
                      />
                    </div>
                  </aside>
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
                    {isEditMode
                      ? "Saving your project changes..."
                      : "Creating your project..."}
                  </p>
                </div>
              )}

              {/* Completed phase */}
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
                      {isEditMode ? "Project Updated! 🎉" : "Project Created! 🎉"}
                    </p>
                    <p className="text-sm sm:text-base text-black dark:text-white/70 max-w-md mx-auto">
                      Your project{" "}
                      <span className="font-semibold text-black dark:text-white">
                        {formData.title}
                      </span>{" "}
                      {isEditMode
                        ? "has been updated successfully."
                        : "has been created successfully."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer — progress bar + navigation (hidden when processing) */}
            {phase !== "processing" && (
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
                        isEditMode ? "Save Changes" : "Create Project"
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
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
