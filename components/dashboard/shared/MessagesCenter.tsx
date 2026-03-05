"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversationMessages,
  getUserConversations,
  sendConversationMessage,
  type ChatConversation,
  type ProjectMessage,
} from "@/lib/services/chatService";
import { supabase } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ToastNotification from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";
import {
  Bell,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Smile,
} from "lucide-react";

function conversationKey(conversation: Pick<ChatConversation, "requestId" | "collectorId">) {
  return `${conversation.requestId}:${conversation.collectorId}`;
}

function timeLabel(dateText?: string) {
  if (!dateText) return "";
  const date = new Date(dateText);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesCenter() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const selectedKeyRef = useRef("");
  const conversationsRef = useRef<ChatConversation[]>([]);
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const EMOJIS = ["😀", "😁", "😂", "😊", "😍", "😎", "👍", "👏", "🙏", "🎉", "❤️", "🔥"];

  const role = profile?.role || "";
  const isMessagingRole = role === "requester" || role === "collector";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  const loadConversations = async () => {
    if (!user?.id || !isMessagingRole) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }
    setLoadingConversations(true);
    setError("");
    const { data, error: fetchError } = await getUserConversations(user.id, role);
    if (fetchError) {
      setError(fetchError.message);
      setConversations([]);
    } else {
      setConversations(data || []);
      if ((data || []).length > 0 && !selectedKey) {
        setSelectedKey(conversationKey((data || [])[0]));
      }
    }
    setLoadingConversations(false);
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role, isMessagingRole]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => conversationKey(item) === selectedKey) || null,
    [conversations, selectedKey]
  );

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data, error: fetchError } = await getConversationMessages(
        selectedConversation.requestId,
        selectedConversation.collectorId
      );
      if (fetchError) {
        setError(fetchError.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    };

    const key = conversationKey(selectedConversation);
    setUnreadMap((prev) => ({ ...prev, [key]: 0 }));
    loadMessages();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!composerRef.current) return;
      if (!composerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!user?.id || !isMessagingRole) return;

    const channelName = `project-messages-${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
        },
        (payload: RealtimePostgresChangesPayload<ProjectMessage>) => {
          const incoming = payload.new as ProjectMessage;
          const involvesCurrentUser =
            incoming.requester_id === user.id || incoming.collector_id === user.id;
          if (!involvesCurrentUser) return;
          const key = `${incoming.request_id}:${incoming.collector_id}`;

          setConversations((prev) => {
            const idx = prev.findIndex((item) => conversationKey(item) === key);
            if (idx === -1) {
              void loadConversations();
              return prev;
            }
            const updated = [...prev];
            updated[idx] = { ...updated[idx], lastMessage: incoming };
            updated.sort((a, b) => {
              const aTime = a.lastMessage?.created_at || a.assignedAt;
              const bTime = b.lastMessage?.created_at || b.assignedAt;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
            return updated;
          });

          if (selectedKeyRef.current === key) {
            setMessages((prev) =>
              prev.some((msg) => msg.id === incoming.id) ? prev : [...prev, incoming]
            );
          } else if (incoming.sender_id !== user.id) {
            setUnreadMap((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
          }

          if (
            incoming.sender_id !== user.id &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const conversation = conversationsRef.current.find(
              (item) => conversationKey(item) === key
            );
            const title = conversation?.counterpartName || "New message";
            const body =
              incoming.message.length > 120
                ? `${incoming.message.slice(0, 120)}...`
                : incoming.message;
            const notification = new Notification(title, {
              body,
              tag: `dataw-${key}`,
            });
            notification.onclick = () => {
              window.focus();
            };
          } else if (incoming.sender_id !== user.id && selectedKeyRef.current !== key) {
            setToast({ message: "New message received", type: "success" });
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Realtime connection issue. Messages may require refresh.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isMessagingRole]);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conversation) => {
      return (
        conversation.counterpartName.toLowerCase().includes(keyword) ||
        conversation.projectTitle.toLowerCase().includes(keyword)
      );
    });
  }, [conversations, search]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleSend = async () => {
    if (!selectedConversation || !user?.id || sending) return;
    if (!draft.trim()) return;

    setSending(true);
    setError("");
    const { data, error: sendError } = await sendConversationMessage({
      requestId: selectedConversation.requestId,
      collectorId: selectedConversation.collectorId,
      requesterId: selectedConversation.requesterId,
      senderId: user.id,
      message: draft,
    });

    if (sendError || !data) {
      setError(sendError?.message || "Failed to send message");
      setSending(false);
      return;
    }

    const key = conversationKey(selectedConversation);
    setMessages((prev) => (prev.some((msg) => msg.id === data.id) ? prev : [...prev, data]));
    setConversations((prev) => {
      const idx = prev.findIndex((item) => conversationKey(item) === key);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], lastMessage: data };
      updated.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.assignedAt;
        const bTime = b.lastMessage?.created_at || b.assignedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      return updated;
    });
    setDraft("");
    setSending(false);
  };

  const insertEmoji = (emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
    emojiInputRef.current?.focus();
  };

  if (!isMessagingRole) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Messaging is available for requester and collector accounts.
      </div>
    );
  }

  return (
    <>
      {toast ? (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      ) : null}
      <Card className="h-[calc(100dvh-190px)] overflow-hidden border bg-card">
        <div className="flex h-full">
        <aside className="w-[300px] border-r bg-muted/30">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={requestNotificationPermission}
                disabled={notificationPermission === "granted"}
                className="h-8 gap-1 text-xs"
              >
                <Bell className="h-3.5 w-3.5" />
                {notificationPermission === "granted"
                  ? "Notifications on"
                  : "Enable alerts"}
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 pl-8"
                placeholder="Search"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-92px)]">
            <div className="p-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Conversations will appear here
                </p>
              ) : (
                filteredConversations.map((conversation) => {
                  const key = conversationKey(conversation);
                  const unread = unreadMap[key] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={cn(
                        "mb-1 w-full rounded-lg border px-2 py-2 text-left transition-colors",
                        selectedKey === key
                          ? "border-primary/30 bg-primary/10"
                          : "border-transparent hover:bg-accent"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conversation.counterpartAvatar || undefined} />
                          <AvatarFallback>
                            {conversation.counterpartName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {conversation.counterpartName}
                            </p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {timeLabel(
                                conversation.lastMessage?.created_at || conversation.assignedAt
                              )}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {conversation.lastMessage?.message || conversation.projectTitle}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground/80">
                            {conversation.projectTitle}
                          </p>
                        </div>
                        {unread > 0 ? (
                          <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                            {unread}
                          </Badge>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex-1 bg-background">
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageCircle className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="text-2xl font-semibold">Welcome to Messages</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Once you connect with a partner, you can chat and collaborate here.
              </p>
              <Button className="mt-5" onClick={() => router.push("/dashboard/projects/find")}>
                Search for jobs
              </Button>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConversation.counterpartAvatar || undefined} />
                    <AvatarFallback>
                      {selectedConversation.counterpartName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selectedConversation.counterpartName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedConversation.projectTitle}
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-muted/10">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-5 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No messages yet. Start the conversation.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", mine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "border bg-card text-foreground"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.message}</p>
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                mine
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {timeLabel(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t bg-card p-3">
                {error ? <p className="mb-2 text-xs text-red-500">{error}</p> : null}
                <div className="relative flex items-center gap-2" ref={composerRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Open emoji picker"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  {showEmojiPicker ? (
                    <div className="absolute bottom-12 left-0 z-20 w-56 rounded-md border bg-card p-2 shadow-lg">
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="rounded p-1 text-lg hover:bg-accent"
                            aria-label={`Insert ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Input
                    ref={emojiInputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button onClick={handleSend} disabled={sending || !draft.trim()} className="gap-1">
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
        </div>
      </Card>
    </>
  );
}
