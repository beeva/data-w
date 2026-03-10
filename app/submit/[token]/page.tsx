"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignmentByToken } from "@/lib/services/proposalService";
import {
  getCollectorFeedbackForProject,
  getProjectById,
  getRequesterFeedbackForProject,
  submitCollectorFeedbackForProject,
  type CollectorFeedback,
  type ProjectFeedback,
} from "@/lib/services/projectService";
import {
  getSubmissionsByProject,
  getDataItemsBySubmission,
  updateDataItemAccess,
} from "@/lib/services/submissionService";
import type { CollectorAssignment, Project } from "@/types";
import type { Submission, DataItem } from "@/types/submission";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import SubmissionDialog from "@/components/dashboard/collector/SubmissionDialog";
import type { SubmissionToast } from "@/components/dashboard/collector/SubmissionDialog";
import ToastNotification from "@/components/ui/toast-notification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Music,
  File,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Star,
  Upload,
  MapPin,
  Calendar,
  Users,
  Ruler,
  Camera,
  Video,
  Mic,
  ClipboardList,
  LocateFixed,
  Activity,
  Package,
  DollarSign,
  Globe,
  Lock,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { Photography1Svg } from "@/components/svg/photography/photography_1";
import { Photography2Svg } from "@/components/svg/photography/photography_2";
import { Photography3Svg } from "@/components/svg/photography/photography_3";
import { Photography4Svg } from "@/components/svg/photography/photography_4";
import { Photography5Svg } from "@/components/svg/photography/photography_5";
import { Video1Svg } from "@/components/svg/video/video_1";
import { Video2Svg } from "@/components/svg/video/video_2";
import { Video3Svg } from "@/components/svg/video/video_3";
import { Video4Svg } from "@/components/svg/video/video_4";
import { Video5Svg } from "@/components/svg/video/video_5";
import { Audio1Svg } from "@/components/svg/audio/audio_1";
import { Audio2Svg } from "@/components/svg/audio/audio_2";
import { Audio3Svg } from "@/components/svg/audio/audio_3";
import { Audio4Svg } from "@/components/svg/audio/audio_4";
import { Audio5Svg } from "@/components/svg/audio/audio_5";
import { Text1Svg } from "@/components/svg/text/text_1";
import { Text2Svg } from "@/components/svg/text/text_2";
import { Text3Svg } from "@/components/svg/text/text_3";
import { Text4Svg } from "@/components/svg/text/text_4";
import { Text5Svg } from "@/components/svg/text/text_5";
import { Survey1Svg } from "@/components/svg/survey/survey_1";
import { Survey2Svg } from "@/components/svg/survey/survey_2";
import { Survey3Svg } from "@/components/svg/survey/survey_3";
import { Survey4Svg } from "@/components/svg/survey/survey_4";
import { Survey5Svg } from "@/components/svg/survey/survey_5";
import { Location1Svg } from "@/components/svg/location-data/location_1";
import { Location2Svg } from "@/components/svg/location-data/location_2";
import { Location3Svg } from "@/components/svg/location-data/location_3";
import { Location4Svg } from "@/components/svg/location-data/location_4";
import { Location5Svg } from "@/components/svg/location-data/location_5";
import { Sensor1Svg } from "@/components/svg/sensor-data/sensor_1";
import { Sensor2Svg } from "@/components/svg/sensor-data/sensor_2";
import { Sensor3Svg } from "@/components/svg/sensor-data/sensor_3";
import { Sensor4Svg } from "@/components/svg/sensor-data/sensor_4";
import { Sensor5Svg } from "@/components/svg/sensor-data/sensor_5";
import { Other1Svg } from "@/components/svg/other/other_1";
import { Other2Svg } from "@/components/svg/other/other_2";

/* ── SVG pools ── */
const PHOTOGRAPHY_SVGS = [
  Photography1Svg,
  Photography2Svg,
  Photography3Svg,
  Photography4Svg,
  Photography5Svg,
] as const;
const VIDEO_SVGS = [
  Video1Svg,
  Video2Svg,
  Video3Svg,
  Video4Svg,
  Video5Svg,
] as const;
const AUDIO_SVGS = [
  Audio1Svg,
  Audio2Svg,
  Audio3Svg,
  Audio4Svg,
  Audio5Svg,
] as const;
const TEXT_SVGS = [Text1Svg, Text2Svg, Text3Svg, Text4Svg, Text5Svg] as const;
const SURVEY_SVGS = [
  Survey1Svg,
  Survey2Svg,
  Survey3Svg,
  Survey4Svg,
  Survey5Svg,
] as const;
const LOCATION_SVGS = [
  Location1Svg,
  Location2Svg,
  Location3Svg,
  Location4Svg,
  Location5Svg,
] as const;
const SENSOR_SVGS = [
  Sensor1Svg,
  Sensor2Svg,
  Sensor3Svg,
  Sensor4Svg,
  Sensor5Svg,
] as const;
const OTHER_SVGS = [Other1Svg, Other2Svg] as const;

