/**
 * Supabase service functions for Project/Request operations
 */

import { supabase } from "@/lib/supabase/client";
import type { Project, CreateProjectInput, ProjectStatus } from "@/types/project";

const PROJECT_QUERY_TIMEOUT_MS = 12000;

async function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Fetch all projects created by a specific requester
 */
export async function getProjectsByRequester(
  requesterId: string
): Promise<{ data: Project[] | null; error: Error | null }> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("requests")
        .select("*")
        .eq("requester_id", requesterId)
        .order("created_at", { ascending: false }),
      PROJECT_QUERY_TIMEOUT_MS,
      "Project list request timed out"
    );

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
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "open")
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
