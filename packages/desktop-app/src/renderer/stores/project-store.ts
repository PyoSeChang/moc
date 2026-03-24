import { create } from 'zustand';
import type { Project } from '@moc/shared/types';
import { projectService } from '../services';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;

  loadProjects: () => Promise<void>;
  createProject: (name: string, rootDir: string) => Promise<Project>;
  openProject: (project: Project) => void;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await projectService.list();
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (name, rootDir) => {
    const project = await projectService.create({ name, root_dir: rootDir });
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  openProject: (project) => {
    set({ currentProject: project });
  },

  closeProject: () => {
    set({ currentProject: null });
  },

  deleteProject: async (id) => {
    await projectService.delete(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }));
  },
}));
