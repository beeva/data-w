/**
 * User and Profile related types and interfaces
 */

export type UserRole = "requester" | "collector" | "agent" | "admin";

export type VerificationTier = "bronze" | "silver" | "gold" | "platinum";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  verification_tier: VerificationTier | null;
  avatar_url: string | null;
  bio: string | null;
  location: {
    lat?: number;
    lng?: number;
    address?: string;
    city?: string;
    country?: string;
  } | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  // Requester specific fields
  company_name: string | null;
  company_website: string | null;
  // Collector specific fields
  total_earnings: number | null;
  total_submissions: number | null;
  rating: number | null;
  completed_tasks: number | null;
  // Agent/Validator specific fields
  validation_score: number | null;
  total_validations: number | null;
}
