"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Image,
  Video,
  FileAudio,
  MapPin,
  Calendar,
  Sparkles,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QueueItem {
  id: string;
  project_title: string;
  collector_name: string;
  collector_avatar: string | null;
  collector_rating: number;
  submitted_at: string;
  files_count: number;
  file_type: string;
  category: string;
  priority: "high" | "medium" | "low";
  ai_score: number;
  location: string | null;
}

export default function ValidationQueue() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  // Mock data for demonstration
  const mockQueue: QueueItem[] = [
    {
      id: "1",
      project_title: "Street Sign Photography",
      collector_name: "John Doe",
      collector_avatar: null,
      collector_rating: 4.8,
      submitted_at: "2026-01-27T08:30:00Z",
      files_count: 12,
      file_type: "image",
      category: "Photography",
      priority: "high",
      ai_score: 95,
      location: "Downtown, NY",
    },
    {
      id: "2",
      project_title: "Store Front Video Collection",
      collector_name: "Jane Smith",
      collector_avatar: null,
      collector_rating: 4.5,
      submitted_at: "2026-01-27T07:15:00Z",
      files_count: 5,
      file_type: "video",
      category: "Video",
      priority: "medium",
      ai_score: 88,
      location: "Brooklyn, NY",
    },
    {
      id: "3",
      project_title: "Traffic Sound Recording",
      collector_name: "Mike Johnson",
      collector_avatar: null,
      collector_rating: 4.2,
      submitted_at: "2026-01-27T06:45:00Z",
      files_count: 8,
      file_type: "audio",
      category: "Audio",
      priority: "low",
      ai_score: 72,
      location: "Manhattan, NY",
    },
    {
      id: "4",
      project_title: "Restaurant Menu Data",
      collector_name: "Sarah Williams",
      collector_avatar: null,
      collector_rating: 4.9,
      submitted_at: "2026-01-27T05:30:00Z",
      files_count: 20,
      file_type: "image",
      category: "Photography",
      priority: "high",
      ai_score: 98,
      location: "Queens, NY",
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setQueue(mockQueue);
      setLoading(false);
    }, 500);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">High Priority</Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>
        );
      case "low":
        return (
          <Badge variant="secondary">Low</Badge>
        );
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Video className="w-5 h-5 text-purple-500" />;
      case "audio":
        return <FileAudio className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const handleValidate = async (id: string, approve: boolean) => {
    setProcessingId(id);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setProcessingId(null);
  };

  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return true;
    return item.priority === filter;
  });

  const stats = {
    total: queue.length,
    high: queue.filter((q) => q.priority === "high").length,
    medium: queue.filter((q) => q.priority === "medium").length,
    low: queue.filter((q) => q.priority === "low").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validation Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review and validate data submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Queue</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.high}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.medium}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Priority</p>
                <p className="text-2xl font-bold mt-1 text-gray-600">{stats.low}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      {filteredQueue.length === 0 ? (
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Queue is Empty</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "All submissions have been validated"
                  : `No ${filter} priority items in queue`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQueue.map((item) => (
            <Card
              key={item.id}
              className="dark:bg-gray-800/50 border-none hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* File Type Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getFileTypeIcon(item.file_type)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold">
                            {item.project_title}
                          </h3>
                          {getPriorityBadge(item.priority)}
                          <Badge variant="outline">{item.category}</Badge>
                        </div>

                        {/* Collector Info */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={item.collector_avatar || ""} />
                              <AvatarFallback className="text-xs bg-cyan-500 text-white">
                                {item.collector_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {item.collector_name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ⭐ {item.collector_rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.submitted_at)}
                          </div>
                          {item.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {item.location}
                            </div>
                          )}
                        </div>

                        {/* File Info & AI Score */}
                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span>{item.files_count} files</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">AI Score:</span>
                            <span
                              className={`font-bold ${getAIScoreColor(
                                item.ai_score
                              )}`}
                            >
                              {item.ai_score}%
                            </span>
                            <Progress
                              value={item.ai_score}
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleValidate(item.id, true)}
                          disabled={processingId === item.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleValidate(item.id, false)}
                          disabled={processingId === item.id}
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
