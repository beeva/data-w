/**
 * Proposal related types and interfaces
 */

export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface CollectorLocation {
  address: string;
  lat: number | null;
  lng: number | null;
  city?: string;
  country?: string;
}

export interface CollectorCapabilities {
  data_types: string[];
  equipment?: string[];
  experience_years?: number;
  languages?: string[];
  availability?: string;
  notes?: string;
}

export interface Proposal {
  id: string;
  request_id: string;
  collector_id: string;
  status: ProposalStatus;
  location: CollectorLocation;
  capabilities: CollectorCapabilities;
  proposed_budget?: number | null;
  message?: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalWithCollector extends Proposal {
  collector?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
    rating: number | null;
    bio: string | null;
    phone: string | null;
    total_earnings: number | null;
    total_submissions: number | null;
    completed_tasks: number | null;
    verification_tier: string | null;
  };
}

export interface CreateProposalInput {
  request_id: string;
  location: CollectorLocation;
  capabilities: CollectorCapabilities;
  proposed_budget?: number | null;
  message?: string | null;
}

export interface CollectorAssignment {
  id: string;
  request_id: string;
  collector_id: string;
  proposal_id: string;
  submission_token: string; // Unique token for submission link
  submission_link: string; // Full URL for submission
  status: "active" | "completed" | "cancelled";
  assigned_at: string;
  created_at: string;
  updated_at: string;
}
