/**
 * Types et interfaces relatifs aux projets de transcription.
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc";
