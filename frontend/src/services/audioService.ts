/**
 * Service pour la gestion des fichiers audio et des opérations de transcription.
 */
import api from "./api";
import { AudioFile, AudioListResponse } from "@/types/audio";

export const audioService = {
  /**
   * Récupère la liste des fichiers audio d'un projet.
   */
  async getProjectAudios(projectId: string): Promise<AudioListResponse> {
    const response = await api.get<AudioListResponse>(`/projects/${projectId}/audios`);
    return response.data;
  },

  /**
   * Téléverse un fichier audio dans un projet avec suivi de la progression.
   */
  async uploadAudio(
    projectId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<AudioFile> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<AudioFile>(
      `/projects/${projectId}/audios`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return response.data;
  },

  /**
   * Supprime un fichier audio.
   */
  async deleteAudio(projectId: string, audioId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/audios/${audioId}`);
  },

  /**
   * Supprime tous les fichiers audio d'un projet.
   */
  async deleteAllAudios(projectId: string): Promise<{ deleted_count: number }> {
    const response = await api.delete<{ deleted_count: number }>(
      `/projects/${projectId}/audios/all`
    );
    return response.data;
  },

  /**
   * Supprime une sélection de fichiers audio.
   */
  async deleteMultipleAudios(
    projectId: string,
    audioIds: string[]
  ): Promise<{ deleted_count: number }> {
    const response = await api.post<{ deleted_count: number }>(
      `/projects/${projectId}/audios/batch-delete`,
      { audio_ids: audioIds }
    );
    return response.data;
  },

  /**
   * Lance le processus de transcription automatique pour un fichier audio.
   */
  async transcribeAudio(projectId: string, audioId: string): Promise<void> {
    await api.post(`/projects/${projectId}/audios/${audioId}/transcribe`);
  },

  /**
   * Lance la transcription de tous les fichiers non transcrits du projet.
   */
  async transcribeAllAudios(projectId: string): Promise<{ launched_count: number }> {
    const response = await api.post<{ launched_count: number }>(
      `/projects/${projectId}/audios/transcribe-all`
    );
    return response.data;
  },

  /**
   * Lance la transcription d'une sélection de fichiers (ignorant ceux déjà transcrits).
   */
  async transcribeMultipleAudios(
    projectId: string,
    audioIds: string[]
  ): Promise<{ launched_count: number }> {
    const response = await api.post<{ launched_count: number }>(
      `/projects/${projectId}/audios/batch-transcribe`,
      { audio_ids: audioIds }
    );
    return response.data;
  },

  /**
   * Récupère l'URL de streaming direct d'un fichier audio.
   */
  async getAudioStreamUrl(projectId: string, audioId: string): Promise<string> {
    const response = await api.get<{ stream_url: string }>(
      `/projects/${projectId}/audios/${audioId}/stream`
    );
    return response.data.stream_url;
  },
};
