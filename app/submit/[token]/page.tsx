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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "image":
      return <ImageIcon className="w-4 h-4 text-blue-400" />;
    case "video":
      return <Film className="w-4 h-4 text-purple-400" />;
    case "audio":
      return <Music className="w-4 h-4 text-green-400" />;
    case "document":
      return <FileText className="w-4 h-4 text-red-400" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "validated":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Validated
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [assignment, setAssignment] = useState<CollectorAssignment | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dataItemsMap, setDataItemsMap] = useState<Record<string, DataItem[]>>({});
  const [itemConfigDrafts, setItemConfigDrafts] = useState<
    Record<string, { visibility: "public" | "private"; price: string }>
  >({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [toast, setToast] = useState<SubmissionToast | null>(null);
  const [requesterFeedback, setRequesterFeedback] = useState<ProjectFeedback | null>(null);
  const [collectorFeedback, setCollectorFeedback] = useState<CollectorFeedback | null>(null);
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

      const { data, error: assignmentError } = await getAssignmentByToken(token);

      if (assignmentError || !data) {
        throw new Error(assignmentError?.message || "Assignment not found");
      }

      setAssignment(data);

      const { data: projectData, error: projectError } = await getProjectById(
        data.request_id
      );

      if (projectError || !projectData) {
        throw new Error(projectError?.message || "Project not found");
      }

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
      const { data, error: fetchError } = await getSubmissionsByProject(project.id);
      if (fetchError) throw fetchError;

      const mySubmissions = (data || []).filter(
        (s) => s.collector_id === user?.id
      );
      setSubmissions(mySubmissions);
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [project?.id, user?.id]);

  useEffect(() => {
    if (project && userId) {
      fetchSubmissions();
    }
  }, [project, userId, fetchSubmissions]);

  useEffect(() => {
    if (project?.status !== "completed" || !project?.id || !userId) return;

    const loadFeedbacks = async () => {
      const [requesterFeedbackRes, collectorFeedbackRes] = await Promise.all([
        getRequesterFeedbackForProject(project.id),
        getCollectorFeedbackForProject(project.id, userId),
      ]);

      setRequesterFeedback(requesterFeedbackRes.data ?? null);
      setCollectorFeedback(collectorFeedbackRes.data ?? null);
    };

    loadFeedbacks();
  }, [project?.id, project?.status, userId]);

  useEffect(() => {
    if (project?.status !== "completed") return;
    if (submissions.length === 0) return;

    const missingSubmissionIds = submissions
      .map((submission) => submission.id)
      .filter((submissionId) => !dataItemsMap[submissionId]);

    if (missingSubmissionIds.length === 0) return;

    const loadMissingDataItems = async () => {
      const results = await Promise.all(
        missingSubmissionIds.map(async (submissionId) => {
          const { data } = await getDataItemsBySubmission(submissionId);
          return { submissionId, items: data || [] };
        })
      );

      setDataItemsMap((prev) => {
        const next = { ...prev };
        results.forEach(({ submissionId, items }) => {
          next[submissionId] = items;
        });
        return next;
      });
    };

    loadMissingDataItems();
  }, [project?.status, submissions, dataItemsMap]);

  const isAccessConfigured = (item: DataItem) => {
    const hasVisibility = item.visibility === "public" || item.visibility === "private";
    const hasValidPrice = typeof item.price === "number" && Number.isFinite(item.price);
    return hasVisibility && hasValidPrice;
  };

  const getItemDraft = (item: DataItem) => {
    return (
      itemConfigDrafts[item.id] || {
        visibility: item.visibility || "private",
        price:
          typeof item.price === "number" && Number.isFinite(item.price)
            ? String(item.price)
            : "",
      }
    );
  };

  const updateItemDraft = (
    itemId: string,
    field: "visibility" | "price",
    value: string
  ) => {
    setItemConfigDrafts((prev) => {
      const current = prev[itemId] || { visibility: "private" as const, price: "" };
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
        message:
          "Please submit your feedback to requester before updating access settings.",
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
        priceValue
      );

      if (updateError || !data) {
        throw new Error(updateError?.message || "Failed to update data item");
      }

      setDataItemsMap((prev) => ({
        ...prev,
        [submissionId]: (prev[submissionId] || []).map((existing) =>
          existing.id === item.id ? data : existing
        ),
      }));

      setItemConfigDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      setToast({
        message: "Data visibility and price updated.",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to update data item access settings.",
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
      const { data, error: feedbackError } = await submitCollectorFeedbackForProject(
        project.id,
        project.requester_id,
        userId,
        feedbackRating,
        feedbackText
      );

      if (feedbackError || !data) {
        throw new Error(feedbackError?.message || "Failed to submit feedback");
      }

      setCollectorFeedback(data);
      setToast({
        message: "Thanks! Your feedback has been sent to the requester.",
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

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error || !assignment || !project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="dark:bg-gray-800/50 border-none max-w-md">
            <CardContent className="p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Invalid Submission Link</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {error || "This submission link is invalid or has expired."}
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user && user.id !== assignment.collector_id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="dark:bg-gray-800/50 border-none max-w-md">
            <CardContent className="p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Unauthorized Access</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This submission link is assigned to a different collector.
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Success Banner */}
        <Card className="dark:bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-sm font-semibold text-green-400">
                  Assignment Confirmed
                </h3>
                <p className="text-xs text-muted-foreground">
                  You have been assigned to collect data for this project.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              {project.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Project Description</h4>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold mb-1">Category</h4>
                <Badge variant="outline">{project.category}</Badge>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">Budget</h4>
                <p className="text-sm font-semibold">${project.budget.toFixed(2)}</p>
              </div>
            </div>

            {project.requirements && (
              <div>
                <h4 className="text-xs font-semibold mb-2">Required Data Types</h4>
                <div className="flex flex-wrap gap-2">
                  {project.requirements.data_types.map((type, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {project.deadline && (
              <div>
                <h4 className="text-xs font-semibold mb-1">Deadline</h4>
                <p className="text-sm">
                  {new Date(project.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Instructions & Action */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isSubmissionClosed
                ? "Submission Closed"
                : "Submission Instructions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSubmissionClosed ? (
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-yellow-500/30 dark:bg-yellow-500/10">
                <p className="text-sm text-amber-800 dark:text-yellow-200">
                  {project.status === "cancelled"
                    ? "This project has been cancelled by the requester. New submissions are no longer allowed."
                    : "This project has been marked as completed by the requester. New submissions are no longer allowed."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <p>
                    Please submit your data collection according to the project requirements.
                    Make sure to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Follow all data type and format requirements</li>
                    <li>Include accurate location data if required</li>
                    <li>Ensure all files meet quality standards</li>
                    <li>Submit before the project deadline</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
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
          </CardContent>
        </Card>

        {requiresAccessSetup && requesterFeedback && (
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Feedback Exchange
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold mb-2">Requester feedback to you</p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-4 h-4 ${
                        idx < requesterFeedback.rating
                          ? "fill-yellow-400 text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{requesterFeedback.feedback}</p>
              </div>

              {collectorFeedback ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <p className="text-xs font-semibold text-green-500 mb-1">
                    Your feedback to requester (submitted)
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < collectorFeedback.rating
                            ? "fill-yellow-400 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{collectorFeedback.feedback}</p>
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-yellow-500/30 dark:bg-yellow-500/10 p-3">
                  <p className="text-sm text-amber-800 dark:text-yellow-200">
                    Requester has submitted feedback. Please leave your feedback to requester.
                  </p>
                  <div>
                    <p className="text-xs font-semibold mb-2">Your star rating</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFeedbackRating(idx + 1)}
                          className="rounded p-1 hover:bg-muted"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              idx < feedbackRating
                                ? "fill-yellow-400 text-yellow-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Your feedback</p>
                    <textarea
                      className="w-full min-h-[96px] rounded border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Write your feedback to requester..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      disabled={submittingFeedback}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleSubmitCollectorFeedback}
                    disabled={submittingFeedback}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {submittingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submitted Data Table */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                My Submissions ({submissions.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubmissions}
                disabled={loadingSubmissions}
                className="h-7 text-xs"
              >
                {loadingSubmissions ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {requiresAccessSetup && (
              <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-yellow-500/30 dark:bg-yellow-500/10">
                <p className="text-xs text-amber-800 dark:text-yellow-200">
                  This project is completed. You must set each file as public or private and add a price.
                  {pendingConfigCount > 0 ? ` Pending files: ${pendingConfigCount}.` : " All files are configured."}
                  {requiresCollectorFeedback
                    ? " You must submit feedback to requester first."
                    : ""}
                </p>
              </div>
            )}
            {loadingSubmissions && submissions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No submissions yet. Click &quot;Start Submission&quot; to upload your data.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    const isExpanded = expandedSubmission === submission.id;
                    const items = dataItemsMap[submission.id];
                    const isLoadingItems = loadingItems === submission.id;
                    const notes =
                      (submission.metadata as any)?.notes || "-";

                    return (
                      <React.Fragment key={submission.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => toggleSubmissionFiles(submission.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-sm">
                            {submission.validation_score !== null
                              ? `${submission.validation_score}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {notes}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <div className="bg-muted/50 px-6 py-3">
                                {isLoadingItems ? (
                                  <div className="flex items-center gap-2 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Loading files...
                                    </span>
                                  </div>
                                ) : !items || items.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">
                                    No files found for this submission.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-border">
                                        <TableHead className="text-xs">Type</TableHead>
                                        <TableHead className="text-xs">File Name</TableHead>
                                        <TableHead className="text-xs">Size</TableHead>
                                        <TableHead className="text-xs">Uploaded</TableHead>
                                        {requiresAccessSetup && (
                                          <>
                                            <TableHead className="text-xs">Visibility</TableHead>
                                            <TableHead className="text-xs">Price</TableHead>
                                            <TableHead className="text-xs">Save</TableHead>
                                          </>
                                        )}
                                        <TableHead className="text-xs w-[60px]"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {items.map((item) => {
                                        const draft = getItemDraft(item);
                                        const alreadyConfigured = isAccessConfigured(item);

                                        return (
                                          <TableRow
                                            key={item.id}
                                            className="border-border"
                                          >
                                            <TableCell>
                                              <div className="flex items-center gap-1.5">
                                                {getFileIcon(item.file_type)}
                                                <span className="text-xs capitalize text-muted-foreground">
                                                  {item.file_type}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium max-w-[200px] truncate">
                                              {item.file_name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                              {formatFileSize(item.file_size)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                              {new Date(item.created_at).toLocaleString()}
                                            </TableCell>
                                            {requiresAccessSetup && (
                                              <>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                  <select
                                                    className="h-7 rounded border border-border bg-background px-2 text-xs"
                                                    value={draft.visibility}
                                                    onChange={(e) =>
                                                      updateItemDraft(item.id, "visibility", e.target.value)
                                                    }
                                                    disabled={requiresCollectorFeedback}
                                                  >
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                  </select>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={draft.price}
                                                    onChange={(e) =>
                                                      updateItemDraft(item.id, "price", e.target.value)
                                                    }
                                                    placeholder="0.00"
                                                    className="h-7 w-24 rounded border border-border bg-background px-2 text-xs"
                                                    disabled={requiresCollectorFeedback}
                                                  />
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                  <Button
                                                    size="sm"
                                                    variant={alreadyConfigured ? "outline" : "default"}
                                                    className="h-7 text-[10px]"
                                                    onClick={() =>
                                                      handleSaveItemAccess(submission.id, item)
                                                    }
                                                    disabled={savingItemId === item.id || requiresCollectorFeedback}
                                                  >
                                                    {savingItemId === item.id ? (
                                                      <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : alreadyConfigured ? (
                                                      "Update"
                                                    ) : (
                                                      "Save"
                                                    )}
                                                  </Button>
                                                </TableCell>
                                              </>
                                            )}
                                            <TableCell>
                                              <a
                                                href={item.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                                View
                                              </a>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
