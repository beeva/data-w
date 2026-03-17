import { supabase } from "@/lib/supabase/client";

export interface ProjectMessage {
  id: string;
  request_id: string;
  requester_id: string;
  collector_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface ChatConversation {
  assignmentId: string;
  requestId: string;
  collectorId: string;
  requesterId: string;
  projectTitle: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatar: string | null;
  counterpartEmail: string | null;
  counterpartAddress: string | null;
  counterpartLastActiveAt: string | null;
  assignedAt: string;
  status: string;
  lastMessage?: ProjectMessage;
}

type AssignmentRow = {
  id: string;
  request_id: string;
  collector_id: string;
  status: string;
  assigned_at: string;
};

type RequestRow = {
  id: string;
  requester_id: string;
  title: string | null;
};

type RequestIdRow = {
  id: string;
};

type ProfileLocation = {
  address?: string;
  city?: string;
  country?: string;
} | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  location?: ProfileLocation;
  last_active_at?: string | null;
};

export async function getUserConversations(
  userId: string,
  role: string
): Promise<{ data: ChatConversation[] | null; error: Error | null }> {
  try {
    const assignmentsQuery = supabase
      .from("collector_assignments")
      .select("id, request_id, collector_id, status, assigned_at")
      .in("status", ["active", "completed"]);

    let assignmentsData: AssignmentRow[] | null = null;
    let assignmentsError: { message: string } | null = null;

    if (role === "collector" || role === "agent") {
      const result = await assignmentsQuery.eq("collector_id", userId);
      assignmentsData = result.data as AssignmentRow[] | null;
      assignmentsError = result.error;
    } else {
      const { data: requestRows, error: requestsLookupError } = await supabase
        .from("requests")
        .select("id")
        .eq("requester_id", userId);

      if (requestsLookupError) {
        return { data: null, error: new Error(requestsLookupError.message) };
      }

      const requesterProjectIds = ((requestRows || []) as RequestIdRow[]).map(
        (row) => row.id
      );
      if (requesterProjectIds.length === 0) {
        return { data: [], error: null };
      }

      const result = await assignmentsQuery.in("request_id", requesterProjectIds);
      assignmentsData = result.data as AssignmentRow[] | null;
      assignmentsError = result.error;
    }

    if (assignmentsError) {
      return { data: null, error: new Error(assignmentsError.message) };
    }

    const assignments = assignmentsData ?? [];
    if (assignments.length === 0) {
      return { data: [], error: null };
    }

    const requestIds = Array.from(new Set(assignments.map((a) => a.request_id)));
    const collectorIds = Array.from(new Set(assignments.map((a) => a.collector_id)));

    const [{ data: requestsData, error: requestsError }, { data: collectorProfilesData, error: collectorsError }] =
      await Promise.all([
        supabase.from("requests").select("id, requester_id, title").in("id", requestIds),
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, email, location, last_active_at")
          .in("id", collectorIds),
      ]);

    if (requestsError) {
      return { data: null, error: new Error(requestsError.message) };
    }

    if (collectorsError) {
      return { data: null, error: new Error(collectorsError.message) };
    }

    const requests = (requestsData ?? []) as RequestRow[];
    const collectorProfiles = (collectorProfilesData ?? []) as ProfileRow[];
    const requesterIds = Array.from(
      new Set(requests.map((request) => request.requester_id))
    );

    const { data: requesterProfilesData, error: requestersError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email, location, last_active_at")
      .in("id", requesterIds);

    if (requestersError) {
      return { data: null, error: new Error(requestersError.message) };
    }

    const requesterProfiles = (requesterProfilesData ?? []) as ProfileRow[];

    const requestsById = new Map(requests.map((row) => [row.id, row]));
    const profilesById = new Map(
      [...collectorProfiles, ...requesterProfiles].map((row) => [row.id, row])
    );

    const { data: messagesData, error: messagesError } = await supabase
      .from("project_messages")
      .select(
        "id, request_id, requester_id, collector_id, sender_id, message, created_at"
      )
      .in("request_id", requestIds)
      .order("created_at", { ascending: false });

    if (messagesError && messagesError.code !== "42P01") {
      return { data: null, error: new Error(messagesError.message) };
    }

    const messages = ((messagesData ?? []) as ProjectMessage[]).filter((message) =>
      assignments.some(
        (assignment) =>
          assignment.request_id === message.request_id &&
          assignment.collector_id === message.collector_id
      )
    );

    const latestByConversation = new Map<string, ProjectMessage>();
    messages.forEach((message) => {
      const key = `${message.request_id}:${message.collector_id}`;
      if (!latestByConversation.has(key)) {
        latestByConversation.set(key, message);
      }
    });

    const uniqueByRequestCollector = new Map<string, AssignmentRow>();
    assignments.forEach((assignment) => {
      const key = `${assignment.request_id}:${assignment.collector_id}`;
      const existing = uniqueByRequestCollector.get(key);
      if (!existing) {
        uniqueByRequestCollector.set(key, assignment);
        return;
      }
      if (
        new Date(assignment.assigned_at).getTime() >
        new Date(existing.assigned_at).getTime()
      ) {
        uniqueByRequestCollector.set(key, assignment);
      }
    });

    const conversations: ChatConversation[] = Array.from(
      uniqueByRequestCollector.values()
    )
      .reduce<ChatConversation[]>((acc, assignment) => {
        const request = requestsById.get(assignment.request_id);
        if (!request) return acc;

        const collectorId = assignment.collector_id;
        const requesterId = request.requester_id;
        const conversationKey = `${assignment.request_id}:${collectorId}`;
        const isWorkerRole = role === "collector" || role === "agent";
        const counterpartId = isWorkerRole ? requesterId : collectorId;
        const counterpartProfile = profilesById.get(counterpartId);
        const counterpartName =
          counterpartProfile?.full_name?.trim() ||
          counterpartProfile?.email ||
          "Unknown user";

        const loc = counterpartProfile?.location;
        const counterpartAddress =
          loc && typeof loc === "object"
            ? [loc.city, loc.country].filter(Boolean).join(", ") || null
            : null;

        acc.push({
          assignmentId: assignment.id,
          requestId: assignment.request_id,
          collectorId,
          requesterId,
          projectTitle: request.title || "Untitled project",
          counterpartId,
          counterpartName,
          counterpartAvatar: counterpartProfile?.avatar_url || null,
          counterpartEmail: counterpartProfile?.email || null,
          counterpartAddress: counterpartAddress || null,
          counterpartLastActiveAt: counterpartProfile?.last_active_at || null,
          assignedAt: assignment.assigned_at,
          status: assignment.status,
          lastMessage: latestByConversation.get(conversationKey),
        });

        return acc;
      }, [])
      .sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.assignedAt;
        const bTime = b.lastMessage?.created_at || b.assignedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return { data: conversations, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to load conversations"),
    };
  }
}

export async function getConversationMessages(
  requestId: string,
  collectorId: string
): Promise<{ data: ProjectMessage[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("project_messages")
      .select("id, request_id, requester_id, collector_id, sender_id, message, created_at")
      .eq("request_id", requestId)
      .eq("collector_id", collectorId)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as ProjectMessage[]) || [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch messages"),
    };
  }
}

const CHAT_ATTACHMENTS_BUCKET = "chat-attachments";

export async function uploadChatAttachment(
  requestId: string,
  collectorId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${requestId}/${collectorId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: urlData } = supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error("Failed to upload file"),
    };
  }
}

export async function sendConversationMessage(input: {
  requestId: string;
  collectorId: string;
  requesterId: string;
  senderId: string;
  message: string;
}): Promise<{ data: ProjectMessage | null; error: Error | null }> {
  try {
    const trimmed = input.message.trim();
    if (!trimmed) {
      return { data: null, error: new Error("Message cannot be empty.") };
    }

    const { data, error } = await supabase
      .from("project_messages")
      .insert({
        request_id: input.requestId,
        collector_id: input.collectorId,
        requester_id: input.requesterId,
        sender_id: input.senderId,
        message: trimmed,
      })
      .select("id, request_id, requester_id, collector_id, sender_id, message, created_at")
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ProjectMessage, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to send message"),
    };
  }
}