function getProjectIconIndex(projectId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

function getSvgForProject(projectId: string, category: string) {
  const pool =
    category === "Photography"
      ? PHOTOGRAPHY_SVGS
      : category === "Video"
        ? VIDEO_SVGS
        : category === "Audio"
          ? AUDIO_SVGS
          : category === "Text"
            ? TEXT_SVGS
            : category === "Survey"
              ? SURVEY_SVGS
              : category === "Location Data"
                ? LOCATION_SVGS
                : category === "Sensor Data"
                  ? SENSOR_SVGS
                  : OTHER_SVGS;
  return pool[getProjectIconIndex(projectId, pool.length)];
}

/* ── Category metadata (mirrors ProposalDetailPage) ── */
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; accent: string; bg: string }
> = {
  Photography: {
    icon: <Camera className="w-4 h-4" />,
    accent: "#10b981",
    bg: "bg-emerald-500/10",
  },
  Video: {
    icon: <Video className="w-4 h-4" />,
    accent: "#0ea5e9",
    bg: "bg-sky-500/10",
  },
  Audio: {
    icon: <Mic className="w-4 h-4" />,
    accent: "#a855f7",
    bg: "bg-purple-500/10",
  },
  Text: {
    icon: <FileText className="w-4 h-4" />,
    accent: "#f59e0b",
    bg: "bg-amber-500/10",
  },
  Survey: {
    icon: <ClipboardList className="w-4 h-4" />,
    accent: "#22c55e",
    bg: "bg-green-500/10",
  },
  "Location Data": {
    icon: <LocateFixed className="w-4 h-4" />,
    accent: "#14b8a6",
    bg: "bg-teal-500/10",
  },
  "Sensor Data": {
    icon: <Activity className="w-4 h-4" />,
    accent: "#f97316",
    bg: "bg-orange-500/10",
  },
  Other: {
    icon: <Package className="w-4 h-4" />,
    accent: "#06b6d4",
    bg: "bg-cyan-500/10",
  },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "No deadline";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "image":
      return <ImageIcon className="w-4 h-4 text-blue-400" />;
    case "video":
      return <Film className="w-4 h-4 text-purple-400" />;
    case "audio":
      return <Music className="w-4 h-4 text-green-400" />;
    case "document":
      return <FileText className="w-4 h-4 text-orange-400" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30 dark:border-amber-500/50">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "validated":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 dark:border-emerald-500/50">
          <CheckCircle2 className="w-3 h-3" />
          Validated
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/30 dark:border-red-500/50">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          {status}
        </span>
      );
  }
}

