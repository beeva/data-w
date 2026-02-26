"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  DollarSign,
  Calendar,
  Eye,
  Upload,
} from "lucide-react";

interface Submission {
  id: string;
  project_title: string;
  status: "pending" | "validated" | "rejected" | "disputed";
  submitted_at: string;
  validated_at: string | null;
  amount: number;
  files_count: number;
}

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "validated":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validated
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    validated: submissions.filter((s) => s.status === "validated").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    totalEarned: submissions
      .filter((s) => s.status === "validated")
      .reduce((sum, s) => sum + s.amount, 0),
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
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Track your data collection submissions and earnings
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {stats.pending}
                </p>
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
                <p className="text-sm text-muted-foreground">Validated</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.validated}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  ${stats.totalEarned.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="validated">Validated ({stats.validated})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        {["all", "pending", "validated", "rejected"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {submissions.length === 0 ? (
              <Card className="dark:bg-gray-800/50 border-none">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">
                      No submissions yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start collecting data to earn money
                    </p>
                    <Button>Find Projects</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              submissions
                .filter((s) => tabValue === "all" || s.status === tabValue)
                .map((submission) => (
                  <Card
                    key={submission.id}
                    className="dark:bg-gray-800/50 border-none hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {submission.project_title}
                            </h3>
                            {getStatusBadge(submission.status)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Submitted: {formatDate(submission.submitted_at)}</span>
                            </div>
                            {submission.validated_at && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Reviewed: {formatDate(submission.validated_at)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span>{submission.files_count} files</span>
                            </div>
                            {submission.status === "validated" && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  ${submission.amount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}

            {submissions.filter(
              (s) => tabValue === "all" || s.status === tabValue
            ).length === 0 &&
              submissions.length > 0 && (
                <Card className="dark:bg-gray-800/50 border-none">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No {tabValue} submissions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
