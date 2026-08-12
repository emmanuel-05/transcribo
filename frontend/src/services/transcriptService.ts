/**
 * Service pour la gestion des transcriptions, versions et génération de documents.
 */
import api from "./api";
import {
  TranscriptData,
  TranscriptVersion,
  DocumentGenerationParams,
} from "@/types/transcript";

export const transcriptService = {
  /**
   * Récupère la transcription associée à un fichier audio.
   */
  async getTranscript(projectId: string, audioId: string): Promise<TranscriptData> {
    const response = await api.get<TranscriptData>(
      `/projects/${projectId}/audios/${audioId}/transcript`
    );
    return response.data;
  },

  /**
   * Enregistre les modifications apportées à une transcription.
   */
  async updateTranscript(
    projectId: string,
    audioId: string,
    correctedText: string
  ): Promise<TranscriptData> {
    const response = await api.put<TranscriptData>(
      `/projects/${projectId}/audios/${audioId}/transcript`,
      { corrected_text: correctedText }
    );
    return response.data;
  },

  /**
   * Récupère l'historique des versions pour une transcription.
   */
  async getVersions(projectId: string, audioId: string): Promise<TranscriptVersion[]> {
    const response = await api.get<{ versions: TranscriptVersion[] }>(
      `/projects/${projectId}/audios/${audioId}/transcript/versions`
    );
    return response.data.versions;
  },

  /**
   * Restaure une version antérieure d'une transcription.
   */
  async restoreVersion(
    projectId: string,
    audioId: string,
    versionNumber: number
  ): Promise<TranscriptData> {
    const response = await api.post<TranscriptData>(
      `/projects/${projectId}/audios/${audioId}/transcript/restore/${versionNumber}`
    );
    return response.data;
  },

  /**
   * Génère un document officiel (PDF ou Word) à partir de la transcription.
   */
  async generateDocument(
    projectId: string,
    audioId: string,
    params: DocumentGenerationParams
  ): Promise<{ download_url: string }> {
    const response = await api.post<{ download_url: string }>(
      `/projects/${projectId}/audios/${audioId}/generate-doc`,
      params
    );
    return response.data;
  },
};
