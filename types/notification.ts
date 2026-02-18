/**
 * Notification types and interfaces
 */

export type NotificationType =
  | "project_created"
  | "project_updated"
  | "proposal_submitted"
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_rejected"
  | "assignment_created"
  | "submission_created"
  | "submission_validated"
  | "submission_rejected"
  | "payment_completed"
  | "system";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string | null;
  body: string;
  metadata: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title?: string;
  body: string;
  metadata?: Record<string, any>;
}

