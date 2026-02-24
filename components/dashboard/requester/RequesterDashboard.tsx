"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByRequester, updateProjectStatus } from "@/lib/services/projectService";
import { getNotifications } from "@/lib/services/notificationService";
import { getSubmissionsByProject } from "@/lib/services/submissionService";
import type { Project, ProjectStatus } from "@/types/project";
import type { AppNotification } from "@/types/notification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Bell,
  Calendar,
  ArrowRight,
  Loader2,
  FileCheck,
  Eye,
  Timer,
  Zap,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RequesterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      // setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [projectsRes, notificationsRes] = await Promise.all([
          getProjectsByRequester(userId),
          getNotifications(10),
        ]);
        const allProjects = projectsRes.data || [];
        setProjects(allProjects);
        setNotifications(notificationsRes.data || []);

        // Fetch submission stats for all active projects to get pending count & progress
        const activeProjs = allProjects.filter((p) => p.status === "open");
        if (activeProjs.length > 0) {
          const statsResults = await Promise.all(
            activeProjs.map((p) => getSubmissionsByProject(p.id))
          );
          let totalPending = 0;
          const progressMap: Record<string, number> = {};

          statsResults.forEach((res, idx) => {
            const subs = res.data || [];
            const pending = subs.filter((s) => s.status === "pending").length;
            const validated = subs.filter((s) => s.status === "validated").length;
            totalPending += pending;

            const total = subs.length;
            progressMap[activeProjs[idx].id] =
              total > 0 ? Math.round((validated / total) * 100) : 0;
          });

          setPendingReviewCount(totalPending);
          setProjectProgress(progressMap);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        // setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";       // active
      case "paused": return "bg-yellow-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="w-3 h-3" />;      // active
      case "paused": return <Pause className="w-3 h-3" />;
      case "completed": return <CheckCircle2 className="w-3 h-3" />;
      case "cancelled": return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleResumeProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await updateProjectStatus(
        projectId,
        user.id,
        "open" as ProjectStatus
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as Project) : p))
        );
      }
    } catch (err) {
      console.error("Error resuming project:", err);
    }
  };

  const handlePauseProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await updateProjectStatus(
        projectId,
        user.id,
        "paused" as ProjectStatus
      );
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as Project) : p))
        );
      }
    } catch (err) {
      console.error("Error pausing project:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "submission_created": return <FileCheck className="w-3.5 h-3.5 text-cyan-500" />;
      case "submission_validated": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "submission_rejected": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case "proposal_submitted":
      case "proposal_received": return <FileCheck className="w-3.5 h-3.5 text-blue-500" />;
      case "proposal_accepted": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "proposal_rejected": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case "payment_completed": return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case "project_created":
      case "project_updated": return <FolderKanban className="w-3.5 h-3.5 text-cyan-500" />;
      case "assignment_created": return <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Bell className="w-3.5 h-3.5" />;
    }
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeProjects = projects.filter(p => p.status === "open");
  const pausedProjects = projects.filter(p => (p.status as string) === "paused");
  const completedProjects = projects.filter(p => p.status === "completed");
  const cancelledProjects = projects.filter(p => p.status === "cancelled");
  const upcomingDeadlines = projects
    .filter(p => p.deadline && p.status === "open")
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const getProjectProgress = (project: Project) => {
    return projectProgress[project.id] ?? 0;
  };

  const totalBudgetSpent = projects
    .filter((p) => p.status === "open" || p.status === "completed")
    .reduce((sum, p) => sum + p.budget, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">Welcome back!</h1>
          <p className="text-xs text-muted-foreground">Here's what's happening with your projects</p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard/projects/new")}
          size="sm" 
          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Zap className="w-3 h-3 mr-1" />
          New Project
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
                <p className="text-xl font-bold">{activeProjects.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Paused</p>
                <p className="text-xl font-bold">{pausedProjects.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Pause className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-xl font-bold">{completedProjects.length}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending Review</p>
                <p className="text-xl font-bold">{pendingReviewCount}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Budget</p>
                <p className="text-xl font-bold">${totalBudgetSpent.toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column - Projects */}
        <div className="lg:col-span-2 space-y-3">
          {/* Projects with Tabs */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-cyan-500" />
                  Projects
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-cyan-600"
                  onClick={() => router.push("/dashboard/projects/active")}
                >
                  Manage All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="h-7 w-full grid grid-cols-2 sm:grid-cols-4 mb-2">
                  <TabsTrigger value="active" className="text-[10px] h-6 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                    Active ({activeProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="paused" className="text-[10px] h-6 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                    Paused ({pausedProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-[10px] h-6 data-[state=active]:bg-gray-500 data-[state=active]:text-white">
                    Completed ({completedProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-[10px] h-6 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                    Cancelled ({cancelledProjects.length})
                  </TabsTrigger>
                </TabsList>

                {/* Active Projects Tab */}
                <TabsContent value="active" className="mt-0">
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-6">
                      <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No active projects</p>
                      <Button 
                        size="sm" 
                        className="mt-2 h-6 text-[10px]"
                        onClick={() => router.push("/dashboard/projects/new")}
                      >
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[220px]">
                      <div className="space-y-2 pr-2">
                        {activeProjects.map((project) => {
                          const progress = getProjectProgress(project);
                          return (
                            <div 
                              key={project.id}
                              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div 
                                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                  onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                                >
                                  <span className="text-xs font-medium truncate">{project.title}</span>
                                  <Badge 
                                    variant="secondary" 
                                    className={cn("text-[8px] px-1 py-0 text-white", getStatusColor(project.status))}
                                  >
                                    {getStatusIcon(project.status)}
                                    <span className="ml-0.5 capitalize">{project.status.replace("_", " ")}</span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-semibold text-cyan-600">{progress}%</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => { e.stopPropagation(); handlePauseProject(project.id); }}
                                    title="Pause Project"
                                  >
                                    <Pause className="w-3 h-3 text-yellow-500" />
                                  </Button>
                                </div>
                              </div>
                              <Progress value={progress} className="h-1" />
                              <div className="flex items-center justify-between mt-1.5 text-[9px] text-muted-foreground">
                                <span>${project.budget.toFixed(0)} budget</span>
                                <span>{project.max_collectors} collectors</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Paused Projects Tab */}
                <TabsContent value="paused" className="mt-0">
                  {pausedProjects.length === 0 ? (
                    <div className="text-center py-6">
                      <Pause className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No paused projects</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[220px]">
                      <div className="space-y-2 pr-2">
                        {pausedProjects.map((project) => {
                          const progress = getProjectProgress(project);
                          return (
                            <div 
                              key={project.id}
                              className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div 
                                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                  onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                                >
                                  <span className="text-xs font-medium truncate">{project.title}</span>
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0 text-white bg-yellow-500">
                                    <Pause className="w-3 h-3" />
                                    <span className="ml-0.5">Paused</span>
                                  </Badge>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-6 text-[9px] px-2 bg-green-500 hover:bg-green-600"
                                  onClick={(e) => { e.stopPropagation(); handleResumeProject(project.id); }}
                                >
                                  <Play className="w-3 h-3 mr-0.5" />
                                  Resume
                                </Button>
                              </div>
                              <Progress value={progress} className="h-1" />
                              <div className="flex items-center justify-between mt-1.5 text-[9px] text-muted-foreground">
                                <span>${project.budget.toFixed(0)} budget</span>
                                <span>Progress: {progress}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Completed Projects Tab */}
                <TabsContent value="completed" className="mt-0">
                  {completedProjects.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No completed projects yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[220px]">
                      <div className="space-y-2 pr-2">
                        {completedProjects.map((project) => (
                          <div 
                            key={project.id}
                            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium truncate">{project.title}</span>
                                <Badge variant="secondary" className="text-[8px] px-1 py-0 text-white bg-gray-500">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="ml-0.5">Completed</span>
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                              <span>${project.budget.toFixed(0)} total spent</span>
                              <span>100% complete</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Cancelled Projects Tab */}
                <TabsContent value="cancelled" className="mt-0">
                  {cancelledProjects.length === 0 ? (
                    <div className="text-center py-6">
                      <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No cancelled projects</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[220px]">
                      <div className="space-y-2 pr-2">
                        {cancelledProjects.map((project) => (
                          <div 
                            key={project.id}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer transition-colors opacity-70"
                            onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium truncate line-through">{project.title}</span>
                                <Badge variant="secondary" className="text-[8px] px-1 py-0 text-white bg-red-500">
                                  <XCircle className="w-3 h-3" />
                                  <span className="ml-0.5">Cancelled</span>
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                              <span>${project.budget.toFixed(0)} budget</span>
                              <span>Cancelled</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  {
                    label: "Active Budget",
                    amount: projects.filter((p) => p.status === "open").reduce((s, p) => s + p.budget, 0),
                    color: "bg-cyan-500/10",
                  },
                  {
                    label: "Completed",
                    amount: projects.filter((p) => p.status === "completed").reduce((s, p) => s + p.budget, 0),
                    color: "bg-green-500/10",
                  },
                  {
                    label: "Total Budget",
                    amount: totalBudgetSpent,
                    color: "bg-emerald-500/10",
                  },
                ].map((item) => (
                  <div key={item.label} className={cn("p-3 rounded-lg text-center", item.color)}>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-lg font-bold">${item.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Per-project budget bars */}
              {activeProjects.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Active Projects Budget</p>
                  {activeProjects.slice(0, 5).map((project) => {
                    const maxBudget = Math.max(...activeProjects.map((p) => p.budget), 1);
                    const pct = (project.budget / maxBudget) * 100;
                    return (
                      <div key={project.id} className="flex items-center gap-2">
                        <span className="text-[10px] truncate w-28 shrink-0">{project.title}</span>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold w-16 text-right">${project.budget.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notifications & Deadlines */}
        <div className="space-y-3">
          {/* Recent Activity */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-500" />
                  Recent Activity
                </CardTitle>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-red-500 text-white">
                    {notifications.filter((n) => !n.read).length} new
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <ScrollArea className="h-[200px]">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                    <p className="text-[10px] text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors cursor-pointer",
                          notif.read
                            ? "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            : "bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium">{notif.title || notif.body}</p>
                            <p className="text-[9px] text-muted-foreground line-clamp-1">
                              {notif.title ? notif.body : ""}
                            </p>
                          </div>
                          <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-4">
                  <Timer className="w-6 h-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                  <p className="text-[10px] text-muted-foreground">No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map((project) => {
                    const daysLeft = getDaysUntilDeadline(project.deadline);
                    const isUrgent = daysLeft !== null && daysLeft <= 3;
                    const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
                    
                    return (
                      <div 
                        key={project.id}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors",
                          isUrgent 
                            ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30" 
                            : isWarning 
                              ? "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                              : "bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        )}
                        onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium truncate flex-1">{project.title}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] px-1.5 py-0 ml-2",
                              isUrgent 
                                ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/30" 
                                : isWarning 
                                  ? "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30"
                                  : "border-gray-300 text-gray-600"
                            )}
                          >
                            {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
                          </Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(project.deadline!).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dark:bg-gray-800/50 border-none bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardContent className="py-3 px-3">
              <p className="text-[10px] text-muted-foreground mb-2">Quick Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] justify-start"
                  onClick={() => router.push("/dashboard/projects/new")}
                >
                  <Zap className="w-3 h-3 mr-1 text-cyan-500" />
                  New Project
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] justify-start"
                  onClick={() => router.push("/dashboard/projects/active")}
                >
                  <FolderKanban className="w-3 h-3 mr-1 text-blue-500" />
                  All Projects
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] justify-start"
                  onClick={() => router.push("/dashboard/billing")}
                >
                  <DollarSign className="w-3 h-3 mr-1 text-emerald-500" />
                  Billing
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] justify-start"
                  onClick={() => router.push("/dashboard/support")}
                >
                  <Bell className="w-3 h-3 mr-1 text-orange-500" />
                  Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
