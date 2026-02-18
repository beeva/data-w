"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignmentByToken } from "@/lib/services/proposalService";
import { getProjectById } from "@/lib/services/projectService";
import {
  getSubmissionsByProject,
  getDataItemsBySubmission,
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
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [toast, setToast] = useState<SubmissionToast | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setError("Invalid submission link");
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Please log in to access this submission link.");
      setLoading(false);
      return;
    }

    fetchAssignment();
  }, [token, authLoading, user]);

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
    if (project && user) {
      fetchSubmissions();
    }
  }, [project, user, fetchSubmissions]);

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
      <div className="max-w-4xl mx-auto p-4 space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
              Submission Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

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
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-border">
                                        <TableHead className="text-xs">Type</TableHead>
                                        <TableHead className="text-xs">File Name</TableHead>
                                        <TableHead className="text-xs">Size</TableHead>
                                        <TableHead className="text-xs">Uploaded</TableHead>
                                        <TableHead className="text-xs w-[60px]"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {items.map((item) => (
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
                                      ))}
                                    </TableBody>
                                  </Table>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
