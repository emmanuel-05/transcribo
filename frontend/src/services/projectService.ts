/**
 * Service pour les opérations CRUD sur les projets.
 */
import api from "./api";
import {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectListResponse,
} from "@/types/project";

export const projectService = {
  /**
   * Récupère tous les projets appartenant à l'utilisateur connecté.
   */
  async getProjects(): Promise<ProjectListResponse> {
    const response = await api.get<ProjectListResponse>("/projects");
    return response.data;
  },

  /**
   * Récupère les détails d'un projet spécifique par son ID.
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Crée un nouveau projet.
   */
  async createProject(input: ProjectCreateInput): Promise<Project> {
    const response = await api.post<Project>("/projects", input);
    return response.data;
  },

  /**
   * Met à jour les informations d'un projet.
   */
  async updateProject(projectId: string, input: ProjectUpdateInput): Promise<Project> {
    const response = await api.patch<Project>(`/projects/${projectId}`, input);
    return response.data;
  },

  /**
   * Supprime un projet ainsi que toutes ses données associées.
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },
};
