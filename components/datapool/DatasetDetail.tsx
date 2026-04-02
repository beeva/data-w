"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { Tabs, TabsContent, TabsUnderlineList, TabsUnderlineTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createDataPoolDatasetMessage,
  getDataPoolDatasetById,
  listDataPoolDatasetFiles,
  listDataPoolDatasetMessages,
  type DataPoolDatasetDetail,
  type DataPoolDatasetFileRow,
  type DataPoolDatasetMessageRow,
} from "@/lib/services/dataPoolService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2, Send, ArrowLeft, MessageSquareText, FileText } from "lucide-react";

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

function MessageBubble({
  msg,
  isReply,
  onReply,
}: {
  msg: DataPoolDatasetMessageRow;
  isReply?: boolean;
  onReply: (msg: DataPoolDatasetMessageRow) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3",
        isReply && "ml-6 border-white/10 bg-white/[0.03]",
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-white/70 hover:text-white"
          onClick={() => onReply(msg)}
        >
          Reply
        </Button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
        {msg.body}
      </p>
    </div>
  );
}

export default function DatasetDetail({ datasetId }: { datasetId: string }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState<DataPoolDatasetDetail | null>(null);
  const [files, setFiles] = useState<DataPoolDatasetFileRow[]>([]);
  const [messages, setMessages] = useState<DataPoolDatasetMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<DataPoolDatasetMessageRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    const [dRes, fRes, mRes] = await Promise.all([
      getDataPoolDatasetById(datasetId),
      listDataPoolDatasetFiles(datasetId),
      listDataPoolDatasetMessages(datasetId),
    ]);

    if (dRes.error) {
      setError(dRes.error.message || "Failed to load dataset.");
      setDataset(null);
      setFiles([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    setDataset(dRes.data);
    setFiles(fRes.data ?? []);
    setMessages(mRes.data ?? []);
    setLoading(false);
  }, [datasetId]);

  useEffect(() => {
    void loadAll();
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

  const onSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    const { error } = await createDataPoolDatasetMessage({
      datasetId,
      body,
      parentId: replyTo?.id ?? null,
    });
    if (error) {
      setError(error.message || "Failed to send message.");
      setSending(false);
      return;
    }
    setBody("");
    setReplyTo(null);
    await loadAll();
    setSending(false);
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
              <Tabs defaultValue="card" className="w-full">
                <TabsUnderlineList className="border-white/10 px-6">
                  <TabsUnderlineTrigger value="card" className="text-white/70 data-[state=active]:text-white">
                    <FileText className="h-4 w-4" />
                    Dataset Card
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
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                          Attached files ({files.length})
                        </p>
                        <div className="mt-3 space-y-2">
                          {files.length === 0 ? (
                            <p className="text-sm text-white/60">No files uploaded yet.</p>
                          ) : (
                            files.map((f) => (
                              <a
                                key={f.id}
                                href={f.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:border-cyan-500/40 transition-colors"
                              >
                                <p className="text-sm font-semibold text-white/85 truncate">
                                  {f.file_name}
                                </p>
                                <p className="mt-0.5 text-xs text-white/50">
                                  {formatBytes(f.file_size)}{" "}
                                  {f.mime_type ? `• ${f.mime_type}` : ""}
                                </p>
                              </a>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Created</p>
                        <p className="mt-1 text-sm font-semibold text-white/85">{formatDateTime(dataset.created_at)}</p>
                      </div>
                    </aside>
                  </div>
                </TabsContent>

                <TabsContent value="community" className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 space-y-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">Start a discussion</p>
                            <p className="text-xs text-white/55 mt-1">
                              Post a message or reply to an existing one.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => void loadAll()}
                          >
                            Refresh
                          </Button>
                        </div>

                        {replyTo && (
                          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-white/60 truncate">
                                Replying to <span className="text-white/85 font-semibold">{replyTo.author_name || "Anonymous"}</span>
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
                                ? "Write a message…"
                                : "Log in to post a message."
                            }
                            disabled={!user || sending}
                            className="min-h-28 border-white/15 text-white placeholder:text-white/40"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              onClick={onSend}
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
                                  Send
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {thread.orphans.length > 0 &&
                          thread.orphans.map((m) => (
                            <MessageBubble
                              key={m.id}
                              msg={m}
                              onReply={(x) => setReplyTo(x)}
                            />
                          ))}

                        {thread.roots.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                            <p className="text-sm font-semibold text-white/80">No messages yet</p>
                            <p className="mt-1 text-sm text-white/55">
                              Be the first to start the conversation.
                            </p>
                          </div>
                        ) : (
                          thread.roots.map((root) => (
                            <div key={root.id} className="space-y-2">
                              <MessageBubble msg={root} onReply={(x) => setReplyTo(x)} />
                              {(thread.repliesByParent.get(root.id) ?? []).map((r) => (
                                <MessageBubble
                                  key={r.id}
                                  msg={r}
                                  isReply
                                  onReply={(x) => setReplyTo(x)}
                                />
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <aside className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">About this tab</p>
                        <p className="mt-2 text-sm text-white/70 leading-relaxed">
                          Community is a lightweight discussion thread attached to this dataset.
                          Replies nest one level to keep the page readable.
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Messages</p>
                        <p className="mt-1 text-sm font-semibold text-white/85">{messages.length}</p>
                      </div>
                    </aside>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

