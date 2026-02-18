/**
 * Supabase service functions for Proposal operations
 */

import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/services/notificationService";
import type {
  Proposal,
  ProposalWithCollector,
  CreateProposalInput,
  CollectorAssignment,
} from "@/types/proposal";

/**
 * Create a new proposal
 */
export async function createProposal(
  collectorId: string,
  proposalData: CreateProposalInput
): Promise<{ data: Proposal | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        request_id: proposalData.request_id,
        collector_id: collectorId,
        location: proposalData.location,
        capabilities: proposalData.capabilities,
        proposed_budget: proposalData.proposed_budget || null,
        message: proposalData.message || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const proposal = data as Proposal;

    // Best-effort notifications (don't block proposal creation on failure)
    try {
      // Fetch basic project info to enrich notifications
      const { data: request } = await supabase
        .from("requests")
        .select("id, title, requester_id")
        .eq("id", proposalData.request_id)
        .single();

      const projectTitle = request?.title || "a project";

      // Notify collector (self) that proposal was submitted
      await createNotification({
        userId: collectorId,
        type: "proposal_submitted",
        title: "Proposal submitted",
        body: `You submitted a proposal to "${projectTitle}".`,
        metadata: {
          request_id: proposalData.request_id,
          proposal_id: proposal.id,
        },
      });

      // Notify requester that a new proposal was received
      if (request?.requester_id) {
        await createNotification({
          userId: request.requester_id,
          type: "proposal_received",
          title: "New proposal received",
          body: `Your project "${projectTitle}" received a new proposal.`,
          metadata: {
            request_id: proposalData.request_id,
            proposal_id: proposal.id,
            collector_id: collectorId,
          },
        });
      }
    } catch (notifyError) {
      // Log but don't fail the main operation
      console.error("Error creating proposal notifications:", notifyError);
    }

    return { data: proposal, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to create proposal"),
    };
  }
}

/**
 * Get all proposals for a project
 */
export async function getProposalsByProject(
  projectId: string
): Promise<{ data: ProposalWithCollector[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("proposals")
      .select(
        `
        *,
        collector:profiles!collector_id(
          id,
          email,
          full_name,
          avatar_url,
          rating,
          bio,
          phone,
          total_earnings,
          total_submissions,
          completed_tasks,
          verification_tier
        )
      `
      )
      .eq("request_id", projectId)
      .order("submitted_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ProposalWithCollector[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch proposals"),
    };
  }
}

/**
 * Get proposals by collector
 */
export async function getProposalsByCollector(
  collectorId: string
): Promise<{ data: Proposal[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("collector_id", collectorId)
      .order("submitted_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Proposal[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch proposals"),
    };
  }
}

/**
 * Update proposal status (accept/reject)
 */
export async function updateProposalStatus(
  proposalId: string,
  status: "accepted" | "rejected",
  requesterId: string
): Promise<{ data: Proposal | null; error: Error | null }> {
  try {
    const supabase = createClient();

    // Verify requester owns the project
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("request_id, collector_id, requests!inner(requester_id, title)")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return { data: null, error: new Error("Proposal not found") };
    }

    const { data, error } = await supabase
      .from("proposals")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const updated = data as Proposal;

    // Best-effort notification to the collector about the decision
    try {
      const projectTitle = (proposal as any).requests?.title || "a project";

      await createNotification({
        userId: (proposal as any).collector_id,
        type: status === "accepted" ? "proposal_accepted" : "proposal_rejected",
        title:
          status === "accepted"
            ? "Proposal accepted"
            : "Proposal rejected",
        body:
          status === "accepted"
            ? `Your proposal for "${projectTitle}" was accepted.`
            : `Your proposal for "${projectTitle}" was rejected.`,
        metadata: {
          request_id: (proposal as any).request_id,
          proposal_id: proposalId,
          status,
        },
      });
    } catch (notifyError) {
      console.error("Error creating proposal status notification:", notifyError);
    }

    return { data: updated, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to update proposal"),
    };
  }
}

/**
 * Accept multiple proposals and create collector assignments
 */
