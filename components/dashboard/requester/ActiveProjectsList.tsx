"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByRequester, updateProjectStatus } from "@/lib/services/projectService";
import { getSubmissionsByProject } from "@/lib/services/submissionService";
import type { Project, ProjectStatus } from "@/types/project";
import EditProjectDialog from "./EditProjectDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
  Pencil,
  TrendingUp,
  Pause,
  Play,
  Plus,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import { cn, getCategoryColor } from "@/lib/utils";

export default function ActiveProjectsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [projectStats, setProjectStats] = useState<Record<string, {
    totalTarget: number;
    totalSubmissions: number;
    validated: number;
    pending: number;
    rejected: number;
    progress: number;
    spent: number;
    pendingPayment: number;
  }>>({});

  const userId = user?.id;

  const fetchProjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await getProjectsByRequester(userId);

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  // Fetch real submission stats for all projects
  useEffect(() => {
    if (projects.length === 0) return;

    const fetchAllStats = async () => {
      const statsMap: Record<string, typeof projectStats[string]> = {};

      await Promise.all(
        projects.map(async (project) => {
          try {
            const { data } = await getSubmissionsByProject(project.id);
            const submissions = data || [];

            const validated = submissions.filter((s) => s.status === "validated").length;
            const pending = submissions.filter((s) => s.status === "pending").length;
            const rejected = submissions.filter((s) => s.status === "rejected").length;
            const totalSubmissions = submissions.length;
            const totalTarget = Math.max(project.max_collectors * 10, 1);
            const progress = Math.min(Math.round((validated / totalTarget) * 100), 100);

            const perUnit = project.budget / totalTarget;
            const spent = validated * perUnit;
            const pendingPayment = pending * perUnit;

            statsMap[project.id] = {
              totalTarget,
              totalSubmissions,
              validated,
              pending,
              rejected,
              progress,
              spent: Math.round(spent * 100) / 100,
              pendingPayment: Math.round(pendingPayment * 100) / 100,
            };
          } catch {
            // If fetch fails for a project, use zero stats
            statsMap[project.id] = {
              totalTarget: project.max_collectors * 10,
              totalSubmissions: 0,
              validated: 0,
              pending: 0,
              rejected: 0,
              progress: 0,
              spent: 0,
              pendingPayment: 0,
            };
          }
        })
      );

      setProjectStats(statsMap);
    };

    fetchAllStats();
  }, [projects]);

  const handlePauseProject = async (projectId: string) => {
    if (!user) return;

    try {
      setError("");

      const { data, error } = await updateProjectStatus(projectId, user.id, "paused" as ProjectStatus);
      if (error) {
        throw error;
      }

      if (data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as Project) : p))
        );
      }
    } catch (err: any) {
      console.error("Error pausing project:", err);
      setError(err.message || "Failed to pause project");
    }
  };

  const handleResumeProject = async (projectId: string) => {
    if (!user) return;

    try {
      setError("");

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
    } catch (err: any) {
      console.error("Error resuming project:", err);
      setError(err.message || "Failed to resume project");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[9px] px-1.5 py-0">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[9px] px-1.5 py-0">
            <Pause className="w-2.5 h-2.5 mr-0.5" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white text-[9px] px-1.5 py-0">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] px-1.5 py-0">
            <XCircle className="w-2.5 h-2.5 mr-0.5" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getProjectProgress = (project: Project) => {
    return projectStats[project.id] || {
      totalTarget: project.max_collectors * 10,
      totalSubmissions: 0,
      validated: 0,
      pending: 0,
      rejected: 0,
      progress: 0,
      spent: 0,
      pendingPayment: 0,
    };
  };

  // Filter projects by status
  const activeProjects = projects.filter(p => p.status === "open");
  const pausedProjects = projects.filter(p => (p.status as string) === "paused");
  const completedProjects = projects.filter(p => p.status === "completed");
  const cancelledProjects = projects.filter(p => p.status === "cancelled");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderProjectCard = (project: Project, showPauseResume: "pause" | "resume" | "none" = "none") => {
    const stats = getProjectProgress(project);
    const isPaused = (project.status as string) === "paused";
    const isCompleted = project.status === "completed";
    const isCancelled = project.status === "cancelled";

    return (
      <Card
        key={project.id}
        className={cn(
          "border-none hover:shadow-md transition-shadow",
          isPaused && "bg-yellow-50 dark:bg-yellow-900/10",
          isCompleted && "bg-gray-50 dark:bg-gray-800/30",
          isCancelled && "bg-red-50 dark:bg-red-900/10 opacity-70",
          !isPaused && !isCompleted && !isCancelled && "dark:bg-gray-800/50"
        )}
      >
        <CardContent className="py-2.5 px-3">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className={cn("text-sm font-semibold truncate", isCancelled && "line-through")}>{project.title}</span>
                {getStatusBadge(project.status as string)}
                <Badge className={cn("text-[8px] px-1 py-0", getCategoryColor(project.category))}>{project.category}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{project.description}</p>
            </div>
            <div className="flex flex-wrap gap-1 flex-shrink-0">
              {showPauseResume === "pause" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => handlePauseProject(project.id)}
                  title="Pause Project"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              )}
              {showPauseResume === "resume" && (
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleResumeProject(project.id)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
              )}
              {!isCancelled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/workshop`)}
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  Workshop
                </Button>
              )}
              {(project.status === "open" || isPaused) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setEditingProject(project);
                    setShowEditDialog(true);
                  }}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Progress & Stats Row */}
          {!isCancelled && (
            <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-700/30 rounded px-2 py-1.5">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 min-w-[120px]">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                <Progress value={isCompleted ? 100 : stats.progress} className="h-1.5 flex-1" />
                <span className="text-[10px] font-semibold text-cyan-600 w-8">{isCompleted ? 100 : stats.progress}%</span>
              </div>
              
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              
              {/* Submission Stats */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Submissions:</span>
                <span className="font-semibold">{stats.totalSubmissions}</span>
                <span className="text-green-600">✓{stats.validated}</span>
                <span className="text-yellow-600">⏳{stats.pending}</span>
                <span className="text-red-600">✗{stats.rejected}</span>
              </div>
              
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              
              {/* Billing Stats */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Billing:</span>
                <span className="text-green-600 font-semibold">${stats.spent} paid</span>
                <span className="text-yellow-600">${stats.pendingPayment} due</span>
              </div>
            </div>
          )}

          {/* Footer Row */}
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span className="font-semibold text-foreground">${project.budget.toFixed(0)}</span>
                <span>budget</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{project.max_collectors} collectors</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(project.deadline)}</span>
              </div>
              {project.location?.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{project.location.address}</span>
                </div>
              )}
            </div>
            <span>Created: {formatDate(project.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string) => {
    const configs = {
      active: { icon: FolderKanban, message: "No active projects", showCreate: true },
      paused: { icon: Pause, message: "No paused projects", showCreate: false },
      completed: { icon: CheckCircle2, message: "No completed projects yet", showCreate: false },
      cancelled: { icon: XCircle, message: "No cancelled projects", showCreate: false },
    };
    const config = configs[type as keyof typeof configs];

    return (
      <div className="text-center py-8">
        <config.icon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-xs text-muted-foreground mb-2">{config.message}</p>
        {config.showCreate && (
          <Button 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => router.push("/dashboard/projects/new")}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Project
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 p-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">Projects</h1>
          <p className="text-xs text-muted-foreground">Manage all your data collection projects</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchProjects} variant="outline" size="sm" className="h-7 text-xs px-2">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/dashboard/projects/new")}
          >
            <Plus className="w-3 h-3 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Active</p>
                <p className="text-lg font-bold text-cyan-600">{activeProjects.length}</p>
              </div>
              <FolderKanban className="w-5 h-5 text-cyan-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Paused</p>
                <p className="text-lg font-bold text-yellow-600">{pausedProjects.length}</p>
              </div>
              <Pause className="w-5 h-5 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Completed</p>
                <p className="text-lg font-bold text-green-600">{completedProjects.length}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Cancelled</p>
                <p className="text-lg font-bold text-red-600">{cancelledProjects.length}</p>
              </div>
              <XCircle className="w-5 h-5 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Projects List */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="py-3 px-3">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="h-8 w-full grid grid-cols-2 sm:grid-cols-4 mb-3">
              <TabsTrigger value="active" className="text-xs h-7 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Active ({activeProjects.length})
              </TabsTrigger>
              <TabsTrigger value="paused" className="text-xs h-7 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                Paused ({pausedProjects.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs h-7 data-[state=active]:bg-gray-500 data-[state=active]:text-white">
                Completed ({completedProjects.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs h-7 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Cancelled ({cancelledProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0 space-y-2">
              {activeProjects.length === 0 ? renderEmptyState("active") : (
                activeProjects.map((project) => renderProjectCard(project, "pause"))
              )}
            </TabsContent>

            <TabsContent value="paused" className="mt-0 space-y-2">
              {pausedProjects.length === 0 ? renderEmptyState("paused") : (
                pausedProjects.map((project) => renderProjectCard(project, "resume"))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0 space-y-2">
              {completedProjects.length === 0 ? renderEmptyState("completed") : (
                completedProjects.map((project) => renderProjectCard(project, "none"))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-0 space-y-2">
              {cancelledProjects.length === 0 ? renderEmptyState("cancelled") : (
                cancelledProjects.map((project) => renderProjectCard(project, "none"))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setEditingProject(null);
            }
          }}
          onSuccess={() => {
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
