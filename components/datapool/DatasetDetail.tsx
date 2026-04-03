"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { Tabs, TabsContent, TabsUnderlineList, TabsUnderlineTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDesc,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createDataPoolDatasetMessage,
  getDataPoolDatasetById,
  getDataPoolDatasetFileSignedUrl,
  hasUserPurchasedDataPoolDataset,
  listDataPoolDatasetFiles,
  listDataPoolDatasetMessages,
  purchaseDataPoolDataset,
  type DataPoolDatasetDetail,
  type DataPoolDatasetFileRow,
  type DataPoolDatasetMessageRow,
} from "@/lib/services/dataPoolService";
import { getWalletBalance } from "@/lib/services/walletService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Send,
  ArrowLeft,
  MessageSquareText,
  FileText,
  FolderOpen,
  ChevronRight,
  MessageSquarePlus,
  Lock,
  Wallet,
} from "lucide-react";

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function rootDiscussionTitle(msg: DataPoolDatasetMessageRow): string {
  const t = msg.title?.trim();
  if (t) return t;
  const first = msg.body.split("\n")[0]?.trim() || msg.body;
  return first.slice(0, 200) || "Discussion";
}

function rootDiscussionDescription(msg: DataPoolDatasetMessageRow): string {
  const d = msg.description?.trim();
  if (d) return d;
  return msg.body;
}

/** All nested replies under a parent (recursive count). */
function countDescendantComments(
  parentId: string,
  repliesByParent: Map<string, DataPoolDatasetMessageRow[]>,
): number {
  let n = 0;
  const visit = (pid: string) => {
    for (const k of repliesByParent.get(pid) ?? []) {
      n += 1;
      visit(k.id);
    }
  };
  visit(parentId);
  return n;
}

function MessageBubble({
  msg,
  depth = 0,
  onReply,
  showReply = true,
}: {
  msg: DataPoolDatasetMessageRow;
  /** Nesting level under the discussion root (0 = top-level comment). */
  depth?: number;
  onReply: (msg: DataPoolDatasetMessageRow) => void;
  showReply?: boolean;
}) {
  const indentPx = depth > 0 ? Math.min(depth, 12) * 14 : 0;
  return (
    <div
      style={indentPx ? { marginLeft: indentPx } : undefined}
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3",
        depth > 0 && "border-white/[0.08] bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90 truncate">
              {msg.author_name || "Anonymous"}
            </span>
            <span className="text-xs text-white/45">{formatDateTime(msg.created_at)}</span>
          </div>
        </div>
        {showReply ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-white/70 hover:text-white"
            onClick={() => onReply(msg)}
          >
            Reply to comment
          </Button>
        ) : null}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
        {msg.body}
      </p>
    </div>
  );
}

function DiscussionCommentBranch({
  parentId,
  repliesByParent,
  depth,
  onReply,
}: {
  parentId: string;
  repliesByParent: Map<string, DataPoolDatasetMessageRow[]>;
  depth: number;
  onReply: (msg: DataPoolDatasetMessageRow) => void;
}) {
  const raw = repliesByParent.get(parentId) ?? [];
  const children = [...raw].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  if (children.length === 0) return null;
  return (
    <div className={cn("space-y-2", depth > 0 && "mt-1")}>
      {children.map((c) => (
        <div key={c.id} className="space-y-2">
          <MessageBubble msg={c} depth={depth} onReply={onReply} />
          <DiscussionCommentBranch
            parentId={c.id}
            repliesByParent={repliesByParent}
            depth={depth + 1}
            onReply={onReply}
          />
        </div>
      ))}
    </div>
  );
}

function buildDatasetsHref(datasetId: string, discussionId: string | null) {
  const q = new URLSearchParams({ id: datasetId });
  if (discussionId) q.set("discussion", discussionId);
  return `/datapool/datasets?${q.toString()}`;
}

function FileAccessRow({
  file,
  canDownload,
  lockedHint = "Purchase this dataset to download files.",
  downloading,
  onDownload,
}: {
  file: DataPoolDatasetFileRow;
  canDownload: boolean;
  /** Shown under the file name when the user can see the row but may not download */
  lockedHint?: string;
  downloading: boolean;
  onDownload: (f: DataPoolDatasetFileRow) => void;
}) {
  if (!canDownload) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3">
        <Lock className="h-5 w-5 shrink-0 text-white/35" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white/55 truncate">{file.file_name}</p>
          <p className="mt-0.5 text-xs text-white/40">{lockedHint}</p>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={downloading}
      onClick={() => onDownload(file)}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-cyan-500/40 disabled:opacity-60"
    >
      <FileText className="h-5 w-5 shrink-0 text-cyan-300/80" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{file.file_name}</p>
        <p className="mt-0.5 text-xs text-white/50">
          {formatBytes(file.file_size)}
          {file.mime_type ? ` • ${file.mime_type}` : ""}
        </p>
      </div>
      {downloading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
      )}
    </button>
  );
}

