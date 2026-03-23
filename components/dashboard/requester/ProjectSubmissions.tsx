"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubmissionsByProject,
  getDataItemsBySubmission,
  updateSubmissionStatus,
} from "@/lib/services/submissionService";
import type { SubmissionWithCollector, DataItem } from "@/types/submission";
import type { SubmissionStatus } from "@/types/submission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  FileAudio,
  FileVideo,
  File,
  Search,
  ExternalLink,
  Download,
  X,
  Calendar,
  Star,
  FileStack,
  LayoutList,
  LayoutGrid,
  Eye,
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ToastNotification from "@/components/ui/toast-notification";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";

interface ProjectSubmissionsProps {
  projectId: string;
  onPendingCountChange?: (count: number) => void;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null, fileType: string) {
  if (!mimeType) return <File className="w-5 h-5" />;
  if (mimeType.startsWith("image/")) return null; // handled as thumbnail
  if (mimeType.startsWith("video/")) return <FileVideo className="w-5 h-5" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

function isImage(item: DataItem) {
  return (
    item.mime_type?.startsWith("image/") ||
    item.file_type === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.file_name)
  );
}

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  validated: {
    label: "Validated",
    color:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    color: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  disputed: {
    label: "Disputed",
    color:
      "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
  },
};

function SubmissionRow({
  submission,
  onValidate,
  onReject,
  processing,
  viewMode = "list",
}: {
  submission: SubmissionWithCollector;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  processing: string | null;
  viewMode?: "list" | "grid";
}) {
  const [dataItems, setDataItems] = useState<DataItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const imageItems = useMemo(
    () => (dataItems ?? []).filter(isImage),
    [dataItems],
  );
  const showCarousel = Boolean(
    dataItems && dataItems.length > 2 && imageItems.length > 0,
  );
  const currentDisplayItem = showCarousel
    ? imageItems[carouselIndex]
    : (dataItems?.[0] ?? null);

  const statusMeta = STATUS_META[submission.status] ?? STATUS_META.pending;
  const collectorName =
    submission.collector?.full_name ||
    submission.collector?.email?.split("@")[0] ||
    "Collector";
  const collectorInitials = collectorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const collectorEmail = submission.collector?.email ?? null;

  const isProcessing = processing === submission.id;

  const isGrid = viewMode === "grid";
  const gridPreviewItem = dataItems?.[0] ?? null;
  useEffect(() => {
    if (!showCarousel || imageItems.length === 0) return;
    setCarouselIndex((i) => Math.min(i, imageItems.length - 1));
  }, [showCarousel, imageItems.length]);

  useEffect(() => {
    if (!showCarousel || imageItems.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((i) => (i >= imageItems.length - 1 ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [showCarousel, imageItems.length]);

  const gridFilesCount = dataItems?.length ?? 0;

  useEffect(() => {
    if (dataItems !== null) return;
    const fetchItems = async () => {
      setLoadingItems(true);
      const { data } = await getDataItemsBySubmission(submission.id);
      setDataItems(data ?? []);
      setLoadingItems(false);
    };
    fetchItems();
  }, [dataItems, submission.id]);

  const cardClassName = cn(
    "w-full text-left transition-colors rounded-t-xl flex",
    isGrid
      ? "flex-col items-stretch text-left p-0 gap-0"
      : "p-4 flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/50 dark:hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  );

  return (
    <li
      className={cn(
        "rounded-xl overflow-hidden h-full flex flex-col",
        isGrid && "min-h-0",
      )}
    >
      {/* Grid: use div so overlay buttons are not nested in a button */}
      {isGrid ? (
        <div className={cardClassName}>
          <>
            <div className="w-full relative h-[196px]">
              <div className="h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-muted/20 dark:bg-muted/10 flex items-center justify-center overflow-hidden shadow-inner relative group">
                {loadingItems ? (
                  <Skeleton className="w-full h-full rounded-2xl" />
                ) : showCarousel ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((i) =>
                          i <= 0 ? imageItems.length - 1 : i - 1,
                        );
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((i) =>
                          i >= imageItems.length - 1 ? 0 : i + 1,
                        );
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="relative w-full h-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxSrc(imageItems[carouselIndex].file_url);
                      }}
                    >
                      <div
                        key={carouselIndex}
                        className="absolute inset-0 flex items-center justify-center carousel-slide-in"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            imageItems[carouselIndex].thumbnail_url ??
                            imageItems[carouselIndex].file_url
                          }
                          alt={imageItems[carouselIndex].file_name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {imageItems.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-label={`Go to image ${i + 1}`}
                          className={cn(
                            "size-1.5 rounded-full transition-colors",
                            i === carouselIndex
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/70",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex(i);
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : gridPreviewItem ? (
                  isImage(gridPreviewItem) ? (
                    <button
                      type="button"
                      className="w-full h-full flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxSrc(gridPreviewItem.file_url);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          gridPreviewItem.thumbnail_url ??
                          gridPreviewItem.file_url
                        }
                        alt={gridPreviewItem.file_name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 max-w-full px-4 text-center">
                      <span className="text-primary shrink-0">
                        {getFileIcon(
                          gridPreviewItem.mime_type,
                          gridPreviewItem.file_type,
                        )}
                      </span>
                      <span className="text-xs font-semibold text-foreground max-w-[160px] truncate">
                        {gridPreviewItem.file_name}
                      </span>
                      {gridPreviewItem.file_size ? (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatFileSize(gridPreviewItem.file_size)}
                        </span>
                      ) : null}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
                    <div className="w-16 h-16 shrink-0">
                      <EmptyDataSvg />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No files attached
                    </p>
                  </div>
                )}

                {/* Hover overlay: preview, download, and files dropdown */}
                {!loadingItems && dataItems && dataItems.length > 0 && (
                  <div
                    className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentDisplayItem && (
                      <>
                        <button
                          type="button"
                          className="p-2.5 rounded-lg bg-white/90 dark:bg-white/20 text-foreground hover:bg-white shadow-sm transition-colors"
                          title="Preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isImage(currentDisplayItem))
                              setLightboxSrc(currentDisplayItem.file_url);
                            else
                              window.open(
                                currentDisplayItem.file_url,
                                "_blank",
                                "noopener,noreferrer",
                              );
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={currentDisplayItem.file_url}
                          download={currentDisplayItem.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-lg bg-white/90 dark:bg-white/20 text-foreground hover:bg-white shadow-sm transition-colors"
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    {dataItems.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2.5 rounded-lg bg-white/90 dark:bg-white/20 text-foreground hover:bg-white shadow-sm transition-colors"
                            title="All files"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          side="top"
                          className="max-h-[240px] overflow-y-auto w-56"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dataItems.map((item) => (
                            <DropdownMenuItem
                              key={item.id}
                              className="flex items-center justify-between gap-2 py-2 cursor-default focus:bg-accent"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <span className="text-xs font-medium truncate min-w-0 flex-1">
                                {item.file_name}
                              </span>
                              <div className="flex shrink-0 gap-0.5">
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Preview"
                                  onClick={() => {
                                    if (isImage(item))
                                      setLightboxSrc(item.file_url);
                                    else
                                      window.open(
                                        item.file_url,
                                        "_blank",
                                        "noopener,noreferrer",
                                      );
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={item.file_url}
                                  download={item.file_name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 py-3 w-full h-[56px] shrink-0">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0 rounded-full ring-1 ring-border/70">
                  <AvatarImage
                    src={submission.collector?.avatar_url || "/default-avatar.svg"}
                    alt={collectorName}
                  />
                  <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                    {collectorInitials}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground truncate">
                  {collectorName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 text-[10px] font-medium",
                    statusMeta.color,
                  )}
                >
                  <span
                    className={cn(
                      "size-1 rounded-full shrink-0",
                      statusMeta.dot,
                    )}
                  />
                  {statusMeta.label}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <FileStack className="w-3.5 h-3.5 shrink-0" />
                  {gridFilesCount > 0
                    ? `${gridFilesCount} file${gridFilesCount === 1 ? "" : "s"}`
                    : "No files"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Submission actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-48">
                    {submission.status === "pending" && submission.agent_validated && (
                      <>
                        <DropdownMenuItem
                          className="gap-2 text-emerald-600 dark:text-emerald-400"
                          onSelect={() => onValidate(submission.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Validate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          onSelect={() => onReject(submission.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {submission.status === "pending" && !submission.agent_validated && (
                      <DropdownMenuItem disabled className="text-amber-600 dark:text-amber-400">
                        Awaiting Validation
                      </DropdownMenuItem>
                    )}
                    {submission.status === "validated" && (
                      <DropdownMenuItem disabled className="text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Approved
                      </DropdownMenuItem>
                    )}
                    {submission.status === "rejected" && (
                      <DropdownMenuItem disabled className="text-red-600 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        Rejected
                      </DropdownMenuItem>
                    )}
                    {submission.status === "disputed" && (
                      <DropdownMenuItem disabled className="text-purple-600 dark:text-purple-400">
                        Disputed
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </>
        </div>
      ) : (
        <div className="grid grid-cols-6 items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
          {/* col1: avatar, name */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0 rounded-full ring-1 ring-border">
              <AvatarImage
                src={submission.collector?.avatar_url || "/default-avatar.svg"}
                alt={collectorName}
              />
              <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                {collectorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {collectorName}
              </p>
            </div>
          </div>

          {/* col2: submit file, note */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
              {loadingItems ? (
                <Skeleton className="w-full h-full rounded-none" />
              ) : dataItems && dataItems.length > 0 ? (
                (() => {
                  const first = dataItems[0];
                  if (isImage(first)) {
                    return (
                      <button
                        type="button"
                        className="w-full h-full flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg overflow-hidden"
                        onClick={() => setLightboxSrc(first.file_url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={first.thumbnail_url ?? first.file_url}
                          alt={first.file_name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  }
                  return (
                    <span className="text-muted-foreground p-1">
                      {getFileIcon(first.mime_type, first.file_type)}
                    </span>
                  );
                })()
              ) : (
                <FileStack className="w-4 h-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {submission.metadata?.notes ? (
                <p
                  className="text-xs text-muted-foreground italic truncate"
                  title={submission.metadata.notes}
                >
                  &ldquo;{submission.metadata.notes}&rdquo;
                </p>
              ) : (
                <span className="text-xs text-muted-foreground/50">—</span>
              )}
            </div>
          </div>

          {/* col3: submit file counts */}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <FileStack className="w-3.5 h-3.5 shrink-0" />
            {dataItems
              ? dataItems.length > 0
                ? `${dataItems.length} file${dataItems.length === 1 ? "" : "s"}`
                : "No files"
              : "—"}
          </span>

          {/* col4: status */}
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-[10px] font-medium w-fit",
              statusMeta.color,
            )}
          >
            <span
              className={cn("size-1 rounded-full shrink-0", statusMeta.dot)}
            />
            {statusMeta.label}
          </Badge>

          {/* col5: submitted_at */}
          <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs tabular-nums">
              {formatDate(submission.submitted_at)}
            </span>
          </div>

          {/* col6: actions */}
          <div className="flex gap-1.5 items-center justify-end">
            {submission.status === "pending" && submission.agent_validated && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-2"
                  onClick={() => onValidate(submission.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Validate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/15 hover:border-red-500/50 px-2"
                  onClick={() => onReject(submission.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Reject
                </Button>
              </>
            )}
            {submission.status === "pending" && !submission.agent_validated && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-medium border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Awaiting Validation
              </Badge>
            )}
            {submission.status === "validated" && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                Approved
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Full size preview"
            className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </li>
  );
}

export default function ProjectSubmissions({
  projectId,
  onPendingCountChange,
}: ProjectSubmissionsProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithCollector[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    title?: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "status">(
    "newest",
  );
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectSubmissionId, setRejectSubmissionId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const { data, error: fetchError } =
        await getSubmissionsByProject(projectId);
      if (fetchError) throw fetchError;
      const list = data ?? [];
      setSubmissions(list);
      const pendingCount = list.filter((s) => s.status === "pending").length;
      onPendingCountChange?.(pendingCount);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleValidate = async (submissionId: string) => {
    if (!user) return;
    try {
      setProcessing(submissionId);
      const { error: updateError } = await updateSubmissionStatus(
        submissionId,
        "validated",
        user.id,
      );
      if (updateError) throw updateError;
      setToast({
        title: "Submission validated",
        message: "The submission has been marked as validated.",
        type: "success",
      });
      await fetchData();
    } catch (err: any) {
      setToast({
        title: "Validation failed",
        message: err.message || "Failed to validate submission",
        type: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (submissionId: string) => {
    setRejectSubmissionId(submissionId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!user) return;
    if (!rejectSubmissionId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setToast({
        title: "Reason required",
        message: "Please enter a reason for rejecting this submission.",
        type: "error",
      });
      return;
    }
    try {
      setProcessing(rejectSubmissionId);
      const { error: updateError } = await updateSubmissionStatus(
        rejectSubmissionId,
        "rejected",
        user.id,
        undefined,
        reason,
      );
      if (updateError) throw updateError;
      setToast({
        title: "Submission rejected",
        message: "The submission has been rejected with your reason.",
        type: "success",
      });
      setRejectDialogOpen(false);
      setRejectSubmissionId(null);
      setRejectReason("");
      await fetchData();
    } catch (err: any) {
      setToast({
        title: "Reject failed",
        message: err.message || "Failed to reject submission",
        type: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === "pending").length;
    const validated = submissions.filter(
      (s) => s.status === "validated",
    ).length;
    const rejected = submissions.filter((s) => s.status === "rejected").length;
    const disputed = submissions.filter((s) => s.status === "disputed").length;
    return { total, pending, validated, rejected, disputed };
  }, [submissions]);

  const statusOrder: Record<SubmissionStatus, number> = {
    pending: 0,
    validated: 1,
    rejected: 2,
    disputed: 3,
  };

  const filtered = useMemo(() => {
    let list = submissions;
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const name = (
          s.collector?.full_name ||
          s.collector?.email ||
          ""
        ).toLowerCase();
        return name.includes(q);
      });
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
        );
      if (sortBy === "name") {
        const na = (
          a.collector?.full_name ??
          a.collector?.email ??
          ""
        ).toLowerCase();
        const nb = (
          b.collector?.full_name ??
          b.collector?.email ??
          ""
        ).toLowerCase();
        return na.localeCompare(nb);
      }
      if (sortBy === "status")
        return statusOrder[a.status] - statusOrder[b.status];
      return 0;
    });
    return sorted;
  }, [submissions, statusFilter, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 flex-1 min-w-[160px] max-w-[240px] rounded-lg" />
          <Skeleton className="h-9 w-[130px] rounded-lg" />
          <Skeleton className="h-9 w-[140px] rounded-lg" />
        </div>
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4 pl-14 sm:pl-0">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <ToastNotification
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200/80 dark:border-red-800/80 bg-red-50/80 dark:bg-red-950/30 px-4 py-2.5 text-[13px] text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {submissions.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "relative flex-1 w-96 flex items-center h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
                  )}
                >
                  <span className="pl-3 flex items-center shrink-0">
                    <Search className={cn("w-4 h-4 transition-colors")} />
                  </span>
                  <input
                    type="search"
                    placeholder="Search by collector…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchQuery("");
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent pl-2.5 pr-1 py-0 h-full outline-none min-w-0"
                  />
                </div>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) =>
                    setStatusFilter(v === "all" ? "" : (v as SubmissionStatus))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg border border-border bg-muted/50 text-sm w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({stats.total})</SelectItem>
                    <SelectItem value="pending">
                      Pending ({stats.pending})
                    </SelectItem>
                    <SelectItem value="validated">
                      Validated ({stats.validated})
                    </SelectItem>
                    <SelectItem value="rejected">
                      Rejected ({stats.rejected})
                    </SelectItem>
                    <SelectItem value="disputed">
                      Disputed ({stats.disputed})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(v: typeof sortBy) => setSortBy(v)}
                >
                  <SelectTrigger className="h-9 rounded-lg border border-border bg-muted/50 text-sm w-[140px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="name">Name A–Z</SelectItem>
                    <SelectItem value="status">By status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* List / Grid view toggle */}
              <div className="flex items-center rounded-lg border border-border bg-muted/50 h-9 p-0.5 gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                    viewMode === "list"
                      ? "bg-background dark:bg-muted shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="List view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                    viewMode === "grid"
                      ? "bg-background dark:bg-muted shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-24 h-24">
              <EmptyDataSvg />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No submissions yet
            </h3>
            <p className="text-sm text-muted-foreground">
              When collectors submit their work, it will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-20 h-20 mb-4 opacity-50">
              <EmptyDataSvg />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              No submissions match
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different filter or search.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[280px] -mx-1 px-1">
            <ul
              className={cn(
                "pr-2",
                viewMode === "list"
                  ? "space-y-3"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 auto-rows-[252px] gap-6",
              )}
            >
              {filtered.map((submission) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  onValidate={handleValidate}
                  onReject={handleReject}
                  processing={processing}
                  viewMode={viewMode}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Add a reason so the collector knows what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="submission-reject-reason"
              className="text-sm font-medium text-foreground"
            >
              Rejection reason
            </label>
            <Textarea
              id="submission-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Example: The submitted photos are too blurry and missing required location shots."
              className="min-h-[110px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectSubmissionId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={processing === rejectSubmissionId}
            >
              {processing === rejectSubmissionId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Submission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
