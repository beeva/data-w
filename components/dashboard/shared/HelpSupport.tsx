"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, supabase } from "@/lib/supabase/client";
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
  HelpCircle,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  Bot,
  User,
  Loader2,
  ExternalLink,
  Book,
  Video,
  Zap,
  Inbox,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "support" | "bot";
  timestamp: Date;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create my first project?",
    answer: "Navigate to Projects > Create New Project. Fill in the project details including title, description, data requirements, budget, and deadline. Once submitted, collectors can start working on your project.",
  },
  {
    category: "Getting Started",
    question: "What are the different user roles?",
    answer: "DataW has 4 roles: Requesters (create projects and pay for data), Collectors (gather data and earn money), Agents (validate submissions), and Admins (manage the platform).",
  },
  {
    category: "Payments",
    question: "How do payments work?",
    answer: "Requesters fund their projects upfront. When a collector's submission is validated and approved, payment is automatically released to their account. You can withdraw funds once they reach the minimum threshold.",
  },
  {
    category: "Payments",
    question: "What payment methods are accepted?",
    answer: "We accept major credit cards (Visa, MasterCard, AmEx), PayPal, and bank transfers. Collectors can receive payments via PayPal or direct bank deposit.",
  },
  {
    category: "Projects",
    question: "How long does validation take?",
    answer: "Most submissions are validated within 24-48 hours. AI-assisted validation helps speed up the process by pre-screening submissions for quality and compliance.",
  },
  {
    category: "Projects",
    question: "Can I edit my project after publishing?",
    answer: "Yes, you can edit project details while it's open. However, certain fields like budget cannot be reduced below already committed amounts. Go to Active Projects and click Edit.",
  },
  {
    category: "Account",
    question: "How do I change my account settings?",
    answer: "Go to Account Settings from the sidebar menu. You can update your profile picture, personal information, notification preferences, and security settings.",
  },
  {
    category: "Account",
    question: "How do I delete my account?",
    answer: "Contact our support team to request account deletion. Note that pending projects must be completed or cancelled, and all funds withdrawn before deletion.",
  },
];

const quickLinks = [
  { icon: Book, label: "Documentation", href: "#", color: "text-blue-500" },
  { icon: Video, label: "Video Tutorials", href: "#", color: "text-red-500" },
  { icon: Zap, label: "API Reference", href: "#", color: "text-yellow-500" },
  { icon: FileText, label: "Terms of Service", href: "#", color: "text-gray-500" },
];

