import { create } from 'zustand';
import type { Project } from '@moc/shared/types';
import { projectService } from '../services';
import { unwrapIpc } from '../services/ipc';
import { saveProjectState, restoreProjectState, clearAllProjectStores, deleteProjectState } from './project-state-cache';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;

  loadProjects: () => Promise<void>;
  restoreLastProject: () => Promise<void>;
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

  restoreLastProject: async () => {
    try {
      const lastId = unwrapIpc(await window.electron.config.get('lastProjectId')) as string | null;
      if (!lastId) return;
      const { projects } = get();
      const project = projects.find((p) => p.id === lastId);
      if (project) {
        set({ currentProject: project });
      }
    } catch {
      // ignore — config may not exist yet
    }
  },

  createProject: async (name, rootDir) => {
    const project = await projectService.create({ name, root_dir: rootDir });
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  openProject: (project) => {
    const { currentProject } = get();
    if (currentProject && currentProject.id !== project.id) {
      saveProjectState(currentProject.id);
    }

    const restored = restoreProjectState(project.id);
    if (!restored) {
      clearAllProjectStores();
    }

    set({ currentProject: project });
    window.electron.config.set('lastProjectId', project.id).catch(() => {});
  },

  closeProject: () => {
    const { currentProject } = get();
    if (currentProject) {
      saveProjectState(currentProject.id);
    }
    clearAllProjectStores();
    set({ currentProject: null });
    window.electron.config.set('lastProjectId', '').catch(() => {});
  },

  deleteProject: async (id) => {
    await projectService.delete(id);
    deleteProjectState(id);
    const lastId = unwrapIpc(await window.electron.config.get('lastProjectId').catch(() => ({ success: true, data: null }))) as string | null;
    if (lastId === id) {
      window.electron.config.set('lastProjectId', '').catch(() => {});
    }
    const wasCurrent = get().currentProject?.id === id;
    if (wasCurrent) {
      clearAllProjectStores();
    }
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: wasCurrent ? null : s.currentProject,
    }));
  },
}));
