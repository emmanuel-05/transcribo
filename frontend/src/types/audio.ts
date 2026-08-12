/**
 * Types et interfaces relatifs aux fichiers audio.
 */

export type AudioStatus =
  | "uploaded"
  | "converting"
  | "converted"
  | "transcribing"
  | "correcting"
  | "transcribed"
  | "error";

export interface AudioFile {
  id: string;
  project_id: string;
  original_filename: string;
  format: string;
  duration_secs: number | null;
  storage_path_raw?: string;
  storage_path_converted?: string;
  status: AudioStatus;
  created_at: string;
}

export interface AudioListResponse {
  files: AudioFile[];
  total: number;
}
