/**
 * Types et interfaces relatifs aux transcriptions, versions et documents.
 */

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string | number;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string | number;
  words?: TranscriptWord[];
}

export interface TranscriptData {
  id: string;
  audio_file_id: string;
  version: number;
  raw_text: string | null;
  corrected_text: string | null;
  raw_json: {
    segments?: TranscriptSegment[];
    words?: TranscriptWord[];
    [key: string]: any;
  } | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptVersion {
  id: string;
  transcript_id: string;
  version_number: number;
  content: string;
  source: string;
  created_at: string;
}

export interface DocumentGenerationParams {
  expediteur: string;
  destinataire: string;
  objet: string;
}
