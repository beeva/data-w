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
