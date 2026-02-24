"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Send,
  ArrowLeft,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface TicketRow {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_avatar: string | null;
  user_role: string;
  reply_count: number;
}

interface ReplyRow {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { color: "bg-blue-500/20 text-blue-600", icon: Inbox },
  in_progress: { color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  resolved: { color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  closed: { color: "bg-gray-500/20 text-gray-500", icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-500",
  normal: "bg-blue-500/20 text-blue-600",
  high: "bg-orange-500/20 text-orange-600",
  urgent: "bg-red-500/20 text-red-600",
};

export default function AdminTickets() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<string>("no_change");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError("");

      const { data, error: rpcError } = await supabase.rpc("admin_get_tickets", {
        status_filter: statusFilter,
        search_term: searchTerm,
        result_limit: 50,
        result_offset: 0,
      });
      if (rpcError) throw rpcError;
      const result = data as { tickets: TicketRow[]; total: number };
      setTickets(result.tickets || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [userId, searchTerm, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => { fetchTickets(); }, 300);
    return () => clearTimeout(debounce);
  }, [fetchTickets]);

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_ticket_replies", {
        p_ticket_id: ticketId,
      });
      if (error) throw error;
      setReplies((data as ReplyRow[]) || []);
    } catch (err: any) {
      console.error("Error fetching replies:", err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const openTicket = (ticket: TicketRow) => {
    setSelectedTicket(ticket);
    setReplyText("");
    setReplyStatus("no_change");
    fetchReplies(ticket.id);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplySubmitting(true);
    try {
      const { error } = await supabase.rpc("admin_reply_ticket", {
        p_ticket_id: selectedTicket.id,
        p_message: replyText.trim(),
        p_status: replyStatus === "no_change" ? null : replyStatus,
      });
      if (error) throw error;

      setReplyText("");
      if (replyStatus !== "no_change") {
        setSelectedTicket({ ...selectedTicket, status: replyStatus as TicketStatus });
      }
      setReplyStatus("no_change");
      setToast({ message: "Reply sent", type: "success" });
      fetchReplies(selectedTicket.id);
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to send reply", type: "error" });
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc("admin_update_ticket_status", {
        p_ticket_id: ticketId,
        p_status: newStatus,
      });
      if (error) throw error;
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as TicketStatus });
      }
      setToast({ message: "Status updated", type: "success" });
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update", type: "error" });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  const statCounts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  // Detail view
  if (selectedTicket) {
    return (
      <>
        {toast && (
          <ToastNotification message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />
        )}
        <div className="space-y-4 p-6">
          <button
            onClick={() => { setSelectedTicket(null); setReplies([]); }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to tickets
          </button>

          <Card className="dark:bg-gray-800/50 border-none">
            <CardContent className="pt-6 space-y-4">
              {/* Ticket header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`${STATUS_CONFIG[selectedTicket.status]?.color} capitalize text-xs`}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="secondary" className={`${PRIORITY_COLORS[selectedTicket.priority]} capitalize text-xs`}>
                      {selectedTicket.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedTicket.created_at)}</span>
                  </div>
                </div>
                <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open" className="text-xs">Open</SelectItem>
                    <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                    <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User info */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedTicket.user_avatar || ""} />
                  <AvatarFallback className="bg-cyan-500 text-white text-xs">
                    {getInitials(selectedTicket.user_name, selectedTicket.user_email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{selectedTicket.user_name || "No name"}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedTicket.user_email} · {selectedTicket.user_role}</p>
                </div>
              </div>

              {/* Original message */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              <Separator />

              {/* Replies */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Conversation
                </h3>
                {repliesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No replies yet</p>
                ) : (
                  replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg text-sm ${
                        reply.role === "admin"
                          ? "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 ml-4"
                          : "bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">
                          {reply.role === "admin" ? "Admin" : (reply.full_name || reply.email)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply form */}
              <div className="space-y-2 pt-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="text-sm min-h-[80px] resize-none"
                />
                <div className="flex items-center gap-2 justify-between flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Set status:</span>
                    <Select value={replyStatus} onValueChange={setReplyStatus}>
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_change" className="text-xs">No change</SelectItem>
                        <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                        <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleReplySubmit} disabled={!replyText.trim() || replySubmitting} size="sm" className="h-7 text-xs">
                    {replySubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // List view
  return (
    <>
      {toast && (
        <ToastNotification message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />
      )}

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage tickets from users</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold mt-1">{total}</p>
            </CardContent>
          </Card>
          {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <Card key={s} className="dark:bg-gray-800/50 border-none">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{s.replace("_", " ")}</p>
                      <p className="text-2xl font-bold mt-1">{statCounts[s]}</p>
                    </div>
                    <Icon className={`w-6 h-6 ${cfg.color.split(" ")[1]}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets list */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-red-500">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchTickets}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                </Button>
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No tickets found</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={ticket.user_avatar || ""} />
                            <AvatarFallback className="bg-cyan-500 text-white text-[10px]">
                              {getInitials(ticket.user_name, ticket.user_email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {ticket.user_name || ticket.user_email} · {ticket.user_role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          {ticket.reply_count > 0 && (
                            <Badge variant="secondary" className="text-[10px] bg-gray-500/10">
                              <MessageSquare className="w-3 h-3 mr-0.5" />
                              {ticket.reply_count}
                            </Badge>
                          )}
                          <Badge variant="secondary" className={`${PRIORITY_COLORS[ticket.priority]} capitalize text-[10px]`}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="secondary" className={`${cfg.color} capitalize text-[10px]`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ml-11">
                        {ticket.message}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
