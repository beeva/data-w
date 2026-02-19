"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  XCircle,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Download,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
} from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";

interface SubmissionRow {
  id: string;
  status: string;
  submitted_at: string;
  validated_at: string | null;
  validation_score: number | null;
  metadata: any;
  project_id: string;
  project_title: string;
  project_category: string;
  project_budget: number;
  collector_id: string;
  collector_name: string | null;
  collector_email: string;
  collector_avatar: string | null;
  validator_name: string | null;
  files_count: number;
}

interface DataItemRow {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  metadata: any;
  created_at: string;
}

interface AgentData {
  pendingCount: number;
  validatedToday: number;
  totalValidations: number;
  accuracyScore: number;
  submissions: SubmissionRow[];
}

interface AiFileResult {
  id: string;
  file_name: string;
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
}

interface AiValidationResult {
  has_ai_content: boolean;
  overall_pass: boolean;
  files: AiFileResult[];
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-600", label: "Pending" },
  validated: { color: "bg-green-500/20 text-green-600", label: "Approved" },
  rejected: { color: "bg-red-500/20 text-red-600", label: "Rejected" },
  disputed: { color: "bg-orange-500/20 text-orange-600", label: "Disputed" },
};

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "image": return <ImageIcon className="w-4 h-4 text-blue-500" />;
    case "video": return <Film className="w-4 h-4 text-purple-500" />;
    case "audio": return <Music className="w-4 h-4 text-pink-500" />;
    default: return <FileText className="w-4 h-4 text-gray-500" />;
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string, DataItemRow[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, AiValidationResult>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError("");
      const supabase = createClient();
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_agent_dashboard",
        { p_agent_id: userId, p_status_filter: statusFilter }
      );
      if (rpcError) throw rpcError;
      setData(result as AgentData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = async (submissionId: string) => {
    if (expandedId === submissionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(submissionId);
    if (!itemsMap[submissionId]) {
      try {
        setLoadingItems(submissionId);
        const supabase = createClient();
        const { data: items, error } = await supabase.rpc("agent_get_submission_items", {
          p_agent_id: userId,
          p_submission_id: submissionId,
        });
        if (error) throw error;
        setItemsMap((prev) => ({ ...prev, [submissionId]: (items as DataItemRow[]) || [] }));
      } catch (err: any) {
        console.error("Error loading items:", err);
      } finally {
        setLoadingItems(null);
      }
    }
  };

  const handleValidate = async (submissionId: string, approve: boolean) => {
    if (!userId) return;
    setProcessingId(submissionId);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("agent_validate_submission", {
        p_agent_id: userId,
        p_submission_id: submissionId,
        p_status: approve ? "validated" : "rejected",
        p_score: approve ? 100 : 0,
      });
      if (error) throw error;
      setToast({ message: approve ? "Submission approved!" : "Submission rejected.", type: "success" });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to validate", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAiValidate = async (submissionId: string) => {
    if (!userId) return;

    // Need the files first — load them if not cached
    let files = itemsMap[submissionId];
    if (!files) {
      try {
        setLoadingItems(submissionId);
        const supabase = createClient();
        const { data: items, error } = await supabase.rpc("agent_get_submission_items", {
          p_agent_id: userId,
          p_submission_id: submissionId,
        });
        if (error) throw error;
        files = (items as DataItemRow[]) || [];
        setItemsMap((prev) => ({ ...prev, [submissionId]: files }));
      } catch (err: any) {
        setToast({ message: "Failed to load files for validation", type: "error" });
        return;
      } finally {
        setLoadingItems(null);
      }
    }

    if (files.length === 0) {
      setToast({ message: "No files to validate", type: "error" });
      return;
    }

    setValidatingId(submissionId);
    try {
      const res = await fetch("/api/validate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({
            id: f.id,
            file_url: f.file_url,
            file_type: f.file_type,
            file_name: f.file_name,
            file_size: f.file_size,
          })),
        }),
      });

      if (!res.ok) throw new Error("AI validation request failed");

      const result: AiValidationResult = await res.json();
      setAiResults((prev) => ({ ...prev, [submissionId]: result }));

      if (result.has_ai_content) {
        // Auto-reject if AI content detected
        const supabase = createClient();
        await supabase.rpc("agent_validate_submission", {
          p_agent_id: userId,
          p_submission_id: submissionId,
          p_status: "rejected",
          p_score: 0,
        });
        setToast({ message: "AI-generated content detected — submission auto-rejected", type: "error" });
        fetchData();
      } else {
        setToast({ message: "Validation passed — no AI-generated content detected", type: "success" });
      }

      // Expand to show detail
      setExpandedId(submissionId);
    } catch (err: any) {
      setToast({ message: err.message || "AI validation failed", type: "error" });
    } finally {
      setValidatingId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const pendingCount = data?.pendingCount ?? 0;
  const validatedToday = data?.validatedToday ?? 0;
  const totalValidations = data?.totalValidations ?? 0;
  const accuracyScore = Number(data?.accuracyScore ?? 0);
  const submissions = data?.submissions ?? [];

  return (
    <>
      {toast && (
        <ToastNotification message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-base font-semibold">Agent Dashboard</h1>
            <p className="text-[10px] text-muted-foreground">
              Review and validate submitted data
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="h-6 text-[10px] px-2" disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Validated Today</CardTitle>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">{validatedToday}</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>Today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Validations</CardTitle>
                <FileCheck className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">{totalValidations.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
                <AlertCircle className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">{accuracyScore.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Validation accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold">All Submissions</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="validated" className="text-xs">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium">
                  {statusFilter === "pending" ? "All caught up!" : "No submissions found"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statusFilter === "pending" ? "No pending submissions to review" : "Try a different filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Collector</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Project</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Category</th>
                      <th className="text-center py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Files</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-2.5 px-3 text-[11px] font-medium text-muted-foreground">AI Check</th>
                      <th className="text-center py-2.5 px-3 text-[11px] font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => {
                      const isExpanded = expandedId === sub.id;
                      const items = itemsMap[sub.id];
                      const isLoadingFiles = loadingItems === sub.id;
                      const isProcessing = processingId === sub.id;
                      const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                      const notes = sub.metadata?.notes || null;

                      return (
                        <React.Fragment key={sub.id}>
                          <tr
                            onClick={() => toggleExpand(sub.id)}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarImage src={sub.collector_avatar || ""} />
                                  <AvatarFallback className="text-[9px] bg-cyan-500 text-white">
                                    {getInitials(sub.collector_name, sub.collector_email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[120px]">
                                    {sub.collector_name || "No name"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                    {sub.collector_email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-xs font-medium truncate max-w-[180px]">{sub.project_title}</p>
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant="outline" className="text-[9px]">{sub.project_category}</Badge>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-xs">{sub.files_count}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(sub.submitted_at)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant="secondary" className={`${cfg.color} text-[10px]`}>
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center">
                                {sub.status !== "pending" ? (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                ) : validatingId === sub.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                                ) : aiResults[sub.id] ? (
                                  aiResults[sub.id].overall_pass ? (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-[9px] gap-0.5">
                                      <ShieldCheck className="w-3 h-3" />
                                      Pass
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-red-500/20 text-red-600 text-[9px] gap-0.5">
                                      <ShieldAlert className="w-3 h-3" />
                                      AI Found
                                    </Badge>
                                  )
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px] px-2 gap-1"
                                    onClick={(e) => { e.stopPropagation(); handleAiValidate(sub.id); }}
                                    disabled={!!validatingId}
                                    title="Check for AI-generated content"
                                  >
                                    <ScanSearch className="w-3 h-3" />
                                    Validate
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1">
                                {sub.status === "pending" ? (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={(e) => { e.stopPropagation(); handleValidate(sub.id, true); }}
                                      disabled={isProcessing}
                                      title="Approve"
                                    >
                                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={(e) => { e.stopPropagation(); handleValidate(sub.id, false); }}
                                      disabled={isProcessing}
                                      title="Reject"
                                    >
                                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />}
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {sub.validator_name || "—"}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleExpand(sub.id); }}
                                  className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="View details"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                  {/* Notes */}
                                  {notes && (
                                    <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Collector Notes</p>
                                      <p className="text-xs">{notes}</p>
                                    </div>
                                  )}

                                  {/* Data items */}
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                      Submitted Files ({sub.files_count})
                                    </p>
                                    {isLoadingFiles ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : items && items.length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                        {items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                                          >
                                            {item.file_type === "image" ? (
                                              <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                  src={item.file_url}
                                                  alt={item.file_name}
                                                  className="w-full h-28 object-cover hover:opacity-80 transition-opacity"
                                                />
                                              </a>
                                            ) : (
                                              <div className="w-full h-28 flex items-center justify-center bg-gray-100 dark:bg-gray-700/50">
                                                {getFileIcon(item.file_type)}
                                              </div>
                                            )}
                                            <div className="p-1.5">
                                              <p className="text-[9px] font-medium truncate" title={item.file_name}>
                                                {item.file_name}
                                              </p>
                                              <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[8px] text-muted-foreground">
                                                  {formatFileSize(item.file_size)}
                                                </span>
                                                <a
                                                  href={item.file_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-cyan-600 hover:text-cyan-500"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : items && items.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-3">No files found</p>
                                    ) : null}
                                  </div>

                                  {/* AI Validation Results */}
                                  {aiResults[sub.id] && (
                                    <div className={`rounded-md p-3 border ${
                                      aiResults[sub.id].overall_pass
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    }`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        {aiResults[sub.id].overall_pass ? (
                                          <ShieldCheck className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-600" />
                                        )}
                                        <p className={`text-xs font-semibold ${
                                          aiResults[sub.id].overall_pass ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                                        }`}>
                                          {aiResults[sub.id].overall_pass
                                            ? "AI Check Passed — No AI-generated content detected"
                                            : "AI Check Failed — AI-generated content detected"}
                                        </p>
                                      </div>
                                      <div className="space-y-1.5">
                                        {aiResults[sub.id].files.map((fr) => (
                                          <div key={fr.id} className="flex items-start gap-2 text-[10px]">
                                            {fr.is_ai_generated ? (
                                              <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div>
                                              <span className="font-medium">{fr.file_name}</span>
                                              {fr.confidence > 0 && (
                                                <span className="text-muted-foreground ml-1">
                                                  ({fr.confidence}% confidence)
                                                </span>
                                              )}
                                              <ul className="mt-0.5 text-muted-foreground list-disc list-inside">
                                                {fr.reasons.map((r, i) => (
                                                  <li key={i}>{r}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Validation info for reviewed submissions */}
                                  {sub.status !== "pending" && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {sub.status === "validated" ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                                      )}
                                      <span>
                                        {sub.status === "validated" ? "Approved" : "Rejected"}
                                        {sub.validator_name ? ` by ${sub.validator_name}` : ""}
                                        {sub.validated_at
                                          ? ` on ${new Date(sub.validated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
