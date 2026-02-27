"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById } from "@/lib/services/projectService";
import {
  getSubmissionsByProject,
  getProjectStats,
  getDataItemsBySubmission,
  updateSubmissionStatus,
} from "@/lib/services/submissionService";
import { creditCollector } from "@/lib/services/walletService";
import type { Project } from "@/types/project";
import type {
  SubmissionWithCollector,
  DataItem,
  ProjectStats,
} from "@/types/submission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileCheck,
  FileX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Loader2,
  RefreshCw,
  TrendingUp,
  Calendar,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  File,
} from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";
import ProjectProposals from "./ProjectProposals";

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "image":
      return <ImageIcon className="w-3.5 h-3.5 text-blue-400" />;
    case "video":
      return <Film className="w-3.5 h-3.5 text-purple-400" />;
    case "audio":
      return <Music className="w-3.5 h-3.5 text-green-400" />;
    case "document":
      return <FileText className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <File className="w-3.5 h-3.5 text-gray-400" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface ProjectWorkshopProps {
  projectId: string;
}

export default function ProjectWorkshop({ projectId }: ProjectWorkshopProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithCollector[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [dataItemsMap, setDataItemsMap] = useState<Record<string, DataItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const toggleCollector = (collectorId: string) => {
    setExpandedCollector((prev) => (prev === collectorId ? null : collectorId));
    setExpandedSubmission(null);
  };

  const toggleSubmissionFiles = async (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
      return;
    }
    setExpandedSubmission(submissionId);
    if (!dataItemsMap[submissionId]) {
      try {
        setLoadingItems(submissionId);
        const { data, error: itemsError } = await getDataItemsBySubmission(submissionId);
        if (itemsError) throw itemsError;
        setDataItemsMap((prev) => ({ ...prev, [submissionId]: data || [] }));
      } catch (err: any) {
        console.error("Error fetching data items:", err);
      } finally {
        setLoadingItems(null);
      }
    }
  };

  const groupByCollector = (subs: SubmissionWithCollector[]) => {
    const groups: Record<string, { collector: SubmissionWithCollector["collector"]; submissions: SubmissionWithCollector[] }> = {};
    for (const sub of subs) {
      const cid = sub.collector_id;
      if (!groups[cid]) {
        groups[cid] = { collector: sub.collector, submissions: [] };
      }
      groups[cid].submissions.push(sub);
    }
    return Object.entries(groups).map(([collectorId, group]) => ({
      collectorId,
      ...group,
    }));
  };

  const fetchData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      // Fetch project, submissions, and stats in parallel
      const [projectResult, submissionsResult, statsResult] = await Promise.all(
        [
          getProjectById(projectId),
          getSubmissionsByProject(projectId),
          getProjectStats(projectId),
        ]
      );

      if (projectResult.error) throw projectResult.error;
      if (submissionsResult.error) throw submissionsResult.error;
      if (statsResult.error) throw statsResult.error;

      setProject(projectResult.data);
      setSubmissions(submissionsResult.data || []);
      setStats(statsResult.data);
    } catch (err: any) {
      setError(err.message || "Failed to load workshop data");
      console.error("Error fetching workshop data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleValidate = async (submissionId: string, approve: boolean) => {
    if (!user) return;

    try {
      setProcessingId(submissionId);
      const status = approve ? "validated" : "rejected";
      const score = approve ? 100 : 0;

      const { error: updateError } = await updateSubmissionStatus(
        submissionId,
        status,
        user.id,
        score
      );

      if (updateError) throw updateError;

      if (approve && project) {
        const submission = submissions.find((s) => s.id === submissionId);
        if (submission) {
          const { error: txError } = await creditCollector(
            user.id,
            submission.collector_id,
            submissionId,
            project.budget
          );
          if (txError) {
            setToast({
              message: txError.message,
              type: "error",
            });
            setProcessingId(null);
            return;
          }
        }
      }

      setToast({
        message: approve
          ? "Submission approved and collector paid!"
          : "Submission rejected.",
        type: "success",
      });

      await fetchData();
    } catch (err: any) {
      console.error("Error updating submission:", err);
      setToast({
        message: err.message || "Failed to update submission status.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 text-[9px] px-1.5 py-0">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            Pending
          </Badge>
        );
      case "validated":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-[9px] px-1.5 py-0">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Validated
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-600 text-[9px] px-1.5 py-0">
            <XCircle className="w-2.5 h-2.5 mr-0.5" />
            Rejected
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 text-[9px] px-1.5 py-0">
            <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-6 px-4">
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold mb-1">Project not found</h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                The project doesn&apos;t exist or you don&apos;t have access.
              </p>
              <Button size="sm" className="h-7 text-xs" onClick={() => window.history.back()}>
                <ArrowLeft className="w-3 h-3 mr-1" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = stats
    ? Math.round(
        ((stats.validated_submissions + stats.rejected_submissions) /
          Math.max(stats.total_submissions, 1)) *
          100
      )
    : 0;

  return (
    <div className="space-y-3 p-4">
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 h-6 text-[10px] px-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{project.title}</h1>
          <p className="text-[11px] text-muted-foreground">Project Workshop</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="h-7 text-xs px-2">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[11px]">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold">
                  {stats?.total_submissions || 0}
                </p>
              </div>
              <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-lg font-bold text-yellow-600">
                  {stats?.pending_submissions || 0}
                </p>
              </div>
              <div className="w-7 h-7 rounded-md bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Validated</p>
                <p className="text-lg font-bold text-green-600">
                  {stats?.validated_submissions || 0}
                </p>
              </div>
              <div className="w-7 h-7 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rejected</p>
                <p className="text-lg font-bold text-red-600">
                  {stats?.rejected_submissions || 0}
                </p>
              </div>
              <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FileX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2.5 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Score</p>
                <p className="text-lg font-bold text-cyan-600">
                  {stats?.average_validation_score != null
                    ? `${stats.average_validation_score}%`
                    : "N/A"}
                </p>
              </div>
              <div className="w-7 h-7 rounded-md bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Review Completion</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              <div className="text-center">
                <p className="text-base font-bold text-green-600">
                  {stats?.validated_submissions || 0}
                </p>
                <p className="text-[9px] text-muted-foreground">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-yellow-600">
                  {stats?.pending_submissions || 0}
                </p>
                <p className="text-[9px] text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-red-600">
                  {stats?.rejected_submissions || 0}
                </p>
                <p className="text-[9px] text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xs font-semibold">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-semibold">${project.budget.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-semibold">{formatDate(project.deadline)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Max Collectors:</span>
              <span className="font-semibold">{project.max_collectors}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Tabs */}
      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-2 h-8">
          <TabsTrigger value="proposals" className="text-[10px] h-7">
            <Briefcase className="w-3 h-3 mr-1" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="all" className="text-[10px] h-7">
            All ({stats?.total_submissions || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-[10px] h-7">
            Pending ({stats?.pending_submissions || 0})
          </TabsTrigger>
          <TabsTrigger value="validated" className="text-[10px] h-7">
            Validated ({stats?.validated_submissions || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-[10px] h-7">
            Rejected ({stats?.rejected_submissions || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-2">
          <ProjectProposals projectId={projectId} />
        </TabsContent>

        {["all", "pending", "validated", "rejected"].map((tabValue) => {
          const filtered = submissions.filter(
            (s) => tabValue === "all" || s.status === tabValue
          );
          const collectorGroups = groupByCollector(filtered);

          return (
            <TabsContent key={tabValue} value={tabValue}>
              {filtered.length === 0 ? (
                <Card className="dark:bg-gray-800/50 border-none">
                  <CardContent className="py-6 px-4">
                    <div className="text-center py-4">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <h3 className="text-sm font-semibold mb-1">
                        {submissions.length === 0
                          ? "No submissions yet"
                          : `No ${tabValue} submissions`}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Submissions from collectors will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {collectorGroups.map((group) => {
                    const isCollectorExpanded = expandedCollector === group.collectorId;
                    const pendingCount = group.submissions.filter((s) => s.status === "pending").length;
                    const validatedCount = group.submissions.filter((s) => s.status === "validated").length;
                    const rejectedCount = group.submissions.filter((s) => s.status === "rejected").length;

                    return (
                      <Card key={group.collectorId} className="dark:bg-gray-800/50 border-none overflow-hidden">
                        {/* Collector Header Row */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
                          onClick={() => toggleCollector(group.collectorId)}
                        >
                          <div className="text-muted-foreground">
                            {isCollectorExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={group.collector?.avatar_url || ""} />
                            <AvatarFallback className="bg-cyan-500 text-white text-xs">
                              {group.collector?.full_name?.charAt(0) ||
                                group.collector?.email?.charAt(0) ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">
                              {group.collector?.full_name || group.collector?.email || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {group.collector?.rating != null && (
                                <span className="text-[10px] text-muted-foreground">
                                  Rating: {group.collector.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {group.submissions.length} submission{group.submissions.length !== 1 ? "s" : ""}
                            </Badge>
                            {pendingCount > 0 && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 text-[9px] px-1.5 py-0">
                                {pendingCount} pending
                              </Badge>
                            )}
                            {validatedCount > 0 && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-[9px] px-1.5 py-0">
                                {validatedCount} approved
                              </Badge>
                            )}
                            {rejectedCount > 0 && (
                              <Badge variant="secondary" className="bg-red-500/20 text-red-600 text-[9px] px-1.5 py-0">
                                {rejectedCount} rejected
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Expanded: Submissions table for this collector */}
                        {isCollectorExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700/50 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800/30">
                                  <TableHead className="w-[32px] pl-4"></TableHead>
                                  <TableHead className="text-[11px]">Submitted</TableHead>
                                  <TableHead className="text-[11px]">Status</TableHead>
                                  <TableHead className="text-[11px]">Score</TableHead>
                                  <TableHead className="text-[11px]">Notes</TableHead>
                                  <TableHead className="text-[11px] text-right pr-4">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.submissions.map((submission) => {
                                  const isSubExpanded = expandedSubmission === submission.id;
                                  const items = dataItemsMap[submission.id];
                                  const isLoadingFiles = loadingItems === submission.id;
                                  const notes = (submission.metadata as any)?.notes || "-";

                                  return (
                                    <React.Fragment key={submission.id}>
                                      <TableRow
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20"
                                        onClick={() => toggleSubmissionFiles(submission.id)}
                                      >
                                        <TableCell className="pl-4">
                                          {isSubExpanded ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                          )}
                                        </TableCell>
                                        <TableCell className="text-[11px] text-muted-foreground">
                                          {formatDate(submission.submitted_at)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                        <TableCell className="text-[11px]">
                                          {submission.validation_score !== null
                                            ? `${submission.validation_score}%`
                                            : "-"}
                                        </TableCell>
                                        <TableCell className="text-[11px] text-muted-foreground max-w-[150px] truncate">
                                          {notes}
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                          {submission.status === "pending" && submission.agent_validated && (
                                            <div className="flex flex-wrap gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                              <Button
                                                size="sm"
                                                className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700"
                                                onClick={() => handleValidate(submission.id, true)}
                                                disabled={processingId === submission.id}
                                              >
                                                {processingId === submission.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                                )}
                                                Approve
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => handleValidate(submission.id, false)}
                                                disabled={processingId === submission.id}
                                              >
                                                {processingId === submission.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <ThumbsDown className="w-3 h-3 mr-1" />
                                                )}
                                                Reject
                                              </Button>
                                            </div>
                                          )}
                                          {submission.status === "pending" && !submission.agent_validated && (
                                            <Badge variant="secondary" className="text-[9px] bg-yellow-500/15 text-yellow-600">
                                              <Clock className="w-3 h-3 mr-0.5" />
                                              Awaiting Validation
                                            </Badge>
                                          )}
                                          {submission.status !== "pending" && (
                                            <Badge variant="outline" className="text-[9px]">
                                              {submission.status === "validated" ? "Approved" : "Rejected"}
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>

                                      {/* Expanded: Files for this submission */}
                                      {isSubExpanded && (
                                        <TableRow>
                                          <TableCell colSpan={6} className="p-0">
                                            <div className="bg-gray-50 dark:bg-gray-900/40 px-6 py-3 border-t border-gray-200 dark:border-gray-700/50">
                                              <p className="text-[11px] font-semibold mb-2 flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Uploaded Files
                                              </p>
                                              {isLoadingFiles ? (
                                                <div className="flex items-center gap-2 py-3">
                                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                  <span className="text-[11px] text-muted-foreground">
                                                    Loading files...
                                                  </span>
                                                </div>
                                              ) : !items || items.length === 0 ? (
                                                <p className="text-[11px] text-muted-foreground py-2">
                                                  No files found for this submission.
                                                </p>
                                              ) : (
                                                <div className="rounded-md border border-gray-200 dark:border-gray-700/50 overflow-x-auto">
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow className="bg-gray-100 dark:bg-gray-800/50">
                                                        <TableHead className="text-[10px] h-7">Preview</TableHead>
                                                        <TableHead className="text-[10px] h-7">File Name</TableHead>
                                                        <TableHead className="text-[10px] h-7">Type</TableHead>
                                                        <TableHead className="text-[10px] h-7">Visibility</TableHead>
                                                        <TableHead className="text-[10px] h-7">Price</TableHead>
                                                        <TableHead className="text-[10px] h-7">Size</TableHead>
                                                        <TableHead className="text-[10px] h-7">Uploaded</TableHead>
                                                        <TableHead className="text-[10px] h-7 w-[60px]"></TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {items.map((item) => (
                                                        <TableRow key={item.id} className="border-gray-200 dark:border-gray-700/50">
                                                          <TableCell className="py-1.5">
                                                            {item.file_type === "image" ? (
                                                              <a
                                                                href={item.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                              >
                                                                <img
                                                                  src={item.file_url}
                                                                  alt={item.file_name}
                                                                  className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                                />
                                                              </a>
                                                            ) : (
                                                              <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                                                                {getFileIcon(item.file_type)}
                                                              </div>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-[11px] font-medium max-w-[180px] truncate">
                                                            {item.file_name}
                                                          </TableCell>
                                                          <TableCell>
                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">
                                                              {item.file_type}
                                                            </Badge>
                                                          </TableCell>
                                                          <TableCell>
                                                            {item.visibility ? (
                                                              <Badge
                                                                variant="outline"
                                                                className={
                                                                  item.visibility === "public"
                                                                    ? "text-[9px] px-1 py-0 border-green-500/40 text-green-600"
                                                                    : "text-[9px] px-1 py-0 border-orange-500/40 text-orange-600"
                                                                }
                                                              >
                                                                {item.visibility}
                                                              </Badge>
                                                            ) : (
                                                              <span className="text-[10px] text-muted-foreground">Not set</span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-[11px]">
                                                            {typeof item.price === "number" ? (
                                                              <span className="font-medium">${item.price.toFixed(2)}</span>
                                                            ) : (
                                                              <span className="text-muted-foreground">-</span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-[11px] text-muted-foreground">
                                                            {formatFileSize(item.file_size)}
                                                          </TableCell>
                                                          <TableCell className="text-[11px] text-muted-foreground">
                                                            {new Date(item.created_at).toLocaleString()}
                                                          </TableCell>
                                                          <TableCell>
                                                            <a
                                                              href={item.file_url}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="inline-flex items-center gap-1 text-[11px] text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
                                                            >
                                                              <ExternalLink className="w-3 h-3" />
                                                              View
                                                            </a>
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}
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
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
