"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversationMessages,
  getUserConversations,
  sendConversationMessage,
  uploadChatAttachment,
  type ChatConversation,
  type ProjectMessage,
} from "@/lib/services/chatService";
import { supabase } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ToastNotification from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";
import {
  Loader2,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Smile,
  SlidersHorizontal,
  Eye,
  MapPin,
  Phone,
  Video,
  MoreVertical,
  Pin,
  X,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { togglePin } from "@/lib/store/pinnedConversationsSlice";

function conversationKey(
  conversation: Pick<ChatConversation, "requestId" | "collectorId">,
) {
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

type PresenceState = "online" | "idle" | "offline";

function getPresenceState(
  lastActiveAt?: string | null,
  nowMs: number = Date.now(),
): PresenceState {
  if (!lastActiveAt) return "offline";
  const lastActiveMs = new Date(lastActiveAt).getTime();
  if (Number.isNaN(lastActiveMs)) return "offline";
  const minutesAway = (nowMs - lastActiveMs) / (1000 * 60);
  if (minutesAway >= 30) return "offline";
  if (minutesAway >= 15) return "idle";
  return "online";
}

function presenceMeta(state: PresenceState) {
  if (state === "online") {
    return {
      label: "Online",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (state === "idle") {
    return {
      label: "Idle",
      dotClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: "Offline",
    dotClass: "bg-slate-400",
    textClass: "text-slate-500 dark:text-slate-400",
  };
}

type TypingPayload = {
  requestId: string;
  collectorId: string;
  requesterId: string;
  senderId: string;
  senderName: string;
};

function MessageContent({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("http://") || part.startsWith("https://") ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
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
  const [attachmentFiles, setAttachmentFiles] = useState<
    { id: string; file: File; preview?: string }[]
  >([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const selectedKeyRef = useRef("");
  const conversationsRef = useRef<ChatConversation[]>([]);
  const emojiInputRef = useRef<HTMLTextAreaElement>(null);
  const presenceLastSyncedRef = useRef(0);
  const [presenceTick, setPresenceTick] = useState(Date.now());
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingSentRef = useRef<Record<string, boolean>>({});
  const typingLastSentRef = useRef<Record<string, number>>({});
  const typingIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const typingClearTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const previousSelectedKeyRef = useRef("");
  const TEXTAREA_LINE_HEIGHT_PX = 20;
  const TEXTAREA_MIN_LINES = 2;
  const TEXTAREA_MAX_LINES = 8;
  const textareaMinHeight = TEXTAREA_LINE_HEIGHT_PX * TEXTAREA_MIN_LINES;
  const textareaMaxHeight = TEXTAREA_LINE_HEIGHT_PX * TEXTAREA_MAX_LINES;
  useEffect(() => {
    const el = emojiInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const capped = Math.min(
      textareaMaxHeight,
      Math.max(textareaMinHeight, el.scrollHeight),
    );
    el.style.height = `${capped}px`;
  }, [draft, textareaMinHeight, textareaMaxHeight]);
  const EMOJIS = [
    "😀",
    "😁",
    "😂",
    "😊",
    "😍",
    "😎",
    "👍",
    "👏",
    "🙏",
    "🎉",
    "❤️",
    "🔥",
  ];
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    const { data, error: fetchError } = await getUserConversations(
      user.id,
      role,
    );
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
    () =>
      conversations.find((item) => conversationKey(item) === selectedKey) ||
      null,
    [conversations, selectedKey],
  );

  const clearTypingForKey = (key: string) => {
    setTypingMap((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const scheduleTypingClear = (key: string, delayMs = 4000) => {
    const existing = typingClearTimeoutsRef.current[key];
    if (existing) clearTimeout(existing);
    typingClearTimeoutsRef.current[key] = setTimeout(() => {
      clearTypingForKey(key);
      delete typingClearTimeoutsRef.current[key];
    }, delayMs);
  };

  const emitTypingEvent = (event: "typing" | "stop-typing", key?: string) => {
    if (!user?.id || !key) return;
    const channel = typingChannelRef.current;
    if (!channel) return;
    const conversation = conversationsRef.current.find(
      (item) => conversationKey(item) === key,
    );
    if (!conversation) return;

    const payload: TypingPayload = {
      requestId: conversation.requestId,
      collectorId: conversation.collectorId,
      requesterId: conversation.requesterId,
      senderId: user.id,
      senderName:
        profile?.full_name?.trim() || profile?.email || "Someone",
    };
    void channel.send({
      type: "broadcast",
      event,
      payload,
    });
  };

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
        selectedConversation.collectorId,
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

    const channel = supabase
      .channel("project-conversation-typing")
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: unknown }) => {
        const typingPayload = payload as TypingPayload;
        if (!typingPayload || typingPayload.senderId === user.id) return;
        const key = `${typingPayload.requestId}:${typingPayload.collectorId}`;
        const conversation = conversationsRef.current.find(
          (item) => conversationKey(item) === key,
        );
        if (!conversation) return;
        if (typingPayload.senderId !== conversation.counterpartId) return;

        setTypingMap((prev) => ({
          ...prev,
          [key]:
            typingPayload.senderName?.trim() ||
            conversation.counterpartName ||
            "Someone",
        }));
        scheduleTypingClear(key);
      })
      .on(
        "broadcast",
        { event: "stop-typing" },
        ({ payload }: { payload: unknown }) => {
        const typingPayload = payload as TypingPayload;
        if (!typingPayload || typingPayload.senderId === user.id) return;
        const key = `${typingPayload.requestId}:${typingPayload.collectorId}`;
        const conversation = conversationsRef.current.find(
          (item) => conversationKey(item) === key,
        );
        if (!conversation) return;
        if (typingPayload.senderId !== conversation.counterpartId) return;
          clearTypingForKey(key);
        },
      )
      .subscribe(
        (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR") => {
          if (status === "CHANNEL_ERROR") {
            console.warn("Typing indicator channel error");
          }
        },
      );

    typingChannelRef.current = channel;

    return () => {
      typingChannelRef.current = null;
      Object.values(typingClearTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout),
      );
      typingClearTimeoutsRef.current = {};
      supabase.removeChannel(channel);
    };
  }, [user?.id, isMessagingRole]);

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
            incoming.requester_id === user.id ||
            incoming.collector_id === user.id;
          if (!involvesCurrentUser) return;
          const key = `${incoming.request_id}:${incoming.collector_id}`;
          if (incoming.sender_id !== user.id) {
            clearTypingForKey(key);
          }

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
              prev.some((msg) => msg.id === incoming.id)
                ? prev
                : [...prev, incoming],
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
              (item) => conversationKey(item) === key,
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
          } else if (
            incoming.sender_id !== user.id &&
            selectedKeyRef.current !== key
          ) {
            setToast({ message: "New message received", type: "success" });
          }
        },
      )
      .subscribe(
        (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR") => {
          if (status === "CHANNEL_ERROR") {
            setError(
              "Realtime connection issue. Messages may require refresh.",
            );
          }
        },
      );

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isMessagingRole]);

  const pinnedKeys = useSelector(
    (state: RootState) => state.pinnedConversations,
  );
  const dispatch = useDispatch();

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = keyword
      ? conversations.filter((conversation) => {
          return (
            conversation.counterpartName.toLowerCase().includes(keyword) ||
            conversation.projectTitle.toLowerCase().includes(keyword)
          );
        })
      : [...conversations];
    // Pinned first, then by existing order
    return list.sort((a, b) => {
      const aKey = conversationKey(a);
      const bKey = conversationKey(b);
      const aPinned = pinnedKeys.includes(aKey);
      const bPinned = pinnedKeys.includes(bKey);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [conversations, search, pinnedKeys]);

  const activeTypingName = selectedConversation
    ? typingMap[conversationKey(selectedConversation)] || ""
    : "";

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  useEffect(() => {
    if (!isMessagingRole) return;
    if (notificationPermission === "default") {
      void requestNotificationPermission();
    }
  }, [notificationPermission, isMessagingRole]);

  useEffect(() => {
    if (!selectedConversation || !isMessagingRole) return;
    const currentKey = conversationKey(selectedConversation);
    const previousKey = previousSelectedKeyRef.current;

    if (
      previousKey &&
      previousKey !== currentKey &&
      typingSentRef.current[previousKey]
    ) {
      emitTypingEvent("stop-typing", previousKey);
      typingSentRef.current[previousKey] = false;
      delete typingLastSentRef.current[previousKey];
    }

    previousSelectedKeyRef.current = currentKey;
  }, [selectedConversation, isMessagingRole]);

  useEffect(() => {
    if (!selectedConversation || !user?.id || !isMessagingRole) return;
    const key = conversationKey(selectedConversation);
    const hasText = draft.trim().length > 0;
    const now = Date.now();
    const wasTyping = Boolean(typingSentRef.current[key]);
    const lastSentAt = typingLastSentRef.current[key] || 0;

    if (!hasText) {
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
        typingIdleTimeoutRef.current = null;
      }
      if (wasTyping) {
        emitTypingEvent("stop-typing", key);
        typingSentRef.current[key] = false;
        delete typingLastSentRef.current[key];
      }
      return;
    }

    if (!wasTyping || now - lastSentAt > 2000) {
      emitTypingEvent("typing", key);
      typingSentRef.current[key] = true;
      typingLastSentRef.current[key] = now;
    }

    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }
    typingIdleTimeoutRef.current = setTimeout(() => {
      if (!typingSentRef.current[key]) return;
      emitTypingEvent("stop-typing", key);
      typingSentRef.current[key] = false;
      delete typingLastSentRef.current[key];
    }, 2500);

    return () => {
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
        typingIdleTimeoutRef.current = null;
      }
    };
  }, [draft, selectedConversation, user?.id, isMessagingRole]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPresenceTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?.id || !isMessagingRole) return;

    const syncPresence = async (force = false) => {
      const now = Date.now();
      if (!force && now - presenceLastSyncedRef.current < 60_000) return;
      presenceLastSyncedRef.current = now;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ last_active_at: new Date(now).toISOString() })
        .eq("id", user.id);

      if (updateError) {
        // Presence updates are best-effort; chat should keep working even when this fails.
        console.warn("Failed to update presence", updateError.message);
      }
    };

    void syncPresence(true);
    const heartbeat = window.setInterval(() => {
      void syncPresence();
    }, 5 * 60_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncPresence(true);
      }
    };

    const onFocus = () => void syncPresence(true);
    const onPointerDown = () => void syncPresence();
    const onKeyDown = () => void syncPresence();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [user?.id, isMessagingRole]);

  const handleSend = async () => {
    if (!selectedConversation || !user?.id || sending) return;
    const key = conversationKey(selectedConversation);
    const hasText = draft.trim().length > 0;
    const hasAttachments = attachmentFiles.length > 0;
    if (!hasText && !hasAttachments) return;

    if (typingSentRef.current[key]) {
      emitTypingEvent("stop-typing", key);
      typingSentRef.current[key] = false;
      delete typingLastSentRef.current[key];
    }
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }

    setSending(true);
    setError("");

    let messageText = draft.trim();
    if (attachmentFiles.length > 0) {
      const urls: string[] = [];
      for (const { file } of attachmentFiles) {
        const { url, error: uploadErr } = await uploadChatAttachment(
          selectedConversation.requestId,
          selectedConversation.collectorId,
          file,
        );
        if (uploadErr) {
          setError(uploadErr.message || "Failed to upload attachment");
          setSending(false);
          return;
        }
        if (url) urls.push(`${file.name}: ${url}`);
      }
      const attachmentLines = urls.join("\n");
      messageText = messageText
        ? `${messageText}\n\n${attachmentLines}`
        : `📎 Attachment(s)\n\n${attachmentLines}`;
    }

    const { data, error: sendError } = await sendConversationMessage({
      requestId: selectedConversation.requestId,
      collectorId: selectedConversation.collectorId,
      requesterId: selectedConversation.requesterId,
      senderId: user.id,
      message: messageText,
    });

    if (sendError || !data) {
      setError(sendError?.message || "Failed to send message");
      setSending(false);
      return;
    }

    attachmentFiles.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    setAttachmentFiles([]);

    setMessages((prev) =>
      prev.some((msg) => msg.id === data.id) ? prev : [...prev, data],
    );
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

  const ACCEPTED_ATTACHMENT_TYPES = "image/*,.pdf,.doc,.docx,.txt";
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_SIZE_MB = 10;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    setAttachmentFiles((prev) => {
      const next = [...prev];
      for (let i = 0; i < chosen.length && next.length < MAX_ATTACHMENTS; i++) {
        const file = chosen[i];
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) continue;
        const id = `${Date.now()}_${i}_${file.name}`;
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
        next.push({ id, file, preview });
      }
      return next;
    });
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachmentFiles((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  // if (!isMessagingRole) {
  //   return (
  //     <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
  //       Messaging is available for requester and collector accounts.
  //     </div>
  //   );
  // }

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
      <div>
        <div
          className={cn(
            "flex h-[calc(100dvh-114px)]",
            role === "collector" ? "mr-0 ml-0 pt-4" : "mr-2 ml-2",
          )}
        >
          <aside className="hidden w-80 bg-white dark:bg-gray-800 rounded-2xl p-3 sm:flex sm:flex-col mr-6">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-lg font-semibold leading-tight">
                  Messages
                </h2>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-gray-50 dark:bg-[#2B3544] px-3 py-1.5 text-xs shadow-sm">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-7 flex-1 border-0 bg-gray-50 dark:bg-[#2B3544] text-muted-foreground p-0 !text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Search messages or projects..."
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="btn-gelatine h-10 w-10 shrink-0 rounded-2xl border-none bg-gray-50 dark:bg-gray-700/50 text-muted-foreground hover:text-foreground shadow-sm"
                aria-label="Filter conversations"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 dashboard-scrollbar">
              <div className="space-y-1">
                {loadingConversations ? (
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="flex w-full gap-2 rounded-2xl px-2.5 py-2"
                      >
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-3.5 w-24 rounded-md" />
                            <Skeleton className="h-3 w-10 shrink-0 rounded-md" />
                          </div>
                          <Skeleton className="h-3 w-full max-w-[180px] rounded-md" />
                          <Skeleton className="h-2.5 w-32 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Conversations will appear here
                  </p>
                ) : (
                  filteredConversations.map((conversation) => {
                    const key = conversationKey(conversation);
                    const unread = unreadMap[key] || 0;
                    const isActive = selectedKey === key;
                    const currentPresence = presenceMeta(
                      getPresenceState(
                        conversation.counterpartLastActiveAt,
                        presenceTick,
                      ),
                    );
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedKey(key)}
                        className={cn(
                          "group relative flex w-full gap-2 rounded-2xl px-2.5 py-2 text-left text-xs transition-all",
                          isActive ? "bg-primary/10" : "hover:bg-muted/80",
                        )}
                      >
                        <span className="relative mt-0.5 shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                conversation.counterpartAvatar ||
                                "/default-avatar.svg"
                              }
                            />
                            <AvatarFallback className="text-[11px] font-medium">
                              {conversation.counterpartName
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute top-7 -right-0.5 h-3 w-3 rounded-full border-2",
                              currentPresence.dotClass,
                              isActive
                                ? isDark
                                  ? "border-[#102938]"
                                  : "border-[#DCEFF6]"
                                : isDark
                                  ? "border-background"
                                  : "border-background",
                            )}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-medium">
                              {conversation.counterpartName}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {timeLabel(
                                  conversation.lastMessage?.created_at ||
                                    conversation.assignedAt,
                                )}
                              </span>
                              {pinnedKeys.includes(key) && (
                                <span
                                  className="flex h-5 w-5 items-center justify-center rounded-full rotate-45"
                                  aria-hidden
                                >
                                  <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground w-48">
                            {conversation.lastMessage?.message ||
                              conversation.projectTitle}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground/80">
                            {conversation.projectTitle}
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-medium",
                              currentPresence.textClass,
                            )}
                          >
                            {currentPresence.label}
                          </p>
                        </div>
                        {unread > 0 ? (
                          <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                            {unread}
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <section className="flex flex-1 flex-col rounded-xl">
            {!selectedConversation ? (
              <div className="flex h-[calc(100vh-114px)] flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary shadow-sm">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    Welcome to Messages
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Once you connect with a partner, your conversations and
                    project discussions will appear here.
                  </p>
                </div>
                <Button
                  className="mt-2"
                  onClick={() => router.push("/dashboard/projects/find")}
                  size="sm"
                >
                  Browse open jobs
                </Button>
              </div>
            ) : (
              <div className="flex h-[calc(100vh-114px)] flex-col rounded-2xl">
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                  <div className="flex flex-1 flex-col">
                    <ScrollArea className="flex-1 bg-white dark:bg-gray-800 h-[calc(100vh-108px)] overflow-y-auto dashboard-scrollbar rounded-t-2xl pt-2">
                      <div className="mx-auto flex w-full flex-col gap-6 px-5 py-4">
                        {loadingMessages ? (
                          <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                              <Skeleton className="h-5 w-24 rounded-full" />
                              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                            </div>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 w-full"
                              >
                                <Skeleton className="mt-0.5 h-10 w-10 shrink-0 rounded-full" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <Skeleton className="h-3 w-20 rounded-md" />
                                    <Skeleton className="h-3 w-12 shrink-0 rounded-md" />
                                  </div>
                                  <Skeleton
                                    className={
                                      i % 2 === 1
                                        ? "h-4 w-full max-w-[280px] rounded-md"
                                        : "h-4 w-full max-w-[200px] rounded-md"
                                    }
                                  />
                                  {i % 2 === 0 ? (
                                    <Skeleton className="h-4 w-full max-w-[180px] rounded-md" />
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : messages.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">
                            No messages yet. Start the conversation.
                          </p>
                        ) : (
                          messages.map((message, index) => {
                            const mine = message.sender_id === user?.id;
                            const selectedPresence = presenceMeta(
                              getPresenceState(
                                selectedConversation.counterpartLastActiveAt,
                                presenceTick,
                              ),
                            );
                            const previous = messages[index - 1];
                            const showDateDivider =
                              !previous ||
                              new Date(previous.created_at).toDateString() !==
                                new Date(message.created_at).toDateString();

                            return (
                              <Fragment key={message.id}>
                                {showDateDivider ? (
                                  <div className="my-4 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                    <span className="rounded-full bg-gray-50 dark:bg-gray-700 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                      {new Date(
                                        message.created_at,
                                      ).toLocaleDateString([], {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                  </div>
                                ) : null}
                                <div
                                  className={cn(
                                    "flex items-start gap-3 w-full",
                                    mine && "md:justify-start",
                                  )}
                                >
                                  {!mine ? (
                                    <div className="relative mt-0.5 h-10 w-10 shrink-0">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage
                                          src={
                                            selectedConversation.counterpartAvatar ||
                                            "/default-avatar.svg"
                                          }
                                        />
                                        <AvatarFallback className="text-[11px] font-medium">
                                          {selectedConversation.counterpartName
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span
                                        className={cn(
                                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                          selectedPresence.dotClass,
                                        )}
                                        title={selectedPresence.label}
                                        aria-hidden
                                      />
                                    </div>
                                  ) : (
                                    <div className="relative mt-0.5 h-10 w-10 shrink-0 hidden md:block">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage
                                          src={
                                            profile?.avatar_url ||
                                            "/default-avatar.svg"
                                          }
                                        />
                                        <AvatarFallback className="text-[11px] font-medium">
                                          {profile?.full_name
                                            ?.slice(0, 2)
                                            .toUpperCase() || "YO"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span
                                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"
                                        title="Available"
                                        aria-hidden
                                      />
                                    </div>
                                  )}
                                  <div
                                    className={cn(
                                      "min-w-0 flex-1 text-left",
                                      mine && "text-right md:text-left",
                                    )}
                                  >
                                    {mine ? (
                                      <>
                                        {/* Mobile: time left, You right (same row); content below right-aligned */}
                                        <div className="flex flex-col gap-0 md:hidden">
                                          <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-[11px] text-muted-foreground shrink-0">
                                              {timeLabel(message.created_at)}
                                            </span>
                                            <p className="text-xs font-medium">
                                              You
                                            </p>
                                          </div>
                                          <p className="mt-1 text-sm text-foreground text-right">
                                            <MessageContent
                                              text={message.message}
                                            />
                                          </p>
                                        </div>
                                        {/* Desktop: same structure as other user */}
                                        <div className="hidden md:block">
                                          <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-xs font-medium">
                                              You
                                            </p>
                                            <span className="text-[11px] text-muted-foreground shrink-0">
                                              {timeLabel(message.created_at)}
                                            </span>
                                          </div>
                                          <p className="mt-1 text-sm text-foreground">
                                            <MessageContent
                                              text={message.message}
                                            />
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-baseline justify-between gap-2">
                                          <p className="text-xs font-medium">
                                            {
                                              selectedConversation.counterpartName
                                            }
                                          </p>
                                          <span className="text-[11px] text-muted-foreground shrink-0">
                                            {timeLabel(message.created_at)}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-foreground">
                                          <MessageContent
                                            text={message.message}
                                          />
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </Fragment>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="bg-white dark:bg-gray-800 p-3 backdrop-blur rounded-b-2xl">
                      {error ? (
                        <p className="mb-2 text-xs text-red-500">{error}</p>
                      ) : null}
                      {activeTypingName ? (
                        <p className="mb-2 text-xs text-muted-foreground">
                          {activeTypingName} is typing...
                        </p>
                      ) : null}
                      <div className="relative" ref={composerRef}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ACCEPTED_ATTACHMENT_TYPES}
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          aria-label="Attach file"
                        />
                        <div className="flex flex-col gap-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 px-2 py-2 shadow-sm">
                          {attachmentFiles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {attachmentFiles.map(({ id, file, preview }) => (
                                <div
                                  key={id}
                                  className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-1.5 pr-8"
                                >
                                  {preview ? (
                                    <img
                                      src={preview}
                                      alt=""
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span
                                    className="max-w-24 truncate text-xs text-foreground"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 h-6 w-6 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => removeAttachment(id)}
                                    aria-label={`Remove ${file.name}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <textarea
                            ref={emojiInputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Send a message..."
                            rows={3}
                            className="min-h-[36px] max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void handleSend();
                              }
                            }}
                            disabled={sending}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="btn-gelatine h-9 w-9 shrink-0 rounded-full border-none bg-transparent text-muted-foreground hover:bg-background self-end"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={
                                  sending ||
                                  attachmentFiles.length >= MAX_ATTACHMENTS
                                }
                                aria-label="Attach file"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="btn-gelatine h-9 w-9 shrink-0 rounded-full border-none bg-transparent text-muted-foreground hover:bg-background self-end"
                                onClick={() =>
                                  setShowEmojiPicker((prev) => !prev)
                                }
                                aria-label="Open emoji picker"
                              >
                                <Smile className="h-4 w-4" />
                              </Button>
                            </div>
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

                            <Button
                              variant="ghost"
                              onClick={handleSend}
                              disabled={
                                sending ||
                                (!draft.trim() && attachmentFiles.length === 0)
                              }
                              size="icon"
                              className="btn-gelatine h-9 w-9 shrink-0 rounded-full bg-transparent text-muted-foreground hover:bg-background self-end"
                              type="button"
                            >
                              {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="hidden w-70 flex-col bg-transparent text-xs lg:flex pl-6">
                    <div className="rounded-2xl bg-white dark:bg-gray-800 p-3 mb-6">
                      <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="btn-gelatine h-10 w-10 rounded-full border-none bg-gray-50 dark:bg-gray-700/50 text-muted-foreground hover:text-foreground"
                          type="button"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="btn-gelatine h-10 w-10 rounded-full border-none bg-gray-50 dark:bg-gray-700/50 text-muted-foreground hover:text-foreground"
                          type="button"
                        >
                          <Video className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "btn-gelatine h-10 w-10 rounded-full border-none bg-gray-50 dark:bg-gray-700/50 text-muted-foreground hover:text-foreground",
                            selectedConversation &&
                              pinnedKeys.includes(
                                conversationKey(selectedConversation),
                              ) &&
                              "bg-primary/10 text-primary",
                          )}
                          type="button"
                          onClick={() => {
                            if (selectedConversation) {
                              dispatch(
                                togglePin(
                                  conversationKey(selectedConversation),
                                ),
                              );
                            }
                          }}
                          aria-label={
                            selectedConversation &&
                            pinnedKeys.includes(
                              conversationKey(selectedConversation),
                            )
                              ? "Unpin conversation"
                              : "Pin conversation"
                          }
                        >
                          <Pin
                            className={cn(
                              "h-3.5 w-3.5",
                              selectedConversation &&
                                pinnedKeys.includes(
                                  conversationKey(selectedConversation),
                                ) &&
                                "fill-current rotate-45",
                            )}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="btn-gelatine h-10 w-10 rounded-full border-none bg-gray-50 dark:bg-gray-700/50 text-muted-foreground hover:text-foreground"
                          type="button"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4 rounded-2xl bg-white dark:bg-gray-800 p-3">
                      {/* Partner card */}
                      <div className="mt-3 flex flex-col items-center rounded-xl px-3 py-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                selectedConversation.counterpartAvatar ||
                                "/default-avatar.svg"
                              }
                            />
                            <AvatarFallback className="text-base font-medium">
                              {selectedConversation.counterpartName
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white dark:border-gray-800",
                              presenceMeta(
                                getPresenceState(
                                  selectedConversation.counterpartLastActiveAt,
                                  presenceTick,
                                ),
                              ).dotClass,
                            )}
                            title={
                              presenceMeta(
                                getPresenceState(
                                  selectedConversation.counterpartLastActiveAt,
                                  presenceTick,
                                ),
                              ).label
                            }
                          />
                        </div>
                        <p className="mt-2 text-center text-base font-semibold">
                          {selectedConversation.counterpartName}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs font-medium",
                            presenceMeta(
                              getPresenceState(
                                selectedConversation.counterpartLastActiveAt,
                                presenceTick,
                              ),
                            ).textClass,
                          )}
                        >
                          {
                            presenceMeta(
                              getPresenceState(
                                selectedConversation.counterpartLastActiveAt,
                                presenceTick,
                              ),
                            ).label
                          }
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {selectedConversation.counterpartAddress ||
                              "No address available"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          className="btn-gelatine mt-3 h-auto p-0 text-primary hover:text-primary/80 hover:bg-transparent"
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${selectedConversation.requestId}/workshop`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View project
                        </Button>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
