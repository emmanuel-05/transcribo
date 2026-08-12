import { create } from "zustand";
import { projectService } from "@/services/projectService";
import { Project } from "@/types/project";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await projectService.getProjects();
      set({ projects: data.projects, isLoading: false });
    } catch {
      set({ error: "Erreur lors du chargement des projets", isLoading: false });
    }
  },

  createProject: async (name, description) => {
    const newProject = await projectService.createProject({ name, description });
    set({ projects: [newProject, ...get().projects] });
    return newProject;
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}));