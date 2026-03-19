/**
 * Supabase service functions for Project/Request operations
 */

import { supabase } from "@/lib/supabase/client";
import type { Project, CreateProjectInput, ProjectStatus } from "@/types/project";

const AUTO_CANCEL_ELIGIBLE_STATUSES: ProjectStatus[] = ["open", "paused"];

async function autoCancelExpiredProjectsForRequester(requesterId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("requests")
    .update({ status: "cancelled" })
    .eq("requester_id", requesterId)
    .in("status", AUTO_CANCEL_ELIGIBLE_STATUSES)
    .not("deadline", "is", null)
    .lt("deadline", nowIso);

  if (error) {
    console.error("Failed to auto-cancel expired projects:", error.message);
  }
}

/**
 * Fetch all projects created by a specific requester
 */
export async function getProjectsByRequester(
  requesterId: string
): Promise<{ data: Project[] | null; error: Error | null }> {
  try {
    // Keep requester projects in sync with deadline auto-cancel rule.
    await autoCancelExpiredProjectsForRequester(requesterId);

    const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("requester_id", requesterId)
        .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch projects"),
    };
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(
  projectId: string
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch project"),
    };
  }
}

/**
 * Fetch all open projects (available for collectors)
 */
export async function getOpenProjects(): Promise<{
  data: Project[] | null;
  error: Error | null;
}> {
  try {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "open")
      .or(`deadline.is.null,deadline.gte.${nowIso}`)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch open projects"),
    };
  }
}

/**
 * Search projects by title or description (ilike)
 */
export async function searchProjects(
  query: string,
  limit: number = 10
): Promise<{ data: Project[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to search projects"),
    };
  }
}

const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 3,
  starter: 10,
  professional: -1,
  enterprise: -1,
};

export interface RequesterHistoryProject {
  id: string;
  title: string;
  category: string;
  budget: number;
  status: ProjectStatus;
  created_at: string;
  deadline: string | null;
}

