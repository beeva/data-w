"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createSubmission,
  uploadSubmissionFile,
  createDataItem,
  validateLocalFilesWithAi,
  persistAutoValidationResult,
  getFileTypeFromMime,
} from "@/lib/services/submissionService";
import { createNotification } from "@/lib/services/notificationService";
import type { Project, CollectorAssignment } from "@/types";
import type { SubmissionMetadata } from "@/types/submission";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface SubmissionToast {
  title?: string;
  message: string;
  type: "success" | "error";
}

interface SubmissionDialogProps {
  project: Project;
  assignment: CollectorAssignment;
  onSuccess?: () => void;
  onToast?: (toast: SubmissionToast) => void;
  trigger?: React.ReactNode;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 20;
const DEFAULT_ACCEPT_TYPES =
  "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.txt";

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((kw) => value.includes(kw));
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="w-5 h-5 text-blue-400" />;
  if (mimeType.startsWith("video/"))
    return <Film className="w-5 h-5 text-purple-400" />;
  if (mimeType.startsWith("audio/"))
    return <Music className="w-5 h-5 text-green-400" />;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return <FileText className="w-5 h-5 text-red-400" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function SubmissionDialog({
  project,
  assignment,
  onSuccess,
  onToast,
  trigger,
}: SubmissionDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [autoValidationPassed, setAutoValidationPassed] = useState<boolean | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const requiredDataTypes = useMemo(
    () => (project.requirements?.data_types || []).map((d) => d.toLowerCase()),
    [project.requirements?.data_types],
  );
  const requiredFormats = useMemo(
    () => (project.requirements?.formats || []).map((f) => f.toLowerCase()),
    [project.requirements?.formats],
  );

  const allowsOtherType = requiredDataTypes.some((d) => d.includes("other"));
  const allowsOtherFormat = requiredFormats.some((f) => f.includes("other"));

  const acceptTypes = useMemo(() => {
    if (allowsOtherType || allowsOtherFormat) return DEFAULT_ACCEPT_TYPES;

    const accepts = new Set<string>();

    if (requiredFormats.length > 0) {
      // Specific formats defined — use only those exact extensions
      requiredFormats.forEach((format) => {
        if (format.includes("jpeg") || format.includes("jpg")) {
          accepts.add(".jpg");
          accepts.add(".jpeg");
        }
        if (format.includes("png")) accepts.add(".png");
        if (format.includes("gif")) accepts.add(".gif");
        if (format.includes("webp")) accepts.add(".webp");
        if (format.includes("mp4")) accepts.add(".mp4");
        if (format.includes("mov")) accepts.add(".mov");
        if (format.includes("avi")) accepts.add(".avi");
        if (format.includes("mkv")) accepts.add(".mkv");
        if (format.includes("webm")) accepts.add(".webm");
        if (format.includes("mp3")) accepts.add(".mp3");
        if (format.includes("wav")) accepts.add(".wav");
        if (format.includes("aac")) accepts.add(".aac");
        if (format.includes("m4a")) accepts.add(".m4a");
        if (format.includes("pdf")) accepts.add(".pdf");
        if (format.includes("csv")) accepts.add(".csv");
        if (format.includes("json")) accepts.add(".json");
        if (format.includes("xml")) accepts.add(".xml");
        if (format.includes("txt")) accepts.add(".txt");
        if (format.includes("doc") && !format.includes("docx"))
          accepts.add(".doc");
        if (format.includes("docx")) accepts.add(".docx");
        if (format.includes("xls") && !format.includes("xlsx"))
          accepts.add(".xls");
        if (format.includes("xlsx")) accepts.add(".xlsx");
      });
    } else {
      // No specific formats — fall back to broad MIME types by data type
      requiredDataTypes.forEach((type) => {
        if (includesAny(type, ["image", "photo"])) accepts.add("image/*");
        if (type.includes("video")) accepts.add("video/*");
        if (type.includes("audio")) accepts.add("audio/*");
        if (includesAny(type, ["text", "document"]))
          accepts.add(".txt,.pdf,.doc,.docx");
        if (type.includes("spreadsheet")) accepts.add(".csv,.xls,.xlsx");
        if (includesAny(type, ["gps", "sensor"]))
          accepts.add(".csv,.json,.xml,.txt");
      });
    }

    const value = Array.from(accepts).join(",");
    return value || DEFAULT_ACCEPT_TYPES;
  }, [requiredDataTypes, requiredFormats, allowsOtherType, allowsOtherFormat]);

  const matchesRequiredDataType = useCallback(
    (file: File) => {
      if (requiredDataTypes.length === 0 || allowsOtherType) return true;

      const mime = file.type.toLowerCase();
      const ext = getFileExtension(file.name);

      return requiredDataTypes.some((type) => {
        if (includesAny(type, ["image", "photo"])) {
          return (
            mime.startsWith("image/") ||
            includesAny(ext, ["jpg", "jpeg", "png", "webp", "gif"])
          );
        }
        if (type.includes("video")) {
          return (
            mime.startsWith("video/") ||
            includesAny(ext, ["mp4", "mov", "avi", "mkv", "webm"])
          );
        }
        if (type.includes("audio")) {
          return (
            mime.startsWith("audio/") ||
            includesAny(ext, ["mp3", "wav", "aac", "ogg", "m4a"])
          );
        }
        if (includesAny(type, ["text", "document"])) {
          return (
            mime.startsWith("text/") ||
            includesAny(mime, ["pdf", "word", "document"]) ||
            includesAny(ext, ["txt", "pdf", "doc", "docx", "rtf"])
          );
        }
        if (type.includes("spreadsheet")) {
          return (
            includesAny(mime, ["spreadsheet", "excel", "csv"]) ||
            includesAny(ext, ["csv", "xls", "xlsx"])
          );
        }
        if (includesAny(type, ["gps", "sensor"])) {
          return includesAny(ext, ["csv", "json", "xml", "txt"]);
        }
        return false;
      });
    },
    [requiredDataTypes, allowsOtherType],
  );

  const matchesRequiredFormat = useCallback(
    (file: File) => {
      if (requiredFormats.length === 0 || allowsOtherFormat) return true;

      const mime = file.type.toLowerCase();
      const ext = getFileExtension(file.name);

      return requiredFormats.some((format) => {
        if (includesAny(format, ["jpeg", "jpg"]))
          return includesAny(ext, ["jpg", "jpeg"]) || mime === "image/jpeg";
        if (format.includes("png"))
          return ext === "png" || mime === "image/png";
        if (format.includes("mp4"))
          return ext === "mp4" || mime === "video/mp4";
        if (format.includes("pdf"))
          return ext === "pdf" || mime === "application/pdf";
        if (format.includes("csv"))
          return ext === "csv" || mime.includes("csv");
        if (format.includes("json"))
          return ext === "json" || mime.includes("json");
        if (format.includes("xml"))
          return ext === "xml" || mime.includes("xml");
        return false;
      });
    },
    [requiredFormats, allowsOtherFormat],
  );

  const resetForm = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setNotes("");
    setError("");
    setSubmitting(false);
    setUploadProgress(0);
    setUploadStatus("");
    setSubmitted(false);
    setAutoValidationPassed(null);
    setIsDragOver(false);
  }, [files]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        if (files.length + validFiles.length >= MAX_FILES) {
          errors.push(`Maximum ${MAX_FILES} files allowed.`);
          break;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`"${file.name}" exceeds 50MB limit.`);
          continue;
        }
        if (!matchesRequiredDataType(file) || !matchesRequiredFormat(file)) {
          errors.push(
            `"${file.name}" does not match this project's required data type/format.`,
          );
          continue;
        }
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        validFiles.push({
          file,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          preview,
        });
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files.length, matchesRequiredDataType, matchesRequiredFormat],
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to submit.");
      return;
    }
    if (files.length === 0) {
      setError("Please add at least one file to submit.");
      return;
    }

    setError("");
    setSubmitting(true);
    setUploadProgress(0);
    setUploadStatus("Running AI validation...");

    try {
      const { data: preValidationData, error: preValidationError } =
        await validateLocalFilesWithAi(files.map((f) => f.file));

      if (preValidationError || !preValidationData) {
        throw new Error(
          preValidationError?.message || "AI validation request failed",
        );
      }

      if (!preValidationData.overall_pass) {
        const detectedFiles = preValidationData.files
          .filter((file) => file.is_ai_generated)
          .map((file) => file.file_name);

        const detail =
          detectedFiles.length > 0
            ? `Detected AI-generated content in: ${detectedFiles.join(", ")}.`
            : "Detected AI-generated content in submitted files.";

        throw new Error(`AI validation failed. ${detail}`);
      }

      setUploadStatus("Creating submission...");
      const metadata: SubmissionMetadata = {
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        device_info: navigator.userAgent,
      };

      const { data: submission, error: submissionError } =
        await createSubmission(assignment.request_id, user.id, metadata);

      if (submissionError || !submission) {
        throw new Error(
          submissionError?.message || "Failed to create submission",
        );
      }

      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const fileItem of files) {
        setUploadStatus(
          `Uploading ${fileItem.file.name}... (${uploadedCount + 1}/${totalFiles})`,
        );

        const { url, error: uploadError } = await uploadSubmissionFile(
          user.id,
          submission.id,
          fileItem.file,
        );

        if (uploadError || !url) {
          throw new Error(
            uploadError?.message || `Failed to upload ${fileItem.file.name}`,
          );
        }

        const fileType = getFileTypeFromMime(fileItem.file.type);

        const { error: dataItemError } = await createDataItem(
          submission.id,
          url,
          fileItem.file.name,
          fileType,
          fileItem.file.size,
          fileItem.file.type,
        );

        if (dataItemError) {
          throw new Error(
            dataItemError.message ||
              `Failed to save record for ${fileItem.file.name}`,
          );
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      const { error: persistValidationError } = await persistAutoValidationResult(
        submission.id,
        true,
      );

      if (persistValidationError) {
        throw new Error(
          persistValidationError.message || "Failed to persist validation status",
        );
      }

      setAutoValidationPassed(true);
      setUploadStatus("Submission verified successfully!");
      setSubmitted(true);

      await createNotification({
        userId: project.requester_id,
        type: "submission_created",
        title: "New Submission Received",
        body: `A collector has submitted ${files.length} file${files.length > 1 ? "s" : ""} for "${project.title}".`,
        metadata: {
          project_id: project.id,
          submission_id: submission.id,
          collector_id: user.id,
          file_count: files.length,
        },
      });

      onToast?.({
        message: `Successfully validated and submitted ${files.length} file${files.length > 1 ? "s" : ""}.`,
        type: "success",
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
      onToast?.({
        message: err.message || "Submission failed. Please try again.",
        type: "error",
      });
      setSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !submitting) {
      resetForm();
    }
    if (!submitting) {
      setOpen(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Start Submission
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 w-full">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight">
                Submission Successful!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {autoValidationPassed
                  ? "Your data has been submitted and automatically verified."
                  : "Your submission was automatically rejected by verification checks."}
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-semibold leading-tight">
                  Submit Data
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5 truncate">
                  {project.title}
                </DialogDescription>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5 w-full overflow-hidden">
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 w-full overflow-hidden">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 break-words min-w-0">
                    {error}
                  </p>
                </div>
              )}

              {/* Drop Zone with Requirements */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer select-none
                  transition-all duration-200
                  ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }
                  ${submitting ? "pointer-events-none opacity-50" : ""}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !submitting && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={acceptTypes}
                />
                <div className="p-8 text-center space-y-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-colors duration-200 ${
                      isDragOver ? "bg-primary/15" : "bg-muted"
                    }`}
                  >
                    <Upload
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isDragOver ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isDragOver
                        ? "Release to add files"
                        : "Drop files here or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Up to {MAX_FILES} files · 50 MB each
                    </p>
                  </div>
                </div>
                {(project.requirements.data_types.length > 0 ||
                  project.requirements.formats.length > 0) && (
                  <div className="border-t border-dashed border-border px-4 py-3 bg-muted/30 space-y-2">
                    {project.requirements.data_types.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground shrink-0 w-12">
                          Types
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {project.requirements.data_types.map((type) => (
                            <span
                              key={type}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.requirements.formats.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground shrink-0 w-12">
                          Formats
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {project.requirements.formats.map((fmt) => (
                            <span
                              key={fmt}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium"
                            >
                              {fmt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Files{" "}
                      <span className="text-muted-foreground font-normal">
                        ({files.length}/{MAX_FILES})
                      </span>
                    </p>
                    {!submitting && (
                      <button
                        onClick={() => {
                          files.forEach((f) => {
                            if (f.preview) URL.revokeObjectURL(f.preview);
                          });
                          setFiles([]);
                        }}
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {files.map((fileItem) => (
                      <div
                        key={fileItem.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/60 group hover:bg-muted/70 transition-colors w-full min-w-0"
                      >
                        <div className="shrink-0">
                          {fileItem.preview ? (
                            <img
                              src={fileItem.preview}
                              alt={fileItem.file.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                              {getFileIcon(fileItem.file.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-sm font-medium truncate leading-tight">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                        {!submitting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(fileItem.id);
                            }}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="submission-notes" className="text-sm">
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="submission-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about your data collection (conditions, equipment used, etc.)..."
                  rows={3}
                  disabled={submitting}
                  className="resize-none text-sm [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
                />
              </div>

              {/* Upload Progress */}
              {submitting && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {uploadStatus}
                    </p>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Uploading files…
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      {uploadProgress}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 px-6 pb-6 pt-1 mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || files.length === 0}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {files.length > 0
                      ? `Submit (${files.length} ${files.length === 1 ? "file" : "files"})`
                      : "Submit"}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
