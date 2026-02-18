"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createSubmission,
  uploadSubmissionFile,
  createDataItem,
  getFileTypeFromMime,
} from "@/lib/services/submissionService";
import type { Project, CollectorAssignment } from "@/types";
import type { SubmissionMetadata } from "@/types/submission";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [isDragOver, setIsDragOver] = useState(false);

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
    [files.length]
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
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
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
    setUploadStatus("Creating submission...");

    try {
      const metadata: SubmissionMetadata = {
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        device_info: navigator.userAgent,
      };

      const { data: submission, error: submissionError } =
        await createSubmission(assignment.request_id, user.id, metadata);

      if (submissionError || !submission) {
        throw new Error(
          submissionError?.message || "Failed to create submission"
        );
      }

      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const fileItem of files) {
        setUploadStatus(
          `Uploading ${fileItem.file.name}... (${uploadedCount + 1}/${totalFiles})`
        );

        const { url, error: uploadError } = await uploadSubmissionFile(
          user.id,
          submission.id,
          fileItem.file
        );

        if (uploadError || !url) {
          throw new Error(
            uploadError?.message || `Failed to upload ${fileItem.file.name}`
          );
        }

        const fileType = getFileTypeFromMime(fileItem.file.type);

        const { error: dataItemError } = await createDataItem(
          submission.id,
          url,
          fileItem.file.name,
          fileType,
          fileItem.file.size,
          fileItem.file.type
        );

        if (dataItemError) {
          throw new Error(
            dataItemError.message ||
              `Failed to save record for ${fileItem.file.name}`
          );
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      setUploadStatus("Submission complete!");
      setSubmitted(true);
      onToast?.({ message: `Successfully submitted ${files.length} file${files.length > 1 ? "s" : ""}!`, type: "success" });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
      onToast?.({ message: err.message || "Submission failed. Please try again.", type: "error" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">Submission Successful!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your data has been submitted for review. You will be notified
                once the requester validates your submission.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit Data for {project.title}</DialogTitle>
              <DialogDescription>
                Upload your collected data files and add any notes about your
                submission.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !submitting && fileInputRef.current?.click()
                }
                className={`
                  relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                  transition-all duration-200
                  ${
                    isDragOver
                      ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                      : "border-border hover:border-muted-foreground hover:bg-muted"
                  }
                  ${submitting ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.txt"
                />
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Upload
                      className={`w-5 h-5 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isDragOver
                        ? "Drop files here"
                        : "Drag & drop files here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse. Max {MAX_FILES} files, 50MB each.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {["Images", "Videos", "Audio", "PDFs", "Documents"].map(
                      (type) => (
                        <span
                          key={type}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {type}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Files ({files.length}/{MAX_FILES})
                    </Label>
                    {!submitting && (
                      <button
                        onClick={() => {
                          files.forEach((f) => {
                            if (f.preview) URL.revokeObjectURL(f.preview);
                          });
                          setFiles([]);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove All
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {files.map((fileItem) => (
                      <div
                        key={fileItem.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border group"
                      >
                        {fileItem.preview ? (
                          <img
                            src={fileItem.preview}
                            alt={fileItem.file.name}
                            className="w-9 h-9 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                            {getFileIcon(fileItem.file.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                        {!submitting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(fileItem.id);
                            }}
                            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="submission-notes">Notes (Optional)</Label>
                <Textarea
                  id="submission-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your data collection (conditions, equipment used, etc.)..."
                  rows={3}
                  disabled={submitting}
                  className="resize-none"
                />
              </div>

              {/* Upload Progress */}
              {submitting && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <p className="text-sm font-medium">{uploadStatus}</p>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit ({files.length}{" "}
                      {files.length === 1 ? "file" : "files"})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
