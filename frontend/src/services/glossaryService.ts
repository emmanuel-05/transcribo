/**
 * Service pour la gestion du glossaire d'un projet.
 */
import api from "./api";
import { GlossaryData } from "@/types/glossary";

export const glossaryService = {
  /**
   * Récupère la liste des termes du glossaire pour un projet.
   */
  async getGlossary(projectId: string): Promise<GlossaryData> {
    const response = await api.get<GlossaryData>(`/projects/${projectId}/glossary`);
    return response.data;
  },

  /**
   * Met à jour l'ensemble des termes du glossaire pour un projet.
   */
  async updateGlossary(projectId: string, terms: string[]): Promise<GlossaryData> {
    const response = await api.put<GlossaryData>(`/projects/${projectId}/glossary`, {
      terms,
    });
    return response.data;
  },
};