export interface ProjectFeedback {
  id: string;
  request_id: string;
  requester_id: string;
  collector_id: string | null;
  rating: number;
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface CollectorFeedback {
  id: string;
  request_id: string;
  requester_id: string;
  collector_id: string;
  rating: number;
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface RequesterCollectorFeedbackInput {
  collectorId: string;
  rating: number;
  feedback: string;
}

/**
 * Fetch requester's past projects for collector-facing history section
 */
export async function getRequesterProjectHistory(
  requesterId: string,
  excludeProjectId?: string
): Promise<{ data: RequesterHistoryProject[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("id,title,category,budget,status,created_at,deadline")
      .eq("requester_id", requesterId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const projects = ((data as RequesterHistoryProject[]) ?? []).filter(
      (project) => project.id !== excludeProjectId
    );
    return { data: projects, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch requester project history"),
    };
  }
}

/**
 * Create a new project/request
 */
export async function createProject(
  requesterId: string,
  projectData: CreateProjectInput
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    // Check subscription project limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", requesterId)
      .single();

    const tier = profile?.subscription_tier || "free";
    const limit = PLAN_PROJECT_LIMITS[tier] ?? 3;

    if (limit > 0) {
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", requesterId)
        .in("status", ["open", "in_progress"]);

      if ((count ?? 0) >= limit) {
        return {
          data: null,
          error: new Error(
            `You've reached the maximum of ${limit} active projects on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan. Upgrade your plan to create more.`
          ),
        };
      }
    }

    const deadline = projectData.deadline
      ? `${projectData.deadline}T23:59:59`
      : null;

    const { data, error } = await supabase
      .from("requests")
      .insert({
        requester_id: requesterId,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        requirements: projectData.requirements,
        location: projectData.location,
        budget: projectData.budget,
        deadline: deadline,
        max_collectors: projectData.max_collectors,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to create project"),
    };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  requesterId: string,
  updates: Partial<CreateProjectInput> & { status?: ProjectStatus }
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    // Convert deadline if provided
    const updateData: any = { ...updates };
    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline
        ? `${updates.deadline}T23:59:59`
        : null;
    }

    const { data, error } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", projectId)
      .eq("requester_id", requesterId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to update project"),
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", projectId)
      .eq("requester_id", requesterId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Failed to delete project"),
    };
  }
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  projectId: string,
  requesterId: string,
  status: ProjectStatus
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    if (status === "open") {
      const { data: currentProject, error: fetchError } = await supabase
        .from("requests")
        .select("deadline")
        .eq("id", projectId)
        .eq("requester_id", requesterId)
        .single();

      if (fetchError) {
        return { data: null, error: new Error(fetchError.message) };
      }

      const deadline = currentProject?.deadline ? new Date(currentProject.deadline) : null;
      if (deadline && deadline.getTime() < Date.now()) {
        // Enforce deadline rule immediately when trying to resume an expired project.
        const { data: cancelledProject, error: cancelError } = await supabase
          .from("requests")
          .update({ status: "cancelled" })
          .eq("id", projectId)
          .eq("requester_id", requesterId)
          .select()
          .single();

        if (cancelError) {
          return { data: null, error: new Error(cancelError.message) };
        }

        return {
          data: cancelledProject as Project,
          error: null,
        };
      }
    }

    const { data, error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", projectId)
      .eq("requester_id", requesterId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to update project status"),
    };
  }
}

/**
 * Complete a project with requester feedback (rating + text) in one atomic DB call.
 */
export async function completeProjectWithFeedback(
  projectId: string,
  requesterId: string,
  rating: number,
  feedback: string
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const normalizedFeedback = feedback.trim();

    if (!normalizedFeedback) {
      return { data: null, error: new Error("Feedback is required.") };
    }

    const { data, error } = await supabase.rpc("complete_project_with_feedback", {
      p_project_id: projectId,
      p_requester_id: requesterId,
      p_rating: normalizedRating,
      p_feedback: normalizedFeedback,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to complete project with feedback"),
    };
  }
}

/**
 * Complete a project with requester feedback for each assigned collector.
 */
export async function completeProjectWithCollectorFeedbacks(
  projectId: string,
  requesterId: string,
  feedbacks: RequesterCollectorFeedbackInput[]
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    if (feedbacks.length === 0) {
      return {
        data: null,
        error: new Error("At least one collector feedback is required."),
      };
    }

    for (const item of feedbacks) {
      const normalizedRating = Math.max(1, Math.min(5, Math.round(item.rating)));
      const normalizedFeedback = item.feedback.trim();
      if (!normalizedFeedback) {
        return { data: null, error: new Error("Feedback is required for each collector.") };
      }
      const { error: feedbackError } = await supabase
        .from("project_feedback")
        .upsert(
          {
            request_id: projectId,
            requester_id: requesterId,
            collector_id: item.collectorId,
            rating: normalizedRating,
            feedback: normalizedFeedback,
          },
          { onConflict: "request_id,requester_id,collector_id" }
        );

      if (feedbackError) {
        return { data: null, error: new Error(feedbackError.message) };
      }
    }

    const { data, error } = await supabase
      .from("requests")
      .update({ status: "completed" })
      .eq("id", projectId)
      .eq("requester_id", requesterId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Project, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to complete project with collector feedbacks"),
    };
  }
}

/**
 * Fetch requester feedback for a completed project.
 */
export async function getRequesterFeedbackForProject(
  projectId: string
): Promise<{ data: ProjectFeedback | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("project_feedback")
      .select("*")
      .eq("request_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as ProjectFeedback) ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch requester feedback"),
    };
  }
}

/**
 * Fetch requester feedback for multiple projects at once.
 */
export async function getRequesterFeedbackByProjects(
  projectIds: string[]
): Promise<{ data: Record<string, ProjectFeedback>; error: Error | null }> {
  try {
    if (projectIds.length === 0) return { data: {}, error: null };

    const { data, error } = await supabase
      .from("project_feedback")
      .select("*")
      .in("request_id", projectIds)
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const feedbackMap: Record<string, ProjectFeedback> = {};
    ((data as ProjectFeedback[]) ?? []).forEach((item) => {
      if (!feedbackMap[item.request_id]) {
        feedbackMap[item.request_id] = item;
      }
    });

    return { data: feedbackMap, error: null };
  } catch (err) {
    return {
      data: {},
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch requester feedback by projects"),
    };
  }
}

