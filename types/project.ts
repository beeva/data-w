/**
 * Project/Request related types and interfaces
 */

// Canonical project statuses used in the app / DB
// "open" represents active projects that are currently running/available
export type ProjectStatus = "open" | "paused" | "completed" | "cancelled";

export type ProjectCategory =
  | "Photography"
  | "Video"
  | "Audio"
  | "Text"
  | "Survey"
  | "Location Data"
  | "Sensor Data"
  | "Other";

export interface ProjectLocation {
  address?: string;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
}

export interface ProjectRequirements {
  data_types: string[];
  formats: string[];
  specifications?: string;
}

export interface Project {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string | null;
  status: ProjectStatus;
  max_collectors: number;
  created_at: string;
  updated_at: string;
  location: ProjectLocation | null;
  requirements: ProjectRequirements;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string | null;
  max_collectors: number;
  location: ProjectLocation | null;
  requirements: ProjectRequirements;
}

export interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  max_collectors: string;
  data_types: string[];
  formats: string[];
  specifications: string;
  location_address: string;
  location_lat: string;
  location_lng: string;
  radius_km: string;
}