// Simulated bot responses
const getBotResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("payment") || lowerMsg.includes("pay") || lowerMsg.includes("money")) {
    return "For payment-related queries, please check our FAQ section on Payments. If you need specific help, I'll connect you with a support agent.";
  }
  if (lowerMsg.includes("project") || lowerMsg.includes("create")) {
    return "To create a project, go to Projects > Create New. Need help with a specific step? I can guide you through it.";
  }
  if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
    return "Hello! 👋 I'm DataW Assistant. How can I help you today? You can ask about projects, payments, account settings, or any other questions.";
  }
  if (lowerMsg.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  return "I understand you need help. Let me connect you with a support agent who can better assist you. In the meantime, you can check our FAQ section for quick answers.";
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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
    if (!userId) { setTicketsLoading(false); return; }
    try {
      // const supabase = createClient();
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

  useEffect(() => { fetchMyTickets(); }, [fetchMyTickets]);

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    try {
      // const supabase = createClient();
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
          }))
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
      // const supabase = createClient();
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
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(message),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim() || !userId) return;
    setTicketSubmitting(true);
    try {
      // const supabase = createClient();
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

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="space-y-3 p-2 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-500/20 dark:via-indigo-500/10 dark:to-transparent rounded-lg px-4 py-3 border-l-4 border-blue-500">
        <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
        <p className="text-xs text-muted-foreground">Get help, find answers, or contact our support team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column - FAQ & Resources */}
        <div className="lg:col-span-2 space-y-3">
          {/* Quick Links */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold">Quick Resources</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="grid grid-cols-4 gap-2">
                {quickLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                    <span className="text-[9px] text-center">{link.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="space-y-3">
                {Object.entries(groupedFaqs).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((faq, idx) => {
                        const globalIdx = faqs.indexOf(faq);
                        return (
                          <div
                            key={idx}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === globalIdx ? null : globalIdx)}
                              className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <span className="text-[11px] font-medium">{faq.question}</span>
                              {expandedFaq === globalIdx ? (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                            {expandedFaq === globalIdx && (
                              <div className="px-3 py-2.5 text-[11px] leading-relaxed text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contact & Ticket */}
        <div className="space-y-3">
          {/* Contact Info */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-2">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">support@dataw.io</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-muted-foreground">Hours</p>
                  <p className="font-medium">Mon-Fri, 9AM-6PM EST</p>
                </div>
              </div>
              <Separator className="my-2" />
              <Button
                onClick={() => setChatOpen(true)}
                className="w-full h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* Submit Ticket */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Submit a Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              {ticketSubmitted ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-[11px] font-semibold">Ticket Submitted!</p>
                  <p className="text-[10px] text-muted-foreground">We'll respond within 24 hours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Subject</label>
                    <Input
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description..."
                      className="h-7 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Message</label>
                    <Textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="text-[11px] min-h-[80px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Priority</label>
                    <Select value={ticketPriority} onValueChange={setTicketPriority}>
                      <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-[11px]">Low</SelectItem>
                        <SelectItem value="normal" className="text-[11px]">Normal</SelectItem>
                        <SelectItem value="high" className="text-[11px]">High</SelectItem>
                        <SelectItem value="urgent" className="text-[11px]">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSubmitTicket}
                    disabled={!ticketSubject.trim() || !ticketMessage.trim() || ticketSubmitting}
                    className="w-full h-7 text-[10px]"
                  >
                    {ticketSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Submit Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="dark:bg-gray-800/50 border-none bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">Average Response Time</p>
                  <p className="text-[10px] text-muted-foreground">Under 2 hours during business hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Tickets */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-1">
            <Inbox className="w-3.5 h-3.5" />
            My Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : myTickets.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4">No tickets yet</p>
          ) : selectedTicket ? (
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedTicket(null); setTicketReplies([]); }}
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                ← Back to tickets
              </button>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold">{selectedTicket.subject}</h4>
                  <Badge
                    className={`text-[9px] capitalize ${
                      selectedTicket.status === "open" ? "bg-blue-500/20 text-blue-600" :
                      selectedTicket.status === "in_progress" ? "bg-yellow-500/20 text-yellow-600" :
                      selectedTicket.status === "resolved" ? "bg-green-500/20 text-green-600" :
                      "bg-gray-500/20 text-gray-600"
                    }`}
                    variant="secondary"
                  >
                    {selectedTicket.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{selectedTicket.message}</p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(selectedTicket.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Replies</p>
                {repliesLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  </div>
                ) : ticketReplies.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2">No replies yet</p>
                ) : (
                  ticketReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-lg p-2 text-[10px] ${
                        reply.role === "admin"
                          ? "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800"
                          : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">
                          {reply.role === "admin" ? "Support Team" : (reply.full_name || "You")}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(reply.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p>{reply.message}</p>
                    </div>
                  ))
                )}
              </div>

              {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
                    placeholder="Type a reply..."
                    className="h-7 text-[10px] flex-1"
                  />
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || replySubmitting}
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    {replySubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {myTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); fetchReplies(ticket.id); }}
                  className="w-full text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium truncate">{ticket.subject}</span>
                    <Badge
                      className={`text-[8px] capitalize flex-shrink-0 ${
                        ticket.status === "open" ? "bg-blue-500/20 text-blue-600" :
                        ticket.status === "in_progress" ? "bg-yellow-500/20 text-yellow-600" :
                        ticket.status === "resolved" ? "bg-green-500/20 text-green-600" :
                        "bg-gray-500/20 text-gray-600"
                      }`}
                      variant="secondary"
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{ticket.message}</p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">
                    {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                  <p className="text-[9px] text-primary-foreground/80">Online • Typically replies instantly</p>
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
                            msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
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
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
