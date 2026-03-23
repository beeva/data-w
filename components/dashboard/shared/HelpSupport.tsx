"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  Bot,
  Loader2,
  Zap,
  Inbox,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "support" | "bot";
  timestamp: Date;
}

// Simulated bot responses
const getBotResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();

  if (
    lowerMsg.includes("payment") ||
    lowerMsg.includes("pay") ||
    lowerMsg.includes("money")
  ) {
    return "For payment-related queries, please check our Help Center. If you need specific help, I'll connect you with a support agent.";
  }
  if (lowerMsg.includes("project") || lowerMsg.includes("create")) {
    return "To create a project, go to Projects > Create New. Need help with a specific step? I can guide you through it.";
  }
  if (
    lowerMsg.includes("hello") ||
    lowerMsg.includes("hi") ||
    lowerMsg.includes("hey")
  ) {
    return "Hello! 👋 I'm DataW Assistant. How can I help you today? You can ask about projects, payments, account settings, or any other questions.";
  }
  if (lowerMsg.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  return "I understand you need help. Let me connect you with a support agent who can better assist you. In the meantime, you can check our Help Center for quick answers.";
};

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketReply {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  full_name: string | null;
  role: string;
}

export default function HelpSupport() {
  const { user, profile } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: `Hi ${profile?.full_name?.split(" ")[0] || "there"}! 👋 I'm DataW Assistant. How can I help you today?`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState<string>("normal");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id;

  const fetchMyTickets = useCallback(async () => {
    if (!userId) {
      setTicketsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) setMyTickets(data);
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setTicketsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    try {
      const { data, error } = await supabase
        .from("ticket_replies")
        .select("id, message, created_at, user_id, profiles(full_name, role)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setTicketReplies(
          data.map((r: any) => ({
            id: r.id,
            message: r.message,
            created_at: r.created_at,
            user_id: r.user_id,
            full_name: r.profiles?.full_name || null,
            role: r.profiles?.role || "user",
          })),
        );
      }
    } catch (e) {
      console.error("Error fetching replies:", e);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedTicket || !userId) return;
    setReplySubmitting(true);
    try {
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: userId,
        message: replyText.trim(),
      });
      if (!error) {
        setReplyText("");
        fetchReplies(selectedTicket.id);
      }
    } catch (e) {
      console.error("Error submitting reply:", e);
    } finally {
      setReplySubmitting(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      chatInputRef.current?.focus();
    }
  }, [chatOpen, chatMinimized]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(
      () => {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: getBotResponse(message),
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    );
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim() || !userId) return;
    setTicketSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: userId,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        priority: ticketPriority,
      });
      if (error) throw error;
      setTicketSubmitted(true);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("normal");
      fetchMyTickets();
      setTimeout(() => setTicketSubmitted(false), 3000);
    } catch (e) {
      console.error("Error submitting ticket:", e);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-2">
      {/* Page header */}
      <div className="pt-2 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Help & Support
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Contact our support team, submit a ticket, or start a live chat
        </p>
      </div>

      <div className="space-y-6">
        {/* Row 1: Contact Us (left ~1/3) | Submit a Ticket (right ~2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Contact Us */}
          <Card className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden lg:col-span-1">
            <CardHeader className="pt-4 pb-3 px-5 border-b border-gray-100 dark:border-gray-700/50">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-500" />
                </div>
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">support@dataw.io</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-medium text-sm">Mon-Fri, 9AM-6PM EST</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-medium">Avg. response</p>
                  <p className="text-xs text-muted-foreground">Under 2 hours</p>
                </div>
              </div>
              <Button
                onClick={() => setChatOpen(true)}
                className="w-full h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* Right - Submit a Ticket */}
          <Card className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden lg:col-span-2">
            <CardHeader className="pt-4 pb-3 px-5 border-b border-gray-100 dark:border-gray-700/50">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-500" />
                </div>
                Submit a Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              {ticketSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-base font-semibold">Ticket Submitted!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll respond within 24 hours
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground font-medium">
                      Subject
                    </label>
                    <Input
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue..."
                      className="h-10 text-sm mt-2 bg-gray-100 dark:bg-gray-800 border-none shadow-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground font-medium">
                      Message
                    </label>
                    <Textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="text-sm min-h-[120px] resize-none mt-2 bg-gray-100 dark:bg-gray-800 border-none shadow-none"
                    />
                  </div>
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground font-medium">
                        Priority
                      </label>
                      <Select
                        value={ticketPriority}
                        onValueChange={setTicketPriority}
                      >
                        <SelectTrigger className="h-10 text-sm mt-2 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" className="text-sm">
                            Low
                          </SelectItem>
                          <SelectItem value="normal" className="text-sm">
                            Normal
                          </SelectItem>
                          <SelectItem value="high" className="text-sm">
                            High
                          </SelectItem>
                          <SelectItem value="urgent" className="text-sm">
                            Urgent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleSubmitTicket}
                        disabled={
                          !ticketSubject.trim() ||
                          !ticketMessage.trim() ||
                          ticketSubmitting
                        }
                        className="h-10 px-6 text-sm"
                      >
                        {ticketSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Submit Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: My Tickets (full width) */}
        <Card className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden">
          <CardHeader className="pt-4 pb-3 px-5 border-b border-gray-100 dark:border-gray-700/50">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-cyan-500" />
              </div>
              My Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : myTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-cyan-500" />
                </div>
                <p className="text-sm font-medium text-foreground">No tickets yet</p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[240px]">
                  Submit a ticket above and we&apos;ll get back to you within 24 hours
                </p>
              </div>
            ) : selectedTicket ? (
              <div className="space-y-6">
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setTicketReplies([]);
                  }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to tickets
                </button>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h4 className="text-base font-semibold text-foreground">
                        {selectedTicket.subject}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          className={`text-xs font-medium capitalize ${
                            selectedTicket.status === "open"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : selectedTicket.status === "in_progress"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : selectedTicket.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                          variant="secondary"
                        >
                          {selectedTicket.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedTicket.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Replies
                  </h3>
                  {repliesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : ticketReplies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                      No replies yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {ticketReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`rounded-xl p-4 text-sm ${
                            reply.role === "admin"
                              ? "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200/80 dark:border-cyan-800"
                              : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">
                              {reply.role === "admin"
                                ? "Support Team"
                                : reply.full_name || "You"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedTicket.status !== "closed" &&
                  selectedTicket.status !== "resolved" && (
                    <div className="flex gap-3 pt-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleReplySubmit()
                        }
                        placeholder="Type your reply..."
                        className="h-10 text-sm flex-1 rounded-xl"
                      />
                      <Button
                        onClick={handleReplySubmit}
                        disabled={!replyText.trim() || replySubmitting}
                        size="sm"
                        className="h-10 px-4 rounded-xl"
                      >
                        {replySubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Reply
                      </Button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {myTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      fetchReplies(ticket.id);
                    }}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-cyan-200 dark:hover:border-cyan-800 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                      <FileText className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {ticket.subject}
                        </span>
                        <Badge
                          className={`text-[10px] font-medium capitalize flex-shrink-0 ${
                            ticket.status === "open"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : ticket.status === "in_progress"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : ticket.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                          variant="secondary"
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-cyan-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all hover:scale-105 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Chat Window */}
      {chatOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-lg overflow-hidden ${
            chatMinimized
              ? "bottom-6 right-6 w-64 h-10"
              : "bottom-6 right-6 w-80 h-[450px]"
          }`}
        >
          {/* Chat Header */}
          <div className="bg-primary text-primary-foreground px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold">DataW Support</p>
                {!chatMinimized && (
                  <p className="text-[9px] text-primary-foreground/80">
                    Online • Typically replies instantly
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatMinimized(!chatMinimized)}
                className="p-1 hover:bg-white/20 rounded"
              >
                {chatMinimized ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!chatMinimized && (
            <>
              <ScrollArea className="h-[350px] bg-gray-50 dark:bg-gray-900">
                <div className="p-3 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        } rounded-lg px-2.5 py-1.5`}
                      >
                        <p className="text-[11px]">{msg.content}</p>
                        <p
                          className={`text-[8px] mt-0.5 ${
                            msg.sender === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="flex items-center gap-2">
                  <Input
                    ref={chatInputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="h-8 text-[11px] flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    size="sm"
                    className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