function StarRating({
  rating,
  interactive = false,
  onRate,
  size = "sm",
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (val: number) => void;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "md" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const filled = idx < (interactive ? hovered || rating : rating);
        return interactive ? (
          <button
            key={idx}
            type="button"
            onClick={() => onRate?.(idx + 1)}
            onMouseEnter={() => setHovered(idx + 1)}
            onMouseLeave={() => setHovered(0)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                sz,
                "transition-colors",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ) : (
          <Star
            key={idx}
            className={cn(
              sz,
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
          />
        );
      })}
    </div>
  );
}

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [assignment, setAssignment] = useState<CollectorAssignment | null>(
    null,
  );
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dataItemsMap, setDataItemsMap] = useState<Record<string, DataItem[]>>(
    {},
  );
  const [itemConfigDrafts, setItemConfigDrafts] = useState<
    Record<string, { visibility: "public" | "private"; price: string }>
  >({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(
    null,
  );
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [toast, setToast] = useState<SubmissionToast | null>(null);
  const [requesterFeedback, setRequesterFeedback] =
    useState<ProjectFeedback | null>(null);
  const [collectorFeedback, setCollectorFeedback] =
    useState<CollectorFeedback | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setError("Invalid submission link");
      setLoading(false);
      return;
    }
    if (!userId) {
      setError("Please log in to access this submission link.");
      setLoading(false);
      return;
    }
    fetchAssignment();
  }, [token, authLoading, userId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError("");
      const { data, error: assignmentError } =
        await getAssignmentByToken(token);
      if (assignmentError || !data)
        throw new Error(assignmentError?.message || "Assignment not found");
      setAssignment(data);
      const { data: projectData, error: projectError } = await getProjectById(
        data.request_id,
      );
      if (projectError || !projectData)
        throw new Error(projectError?.message || "Project not found");
      setProject(projectData);
    } catch (err: any) {
      setError(err.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!project?.id) return;
    try {
      setLoadingSubmissions(true);
      const { data, error: fetchError } = await getSubmissionsByProject(
        project.id,
      );
      if (fetchError) throw fetchError;
      setSubmissions((data || []).filter((s) => s.collector_id === user?.id));
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [project?.id, user?.id]);

  useEffect(() => {
    if (project && userId) fetchSubmissions();
  }, [project, userId, fetchSubmissions]);

  useEffect(() => {
    if (project?.status !== "completed" || !project?.id || !userId) return;
    const loadFeedbacks = async () => {
      const [rRes, cRes] = await Promise.all([
        getRequesterFeedbackForProject(project.id),
        getCollectorFeedbackForProject(project.id, userId),
      ]);
      setRequesterFeedback(rRes.data ?? null);
      setCollectorFeedback(cRes.data ?? null);
    };
    loadFeedbacks();
  }, [project?.id, project?.status, userId]);

  useEffect(() => {
    if (project?.status !== "completed" || submissions.length === 0) return;
    const missing = submissions
      .map((s) => s.id)
      .filter((id) => !dataItemsMap[id]);
    if (missing.length === 0) return;
    const load = async () => {
      const results = await Promise.all(
        missing.map(async (submissionId) => {
          const { data } = await getDataItemsBySubmission(submissionId);
          return { submissionId, items: data || [] };
        }),
      );
      setDataItemsMap((prev) => {
        const next = { ...prev };
        results.forEach(({ submissionId, items }) => {
          next[submissionId] = items;
        });
        return next;
      });
    };
    load();
  }, [project?.status, submissions, dataItemsMap]);

  const isAccessConfigured = (item: DataItem) =>
    (item.visibility === "public" || item.visibility === "private") &&
    typeof item.price === "number" &&
    Number.isFinite(item.price);

  const getItemDraft = (item: DataItem) =>
    itemConfigDrafts[item.id] || {
      visibility: item.visibility || "private",
      price:
        typeof item.price === "number" && Number.isFinite(item.price)
          ? String(item.price)
          : "",
    };

  const updateItemDraft = (
    itemId: string,
    field: "visibility" | "price",
    value: string,
  ) => {
    setItemConfigDrafts((prev) => {
      const current = prev[itemId] || {
        visibility: "private" as const,
        price: "",
      };
      return {
        ...prev,
        [itemId]:
          field === "visibility"
            ? { ...current, visibility: value as "public" | "private" }
            : { ...current, price: value },
      };
    });
  };

  const handleSaveItemAccess = async (submissionId: string, item: DataItem) => {
    if (requiresCollectorFeedback) {
      setToast({
        message: "Please submit your feedback before updating access settings.",
        type: "error",
      });
      return;
    }
    const draft = getItemDraft(item);
    const priceValue = Number(draft.price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setToast({
        message: "Please enter a valid non-negative price.",
        type: "error",
      });
      return;
    }
    try {
      setSavingItemId(item.id);
      const { data, error: updateError } = await updateDataItemAccess(
        item.id,
        draft.visibility,
        priceValue,
      );
      if (updateError || !data)
        throw new Error(updateError?.message || "Failed to update data item");
      setDataItemsMap((prev) => ({
        ...prev,
        [submissionId]: (prev[submissionId] || []).map((e) =>
          e.id === item.id ? data : e,
        ),
      }));
      setItemConfigDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setToast({
        message: "Access settings updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to update access settings.",
        type: "error",
      });
    } finally {
      setSavingItemId(null);
    }
  };

  const handleSubmitCollectorFeedback = async () => {
    if (!project || !userId || !requesterFeedback) return;
    if (feedbackRating < 1 || feedbackRating > 5) {
      setToast({ message: "Please select a star rating.", type: "error" });
      return;
    }
    if (!feedbackText.trim()) {
      setToast({ message: "Please write your feedback.", type: "error" });
      return;
    }
    try {
      setSubmittingFeedback(true);
      const { data, error: feedbackError } =
        await submitCollectorFeedbackForProject(
          project.id,
          project.requester_id,
          userId,
          feedbackRating,
          feedbackText,
        );
      if (feedbackError || !data)
        throw new Error(feedbackError?.message || "Failed to submit feedback");
      setCollectorFeedback(data);
      setToast({
        message: "Your feedback has been sent to the requester.",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to submit feedback.",
        type: "error",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isSubmissionClosed =
    project?.status === "completed" || project?.status === "cancelled";
  const requiresAccessSetup = project?.status === "completed";
  const allLoadedItems = Object.values(dataItemsMap).flat();
  const pendingConfigCount = requiresAccessSetup
    ? allLoadedItems.filter((item) => !isAccessConfigured(item)).length
    : 0;
  const requiresCollectorFeedback =
    requiresAccessSetup && !!requesterFeedback && !collectorFeedback;

  const toggleSubmissionFiles = async (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
      return;
    }
    setExpandedSubmission(submissionId);
    if (!dataItemsMap[submissionId]) {
      try {
        setLoadingItems(submissionId);
        const { data, error: itemsError } =
          await getDataItemsBySubmission(submissionId);
        if (itemsError) throw itemsError;
        setDataItemsMap((prev) => ({ ...prev, [submissionId]: data || [] }));
      } catch (err: any) {
        console.error("Error fetching data items:", err);
      } finally {
        setLoadingItems(null);
      }
    }
  };

  if (authLoading || loading) return <Loading />;

  if (error || !assignment || !project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px] p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 dark:border-red-500/50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Invalid Submission Link
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error || "This submission link is invalid or has expired."}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user && user.id !== assignment.collector_id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px] p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Unauthorized Access</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This submission link is assigned to a different collector.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const catMeta = CATEGORY_META[project.category] ?? CATEGORY_META["Other"];
  const SvgComp = getSvgForProject(project.id, project.category);

  return (
    <DashboardLayout>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="py-6 space-y-5">
        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Submit Files</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View the job details and manage your submissions
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ══════════════════════════════════════════
              LEFT — Job Details
          ══════════════════════════════════════════ */}
          <section className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <p className="text-xl font-bold text-foreground uppercase tracking-wide px-5 pt-5">
              Job Details
            </p>

            {/* Project header row */}
            <div className="px-5 pt-5 pb-4 flex items-start gap-3">
              <div
                className={`shrink-0 w-12 h-12 rounded-xl ${catMeta.bg} flex items-center justify-center mt-0.5`}
                style={{ color: catMeta.accent }}
              >
                <span className="w-8 h-8 flex items-center justify-center">
                  <SvgComp color={catMeta.accent} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {project.title}
                </h2>
                {(project.location as any)?.address && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {(project.location as any).address}
                    </span>
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${catMeta.bg}`}
                    style={{ color: catMeta.accent }}
                  >
                    <span className="scale-75 origin-center">
                      {catMeta.icon}
                    </span>
                    {project.category}
                  </span>
                  <Badge
                    variant="outline"
                    className={`capitalize text-[11px] gap-1.5 ${
                      project.status === "completed"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : project.status === "cancelled"
                          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : project.status === "paused"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        project.status === "completed"
                          ? "bg-emerald-500"
                          : project.status === "cancelled"
                            ? "bg-red-500"
                            : project.status === "paused"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                      }`}
                    />
                    {project.status}
                  </Badge>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-foreground tabular-nums">
                  ${project.budget.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">budget</p>
              </div>
            </div>

            <div className="px-5">
              <Separator />
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Description
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>

              <Separator />

              {/* Quick chips */}
              <div className="flex flex-wrap gap-3">
                {(project as any).max_collectors && (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                    <Users className="w-4 h-4" />
                    {(project as any).max_collectors}{" "}
                    {(project as any).max_collectors === 1
                      ? "collector"
                      : "collectors"}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.deadline)}
                </span>
                {typeof (project.location as any)?.radius_km === "number" && (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                    <Ruler className="w-4 h-4" />
                    {(project.location as any).radius_km} km radius
                  </span>
                )}
              </div>

              {/* Data types */}
              {project.requirements?.data_types?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Required Data Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.requirements.data_types.map((type, idx) => (
                      <Badge
                        key={`${type}-${idx}`}
                        variant="secondary"
                        className="text-sm px-3 py-1 border-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Formats */}
              {project.requirements?.formats?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Preferred Formats
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.requirements.formats.map((format, idx) => (
                      <Badge
                        key={`${format}-${idx}`}
                        variant="outline"
                        className="text-sm px-3 py-1 border-none bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full"
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {project.requirements?.specifications && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Additional Specifications
                  </p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {project.requirements.specifications}
                  </p>
                </div>
              )}

              {/* Map */}
              {typeof (project.location as any)?.lat === "number" &&
                typeof (project.location as any)?.lng === "number" && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Location Map
                    </p>
                    <div className="overflow-hidden rounded-xl">
                      <LocationMapPreview
                        lat={(project.location as any).lat}
                        lng={(project.location as any).lng}
                        radiusKm={
                          typeof (project.location as any).radius_km ===
                            "number" &&
                          Number.isFinite((project.location as any).radius_km)
                            ? Math.max((project.location as any).radius_km, 0)
                            : 0
                        }
                      />
                    </div>
                  </div>
                )}
            </div>
          </section>

          {/* ══════════════════════════════════════════
              RIGHT — two stacked cards
          ══════════════════════════════════════════ */}
          <div className="flex flex-col gap-5">
            {/* ── CARD 1: Submission ── */}
            <section className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-foreground uppercase tracking-wide">
                  Submission
                </p>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assignment Confirmed
                </span>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* ── Submission instructions / closed notice ── */}
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4 space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {isSubmissionClosed ? "Submission Closed" : "Instructions"}
                  </p>

                  {isSubmissionClosed ? (
                    <div className="flex gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {project.status === "cancelled" ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        {project.status === "cancelled"
                          ? "This project has been cancelled by the requester. New submissions are no longer allowed."
                          : "This project has been marked as completed. New submissions are no longer allowed."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-1.5">
                        {[
                          "Follow all data type and format requirements",
                          "Include accurate location data if required",
                          "Ensure all files meet quality standards",
                          "Submit before the project deadline",
                        ].map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-foreground/70"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="pt-1">
                        <SubmissionDialog
                          project={project}
                          assignment={assignment}
                          onSuccess={() => {
                            fetchAssignment();
                            fetchSubmissions();
                          }}
                          onToast={setToast}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* ── Feedback Exchange ── */}
                {requiresAccessSetup && requesterFeedback && (
                  <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-4 space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      Feedback Exchange
                    </p>

                    {/* Requester → Collector */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-3 space-y-1.5">
                      <p className="text-sm font-medium text-muted-foreground">
                        Requester's feedback to you
                      </p>
                      <StarRating rating={requesterFeedback.rating} />
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {requesterFeedback.feedback}
                      </p>
                    </div>

                    {/* Collector → Requester */}
                    {collectorFeedback ? (
                      <div className="rounded-lg border border-emerald-500/30 dark:border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/15 p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            Your feedback (submitted)
                          </p>
                        </div>
                        <StarRating rating={collectorFeedback.rating} />
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {collectorFeedback.feedback}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-400/40 dark:border-amber-400/60 bg-amber-500/10 dark:bg-amber-500/15 p-3 space-y-3">
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                          Leave your feedback for the requester to proceed.
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Your rating
                          </p>
                          <StarRating
                            rating={feedbackRating}
                            interactive
                            onRate={setFeedbackRating}
                            size="md"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Your feedback
                          </p>
                          <textarea
                            className="w-full min-h-[80px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                            placeholder="Share your experience working on this project..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            disabled={submittingFeedback}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleSubmitCollectorFeedback}
                          disabled={submittingFeedback}
                          className="h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {submittingFeedback ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            "Submit Feedback"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Access setup notice ── */}
                {requiresAccessSetup && (
                  <div
                    className={cn(
                      "flex gap-2.5 rounded-lg px-4 py-3 text-sm leading-relaxed",
                      pendingConfigCount > 0 || requiresCollectorFeedback
                        ? "bg-amber-500/10 border border-amber-400/30 dark:border-amber-400/50 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {pendingConfigCount > 0 || requiresCollectorFeedback ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span>
                      {requiresCollectorFeedback
                        ? "Submit your feedback to the requester before configuring file access."
                        : pendingConfigCount > 0
                          ? `Set visibility & price for each file. ${pendingConfigCount} file${pendingConfigCount > 1 ? "s" : ""} pending.`
                          : "All files are configured."}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ── CARD 2: Submission History ── */}
            <section className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground uppercase tracking-wide">
                    History
                  </p>
                  {submissions.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                      {submissions.length}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchSubmissions}
                  disabled={loadingSubmissions}
                  className="h-7 text-xs gap-1.5 px-2"
                >
                  {loadingSubmissions ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Refresh
                </Button>
              </div>

              {loadingSubmissions && submissions.length === 0 ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4 pb-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No submissions yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the button above to upload your data.
                  </p>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-2">
                  {submissions.map((submission, idx) => {
                    const isExpanded = expandedSubmission === submission.id;
                    const items = dataItemsMap[submission.id];
                    const isLoadingItems = loadingItems === submission.id;

                    return (
                      <div
                        key={submission.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* ── Submission row ── */}
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors bg-white dark:bg-gray-800/80"
                          onClick={() => toggleSubmissionFiles(submission.id)}
                        >
                          {/* Index badge */}
                          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>

                          {/* Date */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {new Date(
                                submission.submitted_at,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                submission.submitted_at,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Status */}
                          <StatusBadge status={submission.status} />

                          {/* Score */}
                          {submission.validation_score !== null ? (
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums w-10 text-right",
                                submission.validation_score >= 70
                                  ? "text-emerald-500"
                                  : "text-red-400",
                              )}
                            >
                              {submission.validation_score}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground w-10 text-right">
                              —
                            </span>
                          )}

                          {/* Chevron */}
                          <div className="shrink-0 w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* ── Expanded files panel ── */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-900/60 px-4 py-3">
                            {isLoadingItems ? (
                              <div className="flex items-center gap-2 py-3 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading files…</span>
                              </div>
                            ) : !items || items.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2 text-center">
                                No files found for this submission.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  {items.length} file
                                  {items.length > 1 ? "s" : ""}
                                </p>
                                {items.map((item) => {
                                  const draft = getItemDraft(item);
                                  const alreadyConfigured =
                                    isAccessConfigured(item);
                                  return (
                                    <div
                                      key={item.id}
                                      className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 flex items-center gap-3"
                                    >
                                      {/* Icon */}
                                      <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {getFileIcon(item.file_type)}
                                      </div>

                                      {/* Name + size */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {item.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatFileSize(item.file_size)}
                                        </p>
                                      </div>

                                      {/* Access controls (only when project is completed) */}
                                      {requiresAccessSetup && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {/* Visibility */}
                                          <div className="relative">
                                            <select
                                              className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-foreground pl-7 pr-2 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
                                              value={draft.visibility}
                                              onChange={(e) =>
                                                updateItemDraft(
                                                  item.id,
                                                  "visibility",
                                                  e.target.value,
                                                )
                                              }
                                              disabled={
                                                requiresCollectorFeedback
                                              }
                                            >
                                              <option value="public">
                                                Public
                                              </option>
                                              <option value="private">
                                                Private
                                              </option>
                                            </select>
                                            <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                                              {draft.visibility === "public" ? (
                                                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                                              ) : (
                                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Price */}
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                              $
                                            </span>
                                            <input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={draft.price}
                                              onChange={(e) =>
                                                updateItemDraft(
                                                  item.id,
                                                  "price",
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="0.00"
                                              className="h-8 w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-foreground pl-5 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                              disabled={
                                                requiresCollectorFeedback
                                              }
                                            />
                                          </div>

                                          {/* Save / Update */}
                                          <Button
                                            size="sm"
                                            variant={
                                              alreadyConfigured
                                                ? "outline"
                                                : "default"
                                            }
                                            className="h-8 text-xs px-3 rounded-lg"
                                            onClick={() =>
                                              handleSaveItemAccess(
                                                submission.id,
                                                item,
                                              )
                                            }
                                            disabled={
                                              savingItemId === item.id ||
                                              requiresCollectorFeedback
                                            }
                                          >
                                            {savingItemId === item.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : alreadyConfigured ? (
                                              "Update"
                                            ) : (
                                              "Save"
                                            )}
                                          </Button>
                                        </div>
                                      )}

                                      {/* View link */}
                                      <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