/**
 * Fetch requester feedback lists for multiple projects.
 */
export async function getRequesterFeedbackListsByProjects(
  projectIds: string[]
): Promise<{ data: Record<string, ProjectFeedback[]>; error: Error | null }> {
  try {
    if (projectIds.length === 0) return { data: {}, error: null };

    const { data, error } = await supabase
      .from("project_feedback")
      .select("*")
      .in("request_id", projectIds)
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const feedbackMap: Record<string, ProjectFeedback[]> = {};
    ((data as ProjectFeedback[]) ?? []).forEach((item) => {
      if (!feedbackMap[item.request_id]) {
        feedbackMap[item.request_id] = [];
      }
      feedbackMap[item.request_id].push(item);
    });

    return { data: feedbackMap, error: null };
  } catch (err) {
    return {
      data: {},
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch requester feedback lists by projects"),
    };
  }
}

/**
 * Fetch collector-to-requester feedback for a project.
 */
export async function getCollectorFeedbackForProject(
  projectId: string,
  collectorId: string
): Promise<{ data: CollectorFeedback | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("project_feedback_replies")
      .select("*")
      .eq("request_id", projectId)
      .eq("collector_id", collectorId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as CollectorFeedback) ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch collector feedback"),
    };
  }
}

/**
 * Fetch collector feedback for multiple projects at once for one collector.
 */
export async function getCollectorFeedbackByProjects(
  projectIds: string[],
  collectorId?: string
): Promise<{ data: Record<string, CollectorFeedback>; error: Error | null }> {
  try {
    if (projectIds.length === 0) return { data: {}, error: null };

    let query = supabase
      .from("project_feedback_replies")
      .select("*")
      .in("request_id", projectIds)
      .order("updated_at", { ascending: false });

    if (collectorId) {
      query = query.eq("collector_id", collectorId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const feedbackMap: Record<string, CollectorFeedback> = {};
    ((data as CollectorFeedback[]) ?? []).forEach((item) => {
      if (!feedbackMap[item.request_id]) {
        feedbackMap[item.request_id] = item;
      }
    });

    return { data: feedbackMap, error: null };
  } catch (err) {
    return {
      data: {},
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch collector feedback by projects"),
    };
  }
}

/**
 * Fetch collector feedback lists for multiple projects.
 */
export async function getCollectorFeedbackListsByProjects(
  projectIds: string[],
  collectorId?: string
): Promise<{ data: Record<string, CollectorFeedback[]>; error: Error | null }> {
  try {
    if (projectIds.length === 0) return { data: {}, error: null };

    let query = supabase
      .from("project_feedback_replies")
      .select("*")
      .in("request_id", projectIds)
      .order("updated_at", { ascending: false });

    if (collectorId) {
      query = query.eq("collector_id", collectorId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const feedbackMap: Record<string, CollectorFeedback[]> = {};
    ((data as CollectorFeedback[]) ?? []).forEach((item) => {
      if (!feedbackMap[item.request_id]) {
        feedbackMap[item.request_id] = [];
      }
      feedbackMap[item.request_id].push(item);
    });

    return { data: feedbackMap, error: null };
  } catch (err) {
    return {
      data: {},
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch collector feedback lists by projects"),
    };
  }
}

/**
 * Upsert collector feedback for requester on project completion.
 */
export async function submitCollectorFeedbackForProject(
  projectId: string,
  requesterId: string,
  collectorId: string,
  rating: number,
  feedback: string
): Promise<{ data: CollectorFeedback | null; error: Error | null }> {
  try {
    const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const normalizedFeedback = feedback.trim();

    if (!normalizedFeedback) {
      return { data: null, error: new Error("Feedback is required.") };
    }

    const { data, error } = await supabase
      .from("project_feedback_replies")
      .upsert(
        {
          request_id: projectId,
          requester_id: requesterId,
          collector_id: collectorId,
          rating: normalizedRating,
          feedback: normalizedFeedback,
        },
        { onConflict: "request_id,collector_id" }
      )
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as CollectorFeedback, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to submit collector feedback"),
    };
  }
}
