// frontend/src/store/projectStore.ts
import { create } from 'zustand';
import api from '@/services/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

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
      const response = await api.get('/projects/');
      // Backend renvoie { projects: [...], total: ... }
      set({ projects: response.data.projects, isLoading: false });
    } catch (err: any) {
      set({ error: 'Erreur lors du chargement des projets', isLoading: false });
    }
  },

  createProject: async (name, description) => {
    const response = await api.post('/projects/', { name, description });
    set({ projects: [response.data, ...get().projects] });
    return response.data;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}));