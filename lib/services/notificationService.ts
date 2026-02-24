/**
 * Supabase service functions for Notifications
 */

import { createClient, supabase } from "@/lib/supabase/client";
import type {
  AppNotification,
  CreateNotificationInput,
} from "@/types/notification";

/**
 * Fetch notifications for the current user
 */
export async function getNotifications(
  limit: number = 20
): Promise<{ data: AppNotification[] | null; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as AppNotification[]) || [], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch notifications"),
    };
  }
}

/**
 * Get unread notifications count for the current user
 */
export async function getUnreadNotificationCount(): Promise<{
  count: number;
  error: Error | null;
}> {
  try {
    // const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { count: 0, error: null };

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return { count: 0, error: new Error(error.message) };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    return {
      count: 0,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch unread notifications count"),
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(
  id: string
): Promise<{ error: Error | null }> {
  try {
    // const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to mark notification as read"),
    };
  }
}

/**
 * Mark all notifications for the current user as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  error: Error | null;
}> {
  try {
    // const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: null };

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to mark notifications as read"),
    };
  }
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ error: Error | null }> {
  try {
    // const supabase = createClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title ?? null,
      body: input.body,
      metadata: input.metadata ?? null,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to create notification"),
    };
  }
}

