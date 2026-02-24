"use client";

import { useState, useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getOpenProjects } from "@/lib/services/projectService";
import type { Project } from "@/types/project";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  Loader2,
  FileText,
  Clock,
  Briefcase,
  Camera,
  Video,
  Mic,
  BarChart3,
  MapPinned,
  Cpu,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import SubmitProposalDialog from "./SubmitProposalDialog";
import { cn, getCategoryColor } from "@/lib/utils";
import { getProposalsByCollector, getAssignmentCountsByProjects } from "@/lib/services/proposalService";
import type { Proposal } from "@/types/proposal";

export default function FindProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, Proposal>>({});
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'budget_low' | 'deadline'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Expand/collapse filter sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    dataTypes: true,
    budget: true,
  });

  const userId = user?.id;

  const fetchProjects = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setError("");

      const [projectsResult, proposalsResult] = await Promise.all([
        getOpenProjects(),
        userId ? getProposalsByCollector(userId) : Promise.resolve({ data: null, error: null }),
      ]);

      if (projectsResult.error) throw projectsResult.error;

      const allProjects = projectsResult.data || [];
      setProjects(allProjects);
      setFilteredProjects(allProjects);

      if (proposalsResult.data && userId) {
        const statusMap: Record<string, Proposal> = {};
        proposalsResult.data.forEach((proposal) => {
          statusMap[proposal.request_id] = proposal;
        });
        setProposalStatuses(statusMap);
      }

      if (allProjects.length > 0) {
        const { data: counts } = await getAssignmentCountsByProjects(
          allProjects.map((p) => p.id)
        );
        setAssignmentCounts(counts || {});
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Realtime subscription: update proposal statuses when requester acts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`proposals-collector-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "proposals",
          filter: `collector_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Proposal>) => {
          const updated = payload.new as Proposal;
          setProposalStatuses((prev) => ({
            ...prev,
            [updated.request_id]: updated,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const categories = ['Photography', 'Video', 'Audio', 'Text', 'Survey', 'Location Data', 'Sensor Data', 'Other'];
  const dataTypes = ['Images', 'Videos', 'Audio Files', 'Documents', 'GPS Data', 'Sensor Readings', 'Survey Responses'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Photography': return Camera;
      case 'Video': return Video;
      case 'Audio': return Mic;
      case 'Text': return FileText;
      case 'Survey': return BarChart3;
      case 'Location Data': return MapPinned;
      case 'Sensor Data': return Cpu;
      default: return MoreHorizontal;
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleDataType = (type: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedDataTypes([]);
    setBudgetRange({ min: 0, max: 100000 });
    setSearchTerm("");
  };

  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    // Data types filter
    if (selectedDataTypes.length > 0) {
      filtered = filtered.filter((p) =>
        p.requirements.data_types.some((type) =>
          selectedDataTypes.some((selected) =>
            type.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }

    // Budget filter
    filtered = filtered.filter(
      (p) => p.budget >= budgetRange.min && p.budget <= budgetRange.max
    );

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'budget_high':
          return b.budget - a.budget;
        case 'budget_low':
          return a.budget - b.budget;
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProjects(filtered);
  }, [searchTerm, selectedCategories, selectedDataTypes, budgetRange, sortBy, projects]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Find Projects</h1>
        <p className="text-muted-foreground mt-1">
          Browse available data collection projects from requesters and start earning
        </p>
      </div>

      {error && (
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-48 bg-muted border-border text-foreground">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="newest" className="bg-popover text-popover-foreground hover:bg-accent">Newest First</SelectItem>
                    <SelectItem value="budget_high" className="bg-popover text-popover-foreground hover:bg-accent">Budget: High to Low</SelectItem>
                    <SelectItem value="budget_low" className="bg-popover text-popover-foreground hover:bg-accent">Budget: Low to High</SelectItem>
                    <SelectItem value="deadline" className="bg-popover text-popover-foreground hover:bg-accent">Deadline: Soonest</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => fetchProjects()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Advanced Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, category: !prev.category }))}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground"
                    >
                      <span>Category</span>
                      {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.category && (
                      <div className="space-y-2 pl-2">
                        {categories.map((cat) => {
                          const Icon = getCategoryIcon(cat);
                          return (
                            <div key={cat} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${cat}`}
                                checked={selectedCategories.includes(cat)}
                                onCheckedChange={() => toggleCategory(cat)}
                                className="border-border data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />
                              <label
                                htmlFor={`cat-${cat}`}
                                className={cn(
                                  "text-sm cursor-pointer flex items-center gap-2 flex-1",
                                  selectedCategories.includes(cat)
                                    ? "text-cyan-600 dark:text-cyan-400"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                {cat}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Data Types Filter */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, dataTypes: !prev.dataTypes }))}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground"
                    >
                      <span>Data Types</span>
                      {expandedSections.dataTypes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.dataTypes && (
                      <div className="space-y-2 pl-2">
                        {dataTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type}`}
                              checked={selectedDataTypes.includes(type)}
                              onCheckedChange={() => toggleDataType(type)}
                              className="border-border data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                            <label
                              htmlFor={`type-${type}`}
                              className={cn(
                                "text-sm cursor-pointer flex-1",
                                selectedDataTypes.includes(type)
                                  ? "text-cyan-600 dark:text-cyan-400"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Budget Range Filter */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, budget: !prev.budget }))}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground"
                    >
                      <span>Budget Range</span>
                      {expandedSections.budget ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.budget && (
                      <div className="space-y-3 pl-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={budgetRange.min || ''}
                            onChange={(e) => setBudgetRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                            className="bg-muted border-border text-foreground"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={budgetRange.max || ''}
                            onChange={(e) => setBudgetRange(prev => ({ ...prev, max: Number(e.target.value) || 100000 }))}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${budgetRange.min.toLocaleString()} - ${budgetRange.max.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Projects</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredProjects.filter((p) => (assignmentCounts[p.id] || 0) < p.max_collectors).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredProjects.length} total open
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget Available</p>
                <p className="text-2xl font-bold text-foreground">
                  ${filteredProjects
                    .filter((p) => (assignmentCounts[p.id] || 0) < p.max_collectors)
                    .reduce((sum, p) => sum + p.budget, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Collector Slots</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredProjects.reduce(
                    (sum, p) => sum + Math.max(p.max_collectors - (assignmentCounts[p.id] || 0), 0),
                    0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredProjects.reduce((sum, p) => sum + p.max_collectors, 0)} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No projects found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategories.length > 0 || selectedDataTypes.length > 0
                  ? "Try adjusting your search or filters"
                  : "No open projects available at the moment"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const CategoryIcon = getCategoryIcon(project.category);
            const proposal = proposalStatuses[project.id];
            const slotsFilled = (assignmentCounts[project.id] || 0) >= (project.max_collectors || 1);
            
            const getStatusBadge = () => {
              if (!proposal) return null;
              
              switch (proposal.status) {
                case "accepted":
                  return (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepted
                    </Badge>
                  );
                case "pending":
                  return (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </Badge>
                  );
                case "rejected":
                  return (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </Badge>
                  );
                default:
                  return null;
              }
            };

            return (
              <Card
                key={project.id}
                className="dark:bg-gray-800/50 border border-border hover:border-cyan-400/50 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <CategoryIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <h3 className="text-xl font-semibold text-foreground">{project.title}</h3>
                        <Badge className={getCategoryColor(project.category)}>
                          {project.category}
                        </Badge>
                        {getStatusBadge()}
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span className="font-semibold text-foreground">
                            ${project.budget.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>{formatDate(project.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>
                            {project.max_collectors} collector
                            {project.max_collectors !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {project.location?.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="truncate">{project.location.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Data Types */}
                      {project.requirements.data_types.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {project.requirements.data_types.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-border text-muted-foreground">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {proposal ? (
                        <div className="text-center">
                          <div className="mb-2">
                            {getStatusBadge()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : slotsFilled ? (
                        <Badge variant="secondary" className="text-[10px] bg-gray-500/20 text-gray-400">
                          Slots Full
                        </Badge>
                      ) : (
                        <SubmitProposalDialog
                          project={project}
                          onSuccess={() => {
                            fetchProjects();
                          }}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