export async function acceptProposals(
  proposalIds: string[],
  requesterId: string
): Promise<{ data: CollectorAssignment[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    // Verify requester owns all projects
    const { data: proposals, error: fetchError } = await supabase
      .from("proposals")
      .select("id, request_id, collector_id, requests!inner(requester_id, title)")
      .in("id", proposalIds);

    if (fetchError || !proposals || proposals.length === 0) {
      return { data: null, error: new Error("Proposals not found") };
    }

    // Verify all proposals belong to requester's projects
    const invalidProposals = proposals.filter(
      (p: any) => p.requests.requester_id !== requesterId
    );
    if (invalidProposals.length > 0) {
      return { data: null, error: new Error("Unauthorized: Not your project") };
    }

    // Update proposal statuses to accepted
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "accepted",
        reviewed_at: new Date().toISOString(),
      })
      .in("id", proposalIds);

    if (updateError) {
      return { data: null, error: new Error(updateError.message) };
    }

    // Generate unique tokens and create assignments
    const assignments = await Promise.all(
      proposals.map(async (proposal: any) => {
        // Generate unique token (base64url encoded random bytes)
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = btoa(String.fromCharCode(...Array.from(array)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, "");

        const { data: assignment, error: assignError } = await supabase
          .from("collector_assignments")
          .insert({
            request_id: proposal.request_id,
            collector_id: proposal.collector_id,
            proposal_id: proposal.id,
            submission_token: token,
            status: "active",
          })
          .select()
          .single();

        if (assignError) {
          throw assignError;
        }

        // Get base URL (works in both client and server)
        const baseUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        return {
          ...assignment,
          submission_link: `${baseUrl}/submit/${token}`,
        } as CollectorAssignment;
      })
    );

    // Best-effort notifications for each assigned collector
    for (const proposal of proposals) {
      try {
        const projectTitle = (proposal as any).requests?.title || "a project";
        await createNotification({
          userId: (proposal as any).collector_id,
          type: "proposal_accepted",
          title: "Proposal accepted",
          body: `Your proposal for "${projectTitle}" was accepted! You can now start submitting data.`,
          metadata: {
            request_id: (proposal as any).request_id,
            proposal_id: proposal.id,
            status: "accepted",
          },
        });
      } catch (notifyError) {
        console.error("Error creating acceptance notification:", notifyError);
      }
    }

    return { data: assignments, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to accept proposals"),
    };
  }
}

/**
 * Get collector assignment by token
 */
export async function getAssignmentByToken(
  token: string
): Promise<{ data: CollectorAssignment | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const queryPromise = supabase
      .from("collector_assignments")
      .select("*")
      .eq("submission_token", token)
      .eq("status", "active")
      .single();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please refresh the page.")), 15000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Get base URL
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return {
      data: {
        ...data,
        submission_link: `${baseUrl}/submit/${token}`,
      } as CollectorAssignment,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch assignment"),
    };
  }
}

/**
 * Get assignments by collector
 */
export async function getAssignmentsByCollector(
  collectorId: string
): Promise<{ data: (CollectorAssignment & { project?: { id: string; title: string } })[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("collector_assignments")
      .select(`
        *,
        requests(id, title)
      `)
      .eq("collector_id", collectorId)
      .eq("status", "active")
      .order("assigned_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Get base URL
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return {
      data: (data || []).map((assignment: any) => ({
        ...assignment,
        submission_link: `${baseUrl}/submit/${assignment.submission_token}`,
        project: assignment.requests ? { id: assignment.requests.id, title: assignment.requests.title } : undefined,
      })) as (CollectorAssignment & { project?: { id: string; title: string } })[],
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch assignments"),
    };
  }
}

/**
 * Get assignments for a project
 */
export async function getAssignmentsByProject(
  projectId: string
): Promise<{ data: CollectorAssignment[] | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("collector_assignments")
      .select("*")
      .eq("request_id", projectId)
      .order("assigned_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Get base URL
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return {
      data: (data || []).map((assignment) => ({
        ...assignment,
        submission_link: `${baseUrl}/submit/${assignment.submission_token}`,
      })) as CollectorAssignment[],
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch assignments"),
    };
  }
}

/**
 * Get assignment counts for multiple projects in a single query
 */
export async function getAssignmentCountsByProjects(
  projectIds: string[]
): Promise<{ data: Record<string, number>; error: Error | null }> {
  if (projectIds.length === 0) return { data: {}, error: null };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("collector_assignments")
      .select("request_id")
      .in("request_id", projectIds)
      .eq("status", "active");

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row) => {
      counts[row.request_id] = (counts[row.request_id] || 0) + 1;
    });

    return { data: counts, error: null };
  } catch (err) {
    return {
      data: {},
      error: err instanceof Error ? err : new Error("Failed to fetch assignment counts"),
    };
  }
}
