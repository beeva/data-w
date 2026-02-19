"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface PendingSubmission {
  id: string;
  status: string;
  submitted_at: string;
  validation_score: number | null;
  project_title: string;
  project_category: string;
  collector_name: string | null;
  collector_email: string;
  collector_avatar: string | null;
  files_count: number;
}

interface AgentData {
  pendingCount: number;
  validatedToday: number;
  totalValidations: number;
  accuracyScore: number;
  pendingSubmissions: PendingSubmission[];
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id;

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const supabase = createClient();

      const { data: result, error: rpcError } = await supabase.rpc(
        "get_agent_dashboard",
        { p_agent_id: userId }
      );

      if (rpcError) throw rpcError;
      setData(result as AgentData);
    } catch (err: any) {
      console.error("Agent dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  const pendingCount = data?.pendingCount ?? 0;
  const validatedToday = data?.validatedToday ?? 0;
  const totalValidations = data?.totalValidations ?? 0;
  const accuracyScore = Number(data?.accuracyScore ?? 0);
  const pendingSubmissions = data?.pendingSubmissions ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-base font-semibold">Agent Dashboard</h1>
          <p className="text-[10px] text-muted-foreground">
            Review and validate submissions
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="h-6 text-[10px] px-2">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Validations
              </CardTitle>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-1">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Validated Today
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-1">{validatedToday}</p>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Validations
              </CardTitle>
              <FileCheck className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-1">
              {totalValidations.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accuracy Score
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-1">{accuracyScore.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Validation accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Validations List */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Pending Validations
          </CardTitle>
          <CardDescription>
            Review and validate submitted data collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No pending submissions to review
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={sub.collector_avatar || ""} />
                        <AvatarFallback className="text-[10px] bg-cyan-500 text-white">
                          {getInitials(sub.collector_name, sub.collector_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {sub.project_title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Submitted by {sub.collector_name || sub.collector_email} · {formatTimeAgo(sub.submitted_at)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            {sub.files_count} file{sub.files_count !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {sub.project_category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] flex-shrink-0"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
