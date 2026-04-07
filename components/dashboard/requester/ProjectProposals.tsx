"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProposalsByProject,
  acceptProposals,
  getAssignmentsByProject,
  updateProposalStatus,
} from "@/lib/services/proposalService";
import type { ProposalWithCollector, CollectorAssignment } from "@/types";
import type { ProposalStatus } from "@/types/proposal";
import type { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Loader2, CheckCircle2, XCircle, Copy, Users, Check, X, MapPin, MessageSquare, Search, LayoutList, LayoutGrid } from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectProposalsProps {
  projectId: string;
  /** Project (for requester/project location on map). Optional; map shows collector only if missing. */
  project?: Project | null;
  /** Called when proposals load or change (e.g. after accept/reject) with the count of pending proposals. */
  onPendingCountChange?: (count: number) => void;
}

export default function ProjectProposals({
  projectId,
  project,
  onPendingCountChange,
}: ProjectProposalsProps) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalWithCollector[]>([]);
  const [assignments, setAssignments] = useState<CollectorAssignment[]>([]);
  const [selectedProposal, setSelectedProposal] =
    useState<ProposalWithCollector | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    title?: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "">("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name-az" | "name-za" | "status"
  >("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const sheetOpen = selectedProposal !== null;
  const closeSheet = () => setSelectedProposal(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [proposalsResult, assignmentsResult] = await Promise.all([
        getProposalsByProject(projectId),
        getAssignmentsByProject(projectId),
      ]);
      if (proposalsResult.error) throw proposalsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      const list = proposalsResult.data || [];
      setProposals(list);
      setAssignments(assignmentsResult.data || []);
      const pending = list.filter(
        (p) => p.status !== "accepted" && p.status !== "rejected",
      ).length;
      onPendingCountChange?.(pending);
    } catch (err: any) {
      setError(err.message || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleAcceptSingle = async (proposalId: string) => {
    if (!user) return;
    try {
      setProcessing(proposalId);
      setError("");
      const { error: acceptError } = await acceptProposals(
        [proposalId],
        user.id,
      );
      if (acceptError) throw acceptError;
      setToast({
        title: "Proposal accepted",
        message: "Proposal accepted! Submission link generated.",
        type: "success",
      });
      closeSheet();
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to accept proposal");
      setToast({
        title: "Accept failed",
        message: err.message || "Failed to accept proposal",
        type: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSingle = async (proposalId: string) => {
    if (!user) return;
    try {
      setProcessing(proposalId);
      setError("");
      const { error: rejectError } = await updateProposalStatus(
        proposalId,
        "rejected",
        user.id,
      );
      if (rejectError) throw rejectError;
      setToast({
        title: "Proposal rejected",
        message: "Proposal rejected.",
        type: "success",
      });
      closeSheet();
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to reject proposal");
      setToast({
        title: "Reject failed",
        message: err.message || "Failed to reject proposal",
        type: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  const copySubmissionLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setToast({
      title: "Link copied",
      message: "Submission link copied to clipboard!",
      type: "success",
    });
  };

  /** Build a single list of tag labels for data types, capabilities, experience, languages (for reference-style cards). */
  const getProposalTags = (p: ProposalWithCollector) => {
    const tags: string[] = [];
    (p.capabilities?.data_types ?? []).forEach((t) => tags.push(t));
    (p.capabilities?.equipment ?? []).forEach((e) => tags.push(e));
    if (p.capabilities?.experience_years != null)
      tags.push(`${p.capabilities.experience_years} years`);
    (p.capabilities?.languages ?? []).forEach((l) => tags.push(l));
    return tags;
  };

  const getSearchableText = (p: ProposalWithCollector) =>
    [
      p.collector?.full_name ?? "",
      p.collector?.email ?? "",
      p.message ?? "",
      p.location?.city ?? "",
      p.location?.country ?? "",
      p.location?.address ?? "",
      ...getProposalTags(p),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const statusOrder: Record<ProposalStatus, number> = {
    accepted: 0,
    pending: 1,
    rejected: 2,
    withdrawn: 3,
  };

  const getNormalizedRole = (role?: string | null) => {
    const normalized = (role ?? "collector").toLowerCase().replace(/_/g, " ");
    return normalized.includes("agent") ? "agent" : "collector";
  };

  const getRoleLabel = (role?: string | null) =>
    getNormalizedRole(role) === "agent" ? "Agent" : "Collector";

  const getRoleBadgeClass = (role?: string | null) =>
    getNormalizedRole(role) === "agent"
      ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";

  const getProposalCardClass = (role?: string | null) =>
    getNormalizedRole(role) === "agent"
      ? "bg-violet-50/80 dark:bg-violet-900/20 hover:bg-violet-100/80 dark:hover:bg-violet-900/30 border border-violet-200/60 dark:border-violet-800/50"
      : "bg-cyan-50/70 dark:bg-cyan-900/20 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/30 border border-cyan-200/60 dark:border-cyan-800/50";

  const filteredAndSortedProposals = useMemo(() => {
    let list = proposals;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => getSearchableText(p).includes(q));
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
      if (sortBy === "name-az" || sortBy === "name-za") {
        const na = (a.collector?.full_name ?? "").toLowerCase();
        const nb = (b.collector?.full_name ?? "").toLowerCase();
        const cmp = na.localeCompare(nb);
        return sortBy === "name-za" ? -cmp : cmp;
      }
      if (sortBy === "status")
        return statusOrder[a.status] - statusOrder[b.status];
      return 0;
    });
    return sorted;
  }, [proposals, searchQuery, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-5">
        {/* Toolbar skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 flex-1 min-w-[160px] max-w-[240px] rounded-lg" />
          <Skeleton className="h-9 w-[130px] rounded-lg" />
          <Skeleton className="h-9 w-[140px] rounded-lg" />
          <Skeleton className="h-9 w-[68px] rounded-lg ml-auto" />
        </div>

        {/* List rows skeleton */}
        <ul className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 shrink-0 lg:w-[180px]">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>

                {/* 3-col middle */}
                <div className="flex-1 grid grid-cols-3 gap-x-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-12 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                </div>

                {/* Status + budget */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2 shrink-0">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const additionalNote = (p: ProposalWithCollector) =>
    p.message?.trim() || p.capabilities?.notes?.trim() || null;

  const MAX_VISIBLE_TAGS = 7;

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
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200/80 dark:border-red-800/80 bg-red-50/80 dark:bg-red-950/30 px-4 py-2.5 text-[13px] text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-24 h-24">
              <EmptyDataSvg />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No proposals yet
            </h3>
            <p className="text-sm text-muted-foreground">
              When collectors submit proposals, they’ll appear here.
            </p>
          </div>
        ) : (
          <>
            {/* List header + search, filter, sort */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search inbox — same style as RequesterHeader */}
                <div
                  className={cn(
                    "relative flex-1 min-w-[160px] max-w-[240px] lg:max-w-sm flex items-center h-9 rounded-lg border bg-gray-50 dark:bg-gray-700/50 transition-all duration-200",
                    searchQuery
                      ? "border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-500/15 bg-white dark:bg-gray-700"
                      : "border-transparent",
                  )}
                >
                  <span className="pl-3 flex items-center shrink-0">
                    <Search
                      className={cn(
                        "w-4 h-4 transition-colors",
                        searchQuery
                          ? "text-cyan-500"
                          : "text-gray-400 dark:text-gray-500",
                      )}
                    />
                  </span>
                  <input
                    type="search"
                    placeholder="Search by name, message…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchQuery("");
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-2.5 pr-1 py-0 h-full outline-none min-w-0"
                  />
                  <span className="pr-2 flex items-center shrink-0">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                      </button>
                    ) : null}
                  </span>
                </div>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) =>
                    setStatusFilter(v === "all" ? "" : (v as ProposalStatus))
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm w-[130px]",
                      "hover:bg-gray-100 dark:hover:bg-gray-700/70 focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-400 dark:focus:border-cyan-500",
                    )}
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(v: typeof sortBy) => setSortBy(v)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm w-[140px]",
                      "hover:bg-gray-100 dark:hover:bg-gray-700/70 focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-400 dark:focus:border-cyan-500",
                    )}
                  >
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="name-az">Name A–Z</SelectItem>
                    <SelectItem value="name-za">Name Z–A</SelectItem>
                    <SelectItem value="status">By status</SelectItem>
                  </SelectContent>
                </Select>

                {/* View mode toggle */}
                <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 h-9 p-0.5 gap-0.5 ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "btn-gelatine flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 shadow-sm text-foreground"
                        : "text-gray-400 dark:text-gray-500 hover:text-foreground",
                    )}
                    title="List view"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "btn-gelatine flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 shadow-sm text-foreground"
                        : "text-gray-400 dark:text-gray-500 hover:text-foreground",
                    )}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filteredAndSortedProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-24 h-24">
                  <EmptyDataSvg />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No proposals match
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-[260px]">
                  Try adjusting the search or filter to find what you're looking
                  for.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)] -mx-1 px-1">
                {viewMode === "list" ? (
                  <ul className="space-y-2">
                    {filteredAndSortedProposals.map((proposal) => (
                      <li key={proposal.id}>
                        <article
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedProposal(proposal)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedProposal(proposal);
                            }
                          }}
                          className={cn(
                            "group rounded-xl transition-colors duration-150 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            getProposalCardClass(proposal.collector?.role),
                          )}
                        >
                          <div className="p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                              {/* Left: avatar + name + location */}
                              <div className="flex min-w-0 items-center gap-3 shrink-0 lg:w-[180px]">
                                <div className="relative shrink-0">
                                  <Avatar className="h-12 w-12 rounded-full bg-muted/50">
                                    <AvatarImage
                                      src={
                                        proposal.collector?.avatar_url ||
                                        "/default-avatar.svg"
                                      }
                                    />
                                    <AvatarFallback className="p-0 overflow-hidden rounded-full">
                                      <img
                                        src="/default-avatar.svg"
                                        alt={
                                          proposal.collector?.full_name ??
                                          "Collector"
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-base font-semibold text-foreground truncate">
                                    {proposal.collector?.full_name ?? "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                                        getRoleBadgeClass(
                                          proposal.collector?.role,
                                        ),
                                      )}
                                    >
                                      {getRoleLabel(proposal.collector?.role)}
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {proposal.location?.country ??
                                        proposal.location?.city ??
                                        "—"}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Middle: 3-column breakdown */}
                              <div className="flex-1 min-w-0 grid grid-cols-3 gap-x-4">
                                {/* Col 1: Data types & equipment */}
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Data &amp; Equipment
                                  </p>
                                  {(() => {
                                    const items = [
                                      ...(proposal.capabilities?.data_types ??
                                        []),
                                      ...(proposal.capabilities?.equipment ??
                                        []),
                                    ];
                                    return items.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {items.slice(0, 5).map((label, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground dark:bg-gray-700 dark:text-gray-100"
                                          >
                                            {label}
                                          </span>
                                        ))}
                                        {items.length > 5 && (
                                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-gray-700">
                                            +{items.length - 5}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/50">
                                        —
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Col 2: Experience & languages */}
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Experience &amp; Languages
                                  </p>
                                  {proposal.capabilities?.experience_years !=
                                    null ||
                                  (proposal.capabilities?.languages ?? [])
                                    .length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {proposal.capabilities
                                        ?.experience_years != null && (
                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground dark:bg-gray-700 dark:text-gray-100">
                                          {
                                            proposal.capabilities
                                              .experience_years
                                          }{" "}
                                          yrs
                                        </span>
                                      )}
                                      {(proposal.capabilities?.languages ?? [])
                                        .slice(0, 4)
                                        .map((lang, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground dark:bg-gray-700 dark:text-gray-100"
                                          >
                                            {lang}
                                          </span>
                                        ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/50">
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Col 3: Additional note */}
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Note
                                  </p>
                                  {additionalNote(proposal) ? (
                                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                      {additionalNote(proposal)}
                                    </p>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/50">
                                      —
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: price + status/actions */}
                              <div
                                className="flex shrink-0 flex-col items-end gap-2 lg:w-[200px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-sm font-semibold tabular-nums text-foreground">
                                  {proposal.proposed_budget != null
                                    ? `$${Number(proposal.proposed_budget).toFixed(2)}`
                                    : "—"}
                                </span>
                                {proposal.status === "pending" && (
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      disabled={processing === proposal.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectSingle(proposal.id);
                                      }}
                                    >
                                      {processing === proposal.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <>
                                          <X className="w-3.5 h-3.5 mr-1" />
                                          Reject
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 px-3 text-xs font-medium"
                                      disabled={processing === proposal.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcceptSingle(proposal.id);
                                      }}
                                    >
                                      {processing === proposal.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="w-3.5 h-3.5 mr-1" />
                                          Accept
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                                {proposal.status === "accepted" && (
                                  <Badge
                                    variant="secondary"
                                    className="shrink-0 border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Accepted
                                  </Badge>
                                )}
                                {proposal.status === "rejected" && (
                                  <Badge
                                    variant="secondary"
                                    className="shrink-0 border-0 bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-medium"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* Grid view */
                  <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                    {filteredAndSortedProposals.map((proposal) => {
                      const tags = getProposalTags(proposal);
                      const MAX_GRID_TAGS = 4;
                      return (
                        <li key={proposal.id}>
                          <article
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedProposal(proposal)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedProposal(proposal);
                              }
                            }}
                            className={cn(
                              "group h-full flex flex-col rounded-xl transition-colors duration-150 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              getProposalCardClass(proposal.collector?.role),
                            )}
                          >
                            {/* Card header — centered profile */}
                            <div className="flex flex-col items-center text-center gap-2 pt-6 pb-4 px-4">
                              <Avatar className="h-16 w-16 rounded-full shrink-0">
                                <AvatarImage
                                  src={
                                    proposal.collector?.avatar_url ||
                                    "/default-avatar.svg"
                                  }
                                />
                                <AvatarFallback className="p-0 overflow-hidden rounded-full">
                                  <img
                                    src="/default-avatar.svg"
                                    alt={
                                      proposal.collector?.full_name ??
                                      "Collector"
                                    }
                                    className="w-full h-full object-cover"
                                  />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 w-full space-y-0.5">
                                <p className="text-base font-bold text-foreground truncate leading-tight">
                                  {proposal.collector?.full_name ?? "Unknown"}
                                </p>
                                <div className="flex justify-center">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                      getRoleBadgeClass(
                                        proposal.collector?.role,
                                      ),
                                    )}
                                  >
                                    {getRoleLabel(proposal.collector?.role)}
                                  </span>
                                </div>
                                {(proposal.location?.city ||
                                  proposal.location?.country) && (
                                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {proposal.location?.city
                                        ? `${proposal.location.city}${proposal.location.country ? `, ${proposal.location.country}` : ""}`
                                        : proposal.location?.country}
                                    </span>
                                  </p>
                                )}
                              </div>
                              {/* Status badge */}
                              {proposal.status === "accepted" && (
                                <Badge
                                  variant="secondary"
                                  className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                              {proposal.status === "rejected" && (
                                <Badge
                                  variant="secondary"
                                  className="border-0 bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-medium"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                              {proposal.status === "withdrawn" && (
                                <Badge
                                  variant="secondary"
                                  className="border-0 bg-gray-500/10 text-gray-500 dark:text-gray-400 text-[11px] font-medium"
                                >
                                  Withdrawn
                                </Badge>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="px-4 flex-1">
                              {additionalNote(proposal) && (
                                <p className="mb-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {additionalNote(proposal)}
                                </p>
                              )}
                              {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {tags
                                    .slice(0, MAX_GRID_TAGS)
                                    .map((label, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground dark:bg-gray-700 dark:text-gray-100"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  {tags.length > MAX_GRID_TAGS && (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-gray-700">
                                      +{tags.length - MAX_GRID_TAGS}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground/70">
                                  No skills listed
                                </p>
                              )}
                            </div>

                            {/* Card footer: budget + actions */}
                            <div
                              className="flex items-center justify-between gap-2 pt-3 pb-4 mt-3 border-t border-gray-200 dark:border-gray-700 ml-4 mr-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {proposal.proposed_budget != null
                                  ? `$${Number(proposal.proposed_budget).toFixed(2)}`
                                  : "—"}
                              </span>
                              {proposal.status === "pending" && (
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    disabled={processing === proposal.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectSingle(proposal.id);
                                    }}
                                  >
                                    {processing === proposal.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 mr-1" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs font-medium"
                                    disabled={processing === proposal.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcceptSingle(proposal.id);
                                    }}
                                  >
                                    {processing === proposal.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Accept
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            )}

            {assignments.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/20 pt-3 pb-3 px-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Submission links ({assignments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {assignments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => copySubmissionLink(a.submission_link)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {a.submission_link.split("/").pop()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Proposal detail drawer — same structure as ProjectDetailsSheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col border-none shadow-none"
        >
          {selectedProposal && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>
                  Proposal from{" "}
                  {selectedProposal.collector?.full_name ?? "Unknown"}
                </SheetTitle>
                <SheetDescription>
                  Proposal details for requester review.
                </SheetDescription>
              </SheetHeader>

              {/* Hero header — matches ProjectDetailsSheet */}
              <div className="px-5 pt-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5 overflow-hidden border border-border/50 bg-muted/50">
                      <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage
                          src={
                            selectedProposal.collector?.avatar_url ||
                            "/default-avatar.svg"
                          }
                        />
                        <AvatarFallback className="p-0 overflow-hidden rounded-xl">
                          <img
                            src="/default-avatar.svg"
                            alt={
                              selectedProposal.collector?.full_name ??
                              "Collector"
                            }
                            className="w-full h-full object-cover"
                          />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-foreground leading-tight">
                          {selectedProposal.collector?.full_name ?? "Unknown"}
                        </h2>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            getRoleBadgeClass(selectedProposal.collector?.role),
                          )}
                        >
                          {getRoleLabel(selectedProposal.collector?.role)}
                        </Badge>
                        {selectedProposal.status === "accepted" &&
                          (() => {
                            const assignment = assignments.find(
                              (a) => a.proposal_id === selectedProposal.id,
                            );
                            if (!assignment) return null;
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  copySubmissionLink(assignment.submission_link)
                                }
                                className="mt-1 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group w-fit max-w-[180px]"
                              >
                                <span className="truncate">
                                  {assignment.submission_token}
                                </span>
                                <Copy className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                              </button>
                            );
                          })()}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {selectedProposal.location?.address ||
                            selectedProposal.location?.country ||
                            selectedProposal.location?.city ||
                            "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedProposal.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="capitalize gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        Pending
                      </Badge>
                    )}
                    {selectedProposal.status === "accepted" && (
                      <Badge
                        variant="outline"
                        className="capitalize gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted
                      </Badge>
                    )}
                    {selectedProposal.status === "rejected" && (
                      <Badge
                        variant="outline"
                        className="capitalize gap-1.5 border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {selectedProposal.proposed_budget != null
                      ? `$${Number(selectedProposal.proposed_budget).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Two columns: left = details, right = map */}
              <div className="flex flex-1 min-h-0">
                <ScrollArea className="flex-1 min-w-0">
                  <div className="px-5 pb-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-5">
                        {/* Location */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            Location
                          </p>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {selectedProposal.location?.address ?? "—"}
                          </p>
                        </div>

                        {/* Data types — same as ProjectDetailsSheet "Required Data Types" */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Data types
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedProposal.capabilities?.data_types ?? [])
                              .length > 0 ? (
                              (
                                selectedProposal.capabilities?.data_types ?? []
                              ).map((type, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
                                >
                                  {type}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Equipment & experience — optional */}
                        {selectedProposal.capabilities?.equipment?.length ||
                        selectedProposal.capabilities?.experience_years !=
                          null ||
                        selectedProposal.capabilities?.languages?.length ? (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Capabilities
                            </p>
                            <div className="space-y-2">
                              {selectedProposal.capabilities?.equipment
                                ?.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedProposal.capabilities.equipment.map(
                                    (item, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
                                      >
                                        {item}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              ) : null}
                              {selectedProposal.capabilities
                                ?.experience_years != null && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Experience
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <Badge
                                      variant="secondary"
                                      className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
                                    >
                                      {
                                        selectedProposal.capabilities
                                          .experience_years
                                      }{" "}
                                      years
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              {selectedProposal.capabilities?.languages
                                ?.length ? (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Language
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedProposal.capabilities.languages.map(
                                      (lang, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-sm px-4 py-2 border-none text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full"
                                        >
                                          {lang}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {(() => {
                        const cLat = selectedProposal.location?.lat;
                        const cLng = selectedProposal.location?.lng;
                        const rLat = project?.location?.lat;
                        const rLng = project?.location?.lng;
                        const hasCollector =
                          typeof cLat === "number" &&
                          typeof cLng === "number" &&
                          Number.isFinite(cLat) &&
                          Number.isFinite(cLng);
                        const hasRequester =
                          typeof rLat === "number" &&
                          typeof rLng === "number" &&
                          Number.isFinite(rLat) &&
                          Number.isFinite(rLng);
                        const hasMap = hasCollector || hasRequester;
                        const lat = hasRequester
                          ? (rLat as number)
                          : (cLat as number);
                        const lng = hasRequester
                          ? (rLng as number)
                          : (cLng as number);
                        const jobPins =
                          hasCollector && hasRequester
                            ? [
                                {
                                  id: "collector",
                                  lat: cLat as number,
                                  lng: cLng as number,
                                  title: "Collector",
                                  budget: 0,
                                },
                              ]
                            : [];
                        return hasMap ? (
                          <div className="overflow-hidden rounded-xl">
                            <LocationMapPreview
                              lat={lat}
                              lng={lng}
                              radiusKm={0}
                              jobPins={jobPins}
                              className="w-full h-full min-h-[240px]"
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Additional specifications / note — same as "Additional Specifications" */}
                    {(selectedProposal.message?.trim() ||
                      selectedProposal.capabilities?.notes?.trim()) && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Additional note
                        </p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {selectedProposal.message?.trim() ||
                            selectedProposal.capabilities?.notes?.trim()}
                        </p>
                      </div>
                    )}

                    {/* Bio */}
                    {selectedProposal.collector?.bio && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          About collector
                        </p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {selectedProposal.collector.bio}
                        </p>
                      </div>
                    )}

                    {/* Assignment key — shown when proposal is accepted */}

                    {/* Action buttons — same layout as ProjectDetailsSheet (flex gap-2.5, h-12 rounded-xl) */}
                    {selectedProposal.status === "pending" && (
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                            disabled={processing === selectedProposal.id}
                            onClick={() =>
                              handleRejectSingle(selectedProposal.id)
                            }
                          >
                            {processing === selectedProposal.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <X className="w-5 h-5 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={processing === selectedProposal.id}
                            onClick={() =>
                              handleAcceptSingle(selectedProposal.id)
                            }
                          >
                            {processing === selectedProposal.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {/* Map — same as ProjectDetailsSheet: Location Map + LocationMapPreview (collector + requester) */}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
