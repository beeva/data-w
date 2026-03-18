/**
 * Submission related types and interfaces
 */

export type SubmissionStatus = "pending" | "validated" | "rejected" | "disputed";
export type DataVisibility = "public" | "private";

export interface SubmissionMetadata {
  device_info?: string;
  gps_data?: {
    lat: number;
    lng: number;
  };
  timestamp?: string;
  notes?: string;
}

export interface Submission {
  id: string;
  request_id: string;
  collector_id: string;
  status: SubmissionStatus;
  rejection_reason: string | null;
  validation_score: number | null;
  submitted_at: string;
  validated_at: string | null;
  validator_id: string | null;
  agent_validated: boolean;
  agent_validated_at: string | null;
  agent_id: string | null;
  metadata: SubmissionMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithCollector extends Submission {
  collector?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    rating: number | null;
  };
}

export interface DataItem {
  id: string;
  submission_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  visibility: DataVisibility | null;
  price: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Validation {
  id: string;
  submission_id: string;
  validator_id: string;
  is_valid: boolean;
  score: number;
  feedback: string | null;
  created_at: string;
}

export interface ProjectStats {
  total_submissions: number;
  pending_submissions: number;
  validated_submissions: number;
  rejected_submissions: number;
  disputed_submissions: number;
  average_validation_score: number | null;
}
