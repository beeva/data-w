"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProposalsByProject,
  acceptProposals,
  getAssignmentsByProject,
  updateProposalStatus,
} from "@/lib/services/proposalService";
import { getProjectById } from "@/lib/services/projectService";
import { getProjectStats } from "@/lib/services/submissionService";
import type { ProposalWithCollector, CollectorAssignment } from "@/types";
import type { Project } from "@/types/project";
import type { ProjectStats } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
  Briefcase,
  Calendar,
  MessageSquare,
  FileCheck,
  FileX,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ToastNotification from "@/components/ui/toast-notification";

interface ProjectProposalsProps {
  projectId: string;
}

export default function ProjectProposals({ projectId }: ProjectProposalsProps) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalWithCollector[]>([]);
  const [assignments, setAssignments] = useState<CollectorAssignment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [proposalsResult, assignmentsResult, projectResult, statsResult] = await Promise.all([
        getProposalsByProject(projectId),
        getAssignmentsByProject(projectId),
        getProjectById(projectId),
        getProjectStats(projectId),
      ]);

      if (proposalsResult.error) {
        throw proposalsResult.error;
      }
      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }
      if (projectResult.error) {
        throw projectResult.error;
      }
      if (statsResult.error) {
        throw statsResult.error;
      }

      setProposals(proposalsResult.data || []);
      setAssignments(assignmentsResult.data || []);
      setProject(projectResult.data);
      setStats(statsResult.data);
      
      // Reset to first pending proposal if available
      const pending = (proposalsResult.data || []).filter((p) => p.status === "pending");
      if (pending.length > 0 && currentIndex === 0) {
        const firstPendingIndex = (proposalsResult.data || []).findIndex((p) => p.id === pending[0].id);
        if (firstPendingIndex >= 0) {
          setCurrentIndex(firstPendingIndex);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const filtered = proposals.filter((p) => {
      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    });
    if (currentIndex < filtered.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleProposalClick = (proposalId: string) => {
    const filtered = proposals.filter((p) => {
      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    });
    const index = filtered.findIndex((p) => p.id === proposalId);
    if (index >= 0) {
      setCurrentIndex(index);
    }
  };

  const handleToggleProposal = (proposalId: string) => {
    setSelectedProposals((prev) =>
      prev.includes(proposalId)
        ? prev.filter((id) => id !== proposalId)
        : [...prev, proposalId]
    );
  };

  const handleAcceptSingle = async (proposalId: string) => {
    if (!user) return;

    try {
      setProcessing(proposalId);
      setError("");

      const { data, error: acceptError } = await acceptProposals([proposalId], user.id);

      if (acceptError) {
        throw acceptError;
      }

      setToast({ message: "Proposal accepted! Submission link generated.", type: "success" });
      setSelectedProposals((prev) => prev.filter((id) => id !== proposalId));
      await fetchData();
      
      // Move to next proposal
      const filtered = proposals.filter((p) => {
        if (statusFilter === "all") return true;
        return p.status === statusFilter;
      });
      if (currentIndex < filtered.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept proposal");
      setToast({ message: err.message || "Failed to accept proposal", type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSingle = async (proposalId: string) => {
    if (!user) return;

    try {
      setProcessing(proposalId);
      setError("");

      const { error: rejectError } = await updateProposalStatus(proposalId, "rejected", user.id);

      if (rejectError) {
        throw rejectError;
      }

      setToast({ message: "Proposal rejected.", type: "success" });
      await fetchData();
      
      // Move to next proposal
      const filtered = proposals.filter((p) => {
        if (statusFilter === "all") return true;
        return p.status === statusFilter;
      });
      if (currentIndex < filtered.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject proposal");
      setToast({ message: err.message || "Failed to reject proposal", type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleAcceptSelected = async () => {
    if (selectedProposals.length === 0 || !user) {
      return;
    }

    try {
      setAccepting(true);
      setError("");

      const { data, error: acceptError } = await acceptProposals(selectedProposals, user.id);

      if (acceptError) {
        throw acceptError;
      }

      setToast({ message: `Successfully assigned ${selectedProposals.length} collector(s)!`, type: "success" });
      setSelectedProposals([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to accept proposals");
      setToast({ message: err.message || "Failed to accept proposals", type: "error" });
    } finally {
      setAccepting(false);
    }
  };

  const copySubmissionLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setToast({ message: "Submission link copied to clipboard!", type: "success" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Helper functions and computed values (after early return)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const completionRate = stats
    ? Math.round(
        ((stats.validated_submissions + stats.rejected_submissions) /
          Math.max(stats.total_submissions, 1)) *
          100
      )
    : 0;

  const filteredProposals = proposals.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  const currentProposal = filteredProposals[currentIndex] || filteredProposals[0];
  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const acceptedProposals = proposals.filter((p) => p.status === "accepted");
  const rejectedProposals = proposals.filter((p) => p.status === "rejected");

  return (
    <>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}
      <div className="space-y-4">
      {/* Project Stats & Details - Super Important Section */}
      {project && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-5 gap-2">
            <Card className="dark:bg-gray-800/50 border-none">
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="text-lg font-bold">
                      {stats?.total_submissions || 0}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none">
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {stats?.pending_submissions || 0}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none">
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Validated</p>
                    <p className="text-lg font-bold text-green-600">
                      {stats?.validated_submissions || 0}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none">
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rejected</p>
                    <p className="text-lg font-bold text-red-600">
                      {stats?.rejected_submissions || 0}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FileX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none">
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Score</p>
                    <p className="text-lg font-bold text-cyan-600">
                      {stats?.average_validation_score !== null && stats?.average_validation_score !== undefined
                        ? `${stats.average_validation_score}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Card */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Review Completion</span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-1.5" />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <p className="text-base font-bold text-green-600">
                      {stats?.validated_submissions || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-yellow-600">
                      {stats?.pending_submissions || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-red-600">
                      {stats?.rejected_submissions || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-xs font-semibold">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-semibold">${project.budget.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-semibold">{formatDate(project.deadline)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Max Collectors:</span>
                  <span className="font-semibold">{project.max_collectors}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Proposals Review Section */}
      <div className="flex gap-4 h-[calc(100vh-550px)]">
        {/* Main Content Area - 70% */}
        <div className="flex-1 min-w-0 flex flex-col">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

        {/* Selected Proposals Actions */}
        {selectedProposals.length > 0 && (
          <Card className="dark:bg-gray-800/50 border-none mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  {selectedProposals.length} proposal(s) selected
                </p>
                <Button
                  onClick={handleAcceptSelected}
                  disabled={accepting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Selected ({selectedProposals.length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Proposal Display */}
        {filteredProposals.length === 0 ? (
          <Card className="dark:bg-gray-800/50 border-none flex-1">
            <CardContent className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center h-full">
              <div>
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No {statusFilter === "all" ? "" : statusFilter} proposals yet</p>
              </div>
            </CardContent>
          </Card>
        ) : currentProposal ? (
          <Card className="dark:bg-gray-800/50 border-none flex-1 flex flex-col">
            <CardHeader className="border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Proposal Review
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentIndex + 1} of {filteredProposals.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProposals.includes(currentProposal.id)}
                    onCheckedChange={() => handleToggleProposal(currentProposal.id)}
                  />
                  <span className="text-xs text-muted-foreground">Select</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Collector Info */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-700">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={currentProposal.collector?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {currentProposal.collector?.full_name?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {currentProposal.collector?.full_name || "Unknown Collector"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentProposal.collector?.email}
                        </p>
                        {currentProposal.collector?.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {currentProposal.collector.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {currentProposal.collector?.rating && (
                          <Badge variant="outline" className="text-sm">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {currentProposal.collector.rating.toFixed(1)}
                          </Badge>
                        )}
                        {currentProposal.collector?.verification_tier && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {currentProposal.collector.verification_tier}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Submitted: {new Date(currentProposal.submitted_at).toLocaleString()}</span>
                      </div>
                      {currentProposal.collector?.completed_tasks !== null && currentProposal.collector?.completed_tasks !== undefined && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{currentProposal.collector.completed_tasks} completed tasks</span>
                        </div>
                      )}
                    </div>
                    {currentProposal.collector?.bio && (
                      <p className="text-sm text-muted-foreground italic mt-2">
                        "{currentProposal.collector.bio}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Location
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentProposal.location.address}
                  </p>
                  {currentProposal.location.city && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentProposal.location.city}
                      {currentProposal.location.country && `, ${currentProposal.location.country}`}
                    </p>
                  )}
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Capabilities</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Data Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentProposal.capabilities.data_types.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {currentProposal.capabilities.equipment && currentProposal.capabilities.equipment.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Equipment:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentProposal.capabilities.equipment.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentProposal.capabilities.experience_years && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Experience:</span>
                        <span className="font-medium">{currentProposal.capabilities.experience_years} years</span>
                      </div>
                    )}
                    {currentProposal.capabilities.languages && currentProposal.capabilities.languages.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Languages:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentProposal.capabilities.languages.map((lang, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentProposal.capabilities.availability && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Availability:</span>
                        <span className="font-medium capitalize">{currentProposal.capabilities.availability}</span>
                      </div>
                    )}
                    {currentProposal.capabilities.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{currentProposal.capabilities.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposed Budget */}
                {currentProposal.proposed_budget && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-cyan-400" />
                      Proposed Budget
                    </h4>
                    <p className="text-lg font-semibold text-cyan-400">
                      ${currentProposal.proposed_budget.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Message */}
                {currentProposal.message && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      Message
                    </h4>
                    <div className="bg-gray-700/50 rounded p-3">
                      <p className="text-sm italic">"{currentProposal.message}"</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Action Buttons */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {currentProposal.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleRejectSingle(currentProposal.id)}
                        disabled={processing === currentProposal.id}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {processing === currentProposal.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleAcceptSingle(currentProposal.id)}
                        disabled={processing === currentProposal.id}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {processing === currentProposal.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Accept
                      </Button>
                    </>
                  )}
                  {currentProposal.status === "accepted" && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Accepted
                    </Badge>
                  )}
                  {currentProposal.status === "rejected" && (
                    <Badge variant="outline" className="border-red-500/30 text-red-400">
                      <XCircle className="w-3 h-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentIndex === filteredProposals.length - 1}
                  variant="outline"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      {/* Right Sidebar - 30% */}
      <div className="w-[30%] min-w-[280px]">
        <Card className="dark:bg-gray-800/50 border-none h-full flex flex-col">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-sm font-semibold">Proposals</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <Tabs value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v as typeof statusFilter);
              setCurrentIndex(0);
            }} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 m-2 h-8">
                <TabsTrigger value="pending" className="text-xs">
                  Pending ({pendingProposals.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All ({proposals.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="pending" className="h-full m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                      {pendingProposals.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center p-4">
                          No pending proposals
                        </p>
                      ) : (
                        pendingProposals.map((proposal, idx) => (
                          <Card
                            key={proposal.id}
                            className={`dark:bg-gray-700/50 border cursor-pointer transition-colors ${
                              currentProposal?.id === proposal.id
                                ? "border-cyan-400 bg-cyan-400/10"
                                : "border-gray-600 hover:border-gray-500"
                            }`}
                            onClick={() => handleProposalClick(proposal.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={proposal.collector?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {proposal.collector?.full_name?.[0] || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {proposal.collector?.full_name || "Unknown"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {proposal.location.address}
                                  </p>
                                </div>
                                {idx === currentIndex && (
                                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="all" className="h-full m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                      <div>
                        <p className="text-xs font-semibold mb-2 px-2 text-muted-foreground">
                          Accepted ({acceptedProposals.length})
                        </p>
                        {acceptedProposals.map((proposal) => (
                          <Card
                            key={proposal.id}
                            className={`dark:bg-gray-700/50 border cursor-pointer transition-colors mb-2 ${
                              currentProposal?.id === proposal.id
                                ? "border-green-400 bg-green-400/10"
                                : "border-green-500/30 hover:border-green-500/50"
                            }`}
                            onClick={() => handleProposalClick(proposal.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <p className="text-xs truncate flex-1">
                                  {proposal.collector?.full_name || "Unknown"}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-2 px-2 text-muted-foreground">
                          Rejected ({rejectedProposals.length})
                        </p>
                        {rejectedProposals.map((proposal) => (
                          <Card
                            key={proposal.id}
                            className={`dark:bg-gray-700/50 border cursor-pointer transition-colors mb-2 ${
                              currentProposal?.id === proposal.id
                                ? "border-red-400 bg-red-400/10"
                                : "border-red-500/30 hover:border-red-500/50"
                            }`}
                            onClick={() => handleProposalClick(proposal.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <p className="text-xs truncate flex-1">
                                  {proposal.collector?.full_name || "Unknown"}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Assigned Collectors */}
        {assignments.length > 0 && (
          <Card className="dark:bg-gray-800/50 border-none mt-4">
            <CardHeader className="py-2 px-3 border-b border-gray-700">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Users className="w-3 h-3 text-cyan-400" />
                Assigned ({assignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-2 bg-gray-700/50 rounded border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-[9px]">
                          Active
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copySubmissionLink(assignment.submission_link)}
                          className="h-5 w-5 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground break-all">
                        {assignment.submission_link.split("/").pop()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
      </div>
    </>
  );
}