export default function DatasetDetail({ datasetId }: { datasetId: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const discussionIdFromUrl = searchParams.get("discussion")?.trim() || null;

  const [dataset, setDataset] = useState<DataPoolDatasetDetail | null>(null);
  const [files, setFiles] = useState<DataPoolDatasetFileRow[]>([]);
  const [messages, setMessages] = useState<DataPoolDatasetMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [mainTab, setMainTab] = useState("card");
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<DataPoolDatasetMessageRow | null>(null);

  const [createDiscussionOpen, setCreateDiscussionOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionDescription, setNewDiscussionDescription] = useState("");
  const [createSending, setCreateSending] = useState(false);
  const [createFormError, setCreateFormError] = useState("");

  const [purchased, setPurchased] = useState(false);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const setDiscussionInUrl = useCallback(
    (discussionId: string | null) => {
      router.replace(buildDatasetsHref(datasetId, discussionId));
    },
    [router, datasetId],
  );

  useEffect(() => {
    if (discussionIdFromUrl) setMainTab("community");
  }, [discussionIdFromUrl]);

  const loadAll = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      const isRefresh = mode === "refresh";
      if (isRefresh) setRefreshing(true);
      else {
        setLoading(true);
        setError("");
      }

      const uid = user?.id;
      const [dRes, fRes, mRes, buyRes] = await Promise.all([
        getDataPoolDatasetById(datasetId),
        listDataPoolDatasetFiles(datasetId),
        listDataPoolDatasetMessages(datasetId),
        uid
          ? hasUserPurchasedDataPoolDataset(datasetId, uid)
          : Promise.resolve({ purchased: false, error: null }),
      ]);

      if (dRes.error) {
        setError(dRes.error.message || "Failed to load dataset.");
        setDataset(null);
        setFiles([]);
        setMessages([]);
        setPurchased(false);
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
        return;
      }

      setDataset(dRes.data);
      setFiles(fRes.data ?? []);
      setMessages(mRes.data ?? []);
      setPurchased(buyRes.purchased);
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    },
    [datasetId, user?.id],
  );
  const openDiscussion = useCallback(
    (discussionId: string) => {
      if (discussionIdFromUrl !== discussionId) {
        setDiscussionInUrl(discussionId);
        return;
      }
      void loadAll("refresh");
    },
    [discussionIdFromUrl, setDiscussionInUrl, loadAll],
  );

  useEffect(() => {
    void loadAll("initial");
  }, [loadAll]);

  const thread = useMemo(() => {
    const byId = new Map<string, DataPoolDatasetMessageRow>();
    for (const m of messages) byId.set(m.id, m);

    const roots = messages.filter((m) => !m.parent_id);
    const repliesByParent = new Map<string, DataPoolDatasetMessageRow[]>();
    for (const m of messages) {
      if (!m.parent_id) continue;
      const arr = repliesByParent.get(m.parent_id) ?? [];
      arr.push(m);
      repliesByParent.set(m.parent_id, arr);
    }

    // Ensure replies are newest-first like the main list.
    for (const [k, arr] of Array.from(repliesByParent.entries())) {
      repliesByParent.set(
        k,
        arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    }

    // If we have orphan replies (parent deleted), treat them as roots.
    const orphans = messages.filter((m) => m.parent_id && !byId.has(m.parent_id));
    return { roots, repliesByParent, orphans };
  }, [messages]);

  const discussionListItems = useMemo(() => {
    const combined = [...thread.orphans, ...thread.roots];
    return combined.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [thread.orphans, thread.roots]);

  const activeDiscussionRoot = useMemo(() => {
    if (!discussionIdFromUrl) return null;
    const m = messages.find((x) => x.id === discussionIdFromUrl);
    if (!m || m.parent_id) return null;
    return m;
  }, [messages, discussionIdFromUrl]);

  const activeDiscussionCommentCount = useMemo(() => {
    if (!activeDiscussionRoot) return 0;
    return countDescendantComments(activeDiscussionRoot.id, thread.repliesByParent);
  }, [activeDiscussionRoot, thread.repliesByParent]);

  useEffect(() => {
    if (!discussionIdFromUrl || loading) return;
    const m = messages.find((x) => x.id === discussionIdFromUrl);
    if (!m || m.parent_id) {
      router.replace(buildDatasetsHref(datasetId, null));
    }
  }, [discussionIdFromUrl, loading, messages, datasetId, router]);

  useEffect(() => {
    if (!discussionIdFromUrl) return;
    void loadAll("refresh");
  }, [discussionIdFromUrl, loadAll]);

  useEffect(() => {
    setReplyTo(null);
    setBody("");
  }, [discussionIdFromUrl]);

  const onSendReply = async () => {
    if (!body.trim() || !activeDiscussionRoot) return;
    setSending(true);
    const parentId = replyTo?.id ?? activeDiscussionRoot.id;
    const { error } = await createDataPoolDatasetMessage({
      datasetId,
      body,
      parentId,
    });
    if (error) {
      setError(error.message || "Failed to send message.");
      setSending(false);
      return;
    }
    setBody("");
    setReplyTo(null);
    await loadAll("refresh");
    setSending(false);
  };

  const onCreateDiscussion = async () => {
    const title = newDiscussionTitle.trim();
    const description = newDiscussionDescription.trim();
    if (!title || !description) {
      setCreateFormError("Title and description are required.");
      return;
    }
    setCreateSending(true);
    setCreateFormError("");
    const { error } = await createDataPoolDatasetMessage({
      datasetId,
      parentId: null,
      title,
      description,
    });
    if (error) {
      setCreateFormError(error.message || "Failed to create discussion.");
      setCreateSending(false);
      return;
    }
    setNewDiscussionTitle("");
    setNewDiscussionDescription("");
    setCreateDiscussionOpen(false);
    await loadAll("refresh");
    setCreateSending(false);
  };

  const isOwner = Boolean(user?.id && dataset && user.id === dataset.owner_id);
  const hasFileAccess = isOwner || purchased;
  const isCollector = profile?.role === "collector";

  useEffect(() => {
    if (!user?.id || !dataset) {
      setWalletBalance(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { balance } = await getWalletBalance(user.id);
      if (!cancelled) setWalletBalance(balance);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, dataset?.id]);

  const onDownloadFile = useCallback(async (f: DataPoolDatasetFileRow) => {
    setDownloadingId(f.id);
    setError("");
    const { url, error: uErr } = await getDataPoolDatasetFileSignedUrl({
      bucketId: f.bucket_id,
      storagePath: f.storage_path,
    });
    setDownloadingId(null);
    if (uErr || !url) {
      setError(uErr?.message || "Could not create download link.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const onPurchaseDataset = async () => {
    if (
      !dataset ||
      !user?.id ||
      isOwner ||
      purchased ||
      purchaseSubmitting ||
      isCollector
    )
      return;
    setPurchaseSubmitting(true);
    setError("");
    const { error: pErr } = await purchaseDataPoolDataset(dataset.id);
    if (pErr) {
      setError(pErr.message || "Purchase failed.");
      setPurchaseSubmitting(false);
      return;
    }
    setPurchased(true);
    await refreshProfile();
    const { balance } = await getWalletBalance(user.id);
    setWalletBalance(balance);
    await loadAll("refresh");
    setPurchaseSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />
      <PageHero
        title="Dataset"
        subtitle={dataset?.title ? `: ${dataset.title}` : "Detail"}
        description="View full dataset details and join the community discussion."
        compact
      />

      <main className="pb-20 pt-6">
        <div className="container mx-auto px-6">
          <div className="mb-4">
            <Link
              href="/datapool"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to DataPool
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : !dataset ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white/70">
              Dataset not found.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
              <Tabs
                value={mainTab}
                onValueChange={(v) => {
                  setMainTab(v);
                  if (v !== "community" && discussionIdFromUrl) {
                    setDiscussionInUrl(null);
                  }
                }}
                className="w-full"
              >
                <TabsUnderlineList className="border-white/10 px-6">
                  <TabsUnderlineTrigger value="card" className="text-white/70 data-[state=active]:text-white">
                    <FileText className="h-4 w-4" />
                    Dataset Card
                  </TabsUnderlineTrigger>
                  <TabsUnderlineTrigger value="files" className="text-white/70 data-[state=active]:text-white">
                    <FolderOpen className="h-4 w-4" />
                    Files
                  </TabsUnderlineTrigger>
                  <TabsUnderlineTrigger value="community" className="text-white/70 data-[state=active]:text-white">
                    <MessageSquareText className="h-4 w-4" />
                    Community
                  </TabsUnderlineTrigger>
                </TabsUnderlineList>

                <TabsContent value="card" className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 space-y-5">
                      <div>
                        <h2 className="text-xl font-bold text-white">{dataset.title}</h2>
                        <p className="mt-2 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                          {dataset.description?.trim() ? dataset.description : "No description provided."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Owner</p>
                          <p className="mt-1 text-sm font-semibold text-white/85">
                            {dataset.owner_name || "Unknown user"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Category</p>
                          <p className="mt-1 text-sm font-semibold text-white/85">{dataset.category}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Price</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-300">{formatMoney(dataset.price)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Updated</p>
                          <p className="mt-1 text-sm font-semibold text-white/85">{formatDateTime(dataset.updated_at)}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Data types</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dataset.data_types?.length ? (
                            dataset.data_types.map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-white/60">—</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Formats</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dataset.formats?.length ? (
                            dataset.formats.map((f) => (
                              <span
                                key={f}
                                className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200"
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-white/60">—</span>
                          )}
                        </div>
                      </div>
                    </section>

                    <aside className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Dataset files</p>
                        <p className="mt-2 text-sm text-white/70 leading-relaxed">
                          {files.length === 0
                            ? "No files yet. Owners can add files when listing or editing this dataset."
                            : `${files.length} file${files.length === 1 ? "" : "s"} available in the Files tab.`}
                        </p>
                        {files.length > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => setMainTab("files")}
                          >
                            Open Files tab
                          </Button>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                          {isOwner ? "Your listing" : "Get this dataset"}
                        </p>
                        {isOwner ? (
                          <p className="mt-2 text-sm text-white/70 leading-relaxed">
                            You can always download files you uploaded for this dataset.
                          </p>
                        ) : purchased ? (
                          <p className="mt-2 text-sm font-semibold text-emerald-200/90">
                            Purchased — open the Files tab to download.
                          </p>
                        ) : !user ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-white/60">Sign in to purchase with your wallet balance.</p>
                            <Button
                              type="button"
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                              <Link href="/login">Sign in</Link>
                            </Button>
                          </div>
                        ) : isCollector ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-white/70 leading-relaxed">
                              Collector accounts cannot buy Data Pool listings. You can sell your own datasets
                              with <span className="text-white/85 font-medium">List a dataset</span> on the
                              marketplace.
                            </p>
                            <Button
                              type="button"
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                              <Link href="/datapool">Back to Data Pool</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-3">
                            <p className="text-sm text-white/70">
                              Price{" "}
                              <span className="font-semibold text-emerald-300">
                                {formatMoney(dataset.price)}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 text-sm text-white/60">
                              <Wallet className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
                              <span>
                                Your balance:{" "}
                                <span className="font-semibold text-white/85">
                                  {walletBalance === null ? "—" : formatMoney(walletBalance)}
                                </span>
                              </span>
                            </div>
                            {dataset.price > 0 &&
                            walletBalance !== null &&
                            walletBalance < dataset.price ? (
                              <p className="text-xs text-amber-200/90">
                                Insufficient balance. Add funds to purchase.
                              </p>
                            ) : null}
                            <div className="flex flex-col gap-2">
                              <Button
                                type="button"
                                className="h-9 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={
                                  purchaseSubmitting ||
                                  (dataset.price > 0 &&
                                    walletBalance !== null &&
                                    walletBalance < dataset.price)
                                }
                                onClick={() => void onPurchaseDataset()}
                              >
                                {purchaseSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing…
                                  </>
                                ) : dataset.price <= 0 ? (
                                  "Add to library"
                                ) : (
                                  "Purchase with balance"
                                )}
                              </Button>
                              <Button
                                type="button"
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                              >
                                <Link href="/dashboard/wallet">Wallet</Link>
                              </Button>
                            </div>
                            <Link
                              href="/datapool?tab=purchases"
                              className="inline-block text-xs font-medium text-cyan-300/90 hover:text-cyan-200"
                            >
                              View my purchases
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Created</p>
                        <p className="mt-1 text-sm font-semibold text-white/85">{formatDateTime(dataset.created_at)}</p>
                      </div>
                    </aside>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="px-6 py-6">
                  <div
                    className={cn(
                      "grid gap-6",
                      hasFileAccess ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1",
                    )}
                  >
                    <section className={cn("space-y-4", hasFileAccess && "lg:col-span-2")}>
                      <div>
                        <h2 className="text-lg font-bold text-white">Files in this dataset</h2>
                        <p className="mt-1 text-sm text-white/55">
                          {hasFileAccess
                            ? "Secure download links open in a new tab."
                            : isCollector
                              ? "Collector accounts cannot purchase this dataset or download its files. You can list your own data for sale from the Data Pool."
                              : "Purchase this dataset on the Dataset Card tab to unlock downloads."}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {files.length === 0 ? (
                          hasFileAccess ? (
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                              <p className="text-sm font-semibold text-white/80">No files uploaded yet</p>
                              <p className="mt-1 text-sm text-white/55">
                                The dataset owner can attach files when creating or editing the listing.
                              </p>
                            </div>
                          ) : null
                        ) : (
                          files.map((f) => (
                            <FileAccessRow
                              key={f.id}
                              file={f}
                              canDownload={hasFileAccess}
                              lockedHint={
                                isCollector
                                  ? "Purchasing isn’t available for collector accounts."
                                  : "Purchase this dataset to download files."
                              }
                              downloading={downloadingId === f.id}
                              onDownload={onDownloadFile}
                            />
                          ))
                        )}
                      </div>
                    </section>
                    {hasFileAccess ? (
                      <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-fit">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Summary</p>
                        <p className="mt-2 text-sm font-semibold text-white/85">{files.length} file(s)</p>
                      </aside>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="community" className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 space-y-4">
                      {activeDiscussionRoot ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => setDiscussionInUrl(null)}
                            >
                              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                              All discussions
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 min-w-[5.5rem] border-white/20 bg-white/5 text-white hover:bg-white/10"
                              disabled={refreshing}
                              onClick={() => void loadAll("refresh")}
                              aria-label={refreshing ? "Refreshing" : "Refresh"}
                              title="Refresh"
                            >
                              {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                "Refresh"
                              )}
                            </Button>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4">
                            <h2 className="text-xl font-bold text-white leading-snug">
                              {rootDiscussionTitle(activeDiscussionRoot)}
                            </h2>
                            <p className="mt-2 text-xs text-white/45">
                              {activeDiscussionRoot.author_name || "Anonymous"} ·{" "}
                              {formatDateTime(activeDiscussionRoot.created_at)}
                            </p>
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                              {rootDiscussionDescription(activeDiscussionRoot)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
                              Comments ({activeDiscussionCommentCount})
                            </p>
                            {activeDiscussionCommentCount === 0 ? (
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/55">
                                No comments yet. Post below or reply once someone joins in.
                              </div>
                            ) : (
                              <DiscussionCommentBranch
                                parentId={activeDiscussionRoot.id}
                                repliesByParent={thread.repliesByParent}
                                depth={0}
                                onReply={(x) => setReplyTo(x)}
                              />
                            )}
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm font-semibold text-white">Post a comment</p>
                            <p className="text-xs text-white/55 mt-1">
                              Write a top-level comment on this discussion, or use &quot;Reply to comment&quot; on someone
                              else&apos;s message to reply directly to them. Replies can nest under any comment.
                            </p>
                            {replyTo && (
                              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs text-white/60 truncate">
                                    Reply to{" "}
                                    <span className="text-white/85 font-semibold">
                                      {replyTo.author_name || "Anonymous"}
                                    </span>
                                    ’s comment
                                  </p>
                                  <button
                                    type="button"
                                    className="text-xs font-semibold text-white/60 hover:text-white underline underline-offset-2"
                                    onClick={() => setReplyTo(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <p className="mt-1 text-xs text-white/50 line-clamp-2 whitespace-pre-wrap">
                                  {replyTo.body}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex flex-col gap-3">
                              <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={
                                  user
                                    ? replyTo
                                      ? "Write your reply…"
                                      : "Write a comment…"
                                    : "Log in to post a comment."
                                }
                                disabled={!user || sending}
                                className="min-h-28 border-white/15 text-white placeholder:text-white/40"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  onClick={onSendReply}
                                  disabled={!user || sending || !body.trim()}
                                  className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 border border-cyan-500/30"
                                >
                                  {sending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Sending…
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4" />
                                      {replyTo ? "Send reply" : "Send comment"}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">Discussions</p>
                              <p className="text-xs text-white/55 mt-0.5">
                                Each topic has comments and nested replies. Open one to read or participate.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 min-w-[5.5rem] border-white/20 bg-white/5 text-white hover:bg-white/10"
                                disabled={refreshing}
                                onClick={() => void loadAll("refresh")}
                                aria-label={refreshing ? "Refreshing" : "Refresh"}
                                title="Refresh"
                              >
                                {refreshing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  "Refresh"
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 border border-cyan-500/30"
                                disabled={!user}
                                onClick={() => {
                                  setCreateFormError("");
                                  setCreateDiscussionOpen(true);
                                }}
                              >
                                <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
                                New discussion
                              </Button>
                            </div>
                          </div>
                          {!user ? (
                            <p className="text-sm text-white/50">
                              Sign in to start a discussion.
                            </p>
                          ) : null}

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/50 px-1">
                              Discussions ({discussionListItems.length})
                            </p>
                            {discussionListItems.length === 0 ? (
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                                <p className="text-sm font-semibold text-white/80">No discussions yet</p>
                                <p className="mt-1 text-sm text-white/55">
                                  Use New discussion to open a topic, or check back later.
                                </p>
                              </div>
                            ) : (
                              discussionListItems.map((d) => {
                                const n = countDescendantComments(d.id, thread.repliesByParent);
                                const desc = rootDiscussionDescription(d);
                                const descPreview =
                                  desc.length > 140 ? `${desc.slice(0, 140)}…` : desc;
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => openDiscussion(d.id)}
                                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white line-clamp-2">
                                          {rootDiscussionTitle(d)}
                                        </p>
                                        <p className="mt-1.5 text-sm text-white/55 line-clamp-2 whitespace-pre-wrap">
                                          {descPreview}
                                        </p>
                                        <p className="mt-2 text-xs text-white/45">
                                          {d.author_name || "Anonymous"} · {formatDateTime(d.created_at)}
                                          {n > 0 ? ` · ${n} comment${n === 1 ? "" : "s"}` : ""}
                                        </p>
                                      </div>
                                      <ChevronRight className="h-4 w-4 shrink-0 text-white/40 mt-0.5" />
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}
                    </section>

                    <aside className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">About Community</p>
                        <p className="mt-2 text-sm text-white/70 leading-relaxed">
                          Inside a discussion you can post comments and reply to other people&apos;s comments. Replies stay
                          threaded so the conversation stays easy to follow.
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Totals</p>
                        <p className="mt-1 text-sm font-semibold text-white/85">
                          {discussionListItems.length} discussion(s) · {messages.length} message(s)
                        </p>
                      </div>
                    </aside>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={createDiscussionOpen}
        onOpenChange={(open) => {
          setCreateDiscussionOpen(open);
          if (!open) {
            setCreateFormError("");
            setNewDiscussionTitle("");
            setNewDiscussionDescription("");
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="sm:max-w-lg border-white/10 bg-[#161c24] text-white shadow-xl gap-0 p-0 overflow-hidden"
        >
          <DialogHeader className="px-6 pt-6 pb-2 space-y-1.5">
            <DialogTitle className="text-white">New discussion</DialogTitle>
            <DialogDesc className="text-white/55 text-sm">
              Add a clear title and a short description. You can send follow-up messages after you open the thread.
            </DialogDesc>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {createFormError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {createFormError}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="discussion-title" className="text-white/80">
                Title
              </Label>
              <Input
                id="discussion-title"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                placeholder="e.g. Question about labeling format"
                disabled={createSending}
                className="border-white/15 bg-white/[0.06] text-white placeholder:text-white/35"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussion-description" className="text-white/80">
                Description
              </Label>
              <Textarea
                id="discussion-description"
                value={newDiscussionDescription}
                onChange={(e) => setNewDiscussionDescription(e.target.value)}
                placeholder="Describe what you want to discuss…"
                disabled={createSending}
                className="min-h-32 border-white/15 bg-white/[0.06] text-white placeholder:text-white/35"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-white/10 bg-white/[0.03] flex-row justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              disabled={createSending}
              onClick={() => setCreateDiscussionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-cyan-500/25 text-cyan-100 hover:bg-cyan-500/35 border border-cyan-500/35"
              disabled={
                createSending ||
                !newDiscussionTitle.trim() ||
                !newDiscussionDescription.trim()
              }
              onClick={() => void onCreateDiscussion()}
            >
              {createSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create discussion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

