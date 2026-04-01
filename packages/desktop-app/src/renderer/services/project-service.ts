import type { Project, ProjectCreate } from '@netior/shared/types';
import { unwrapIpc } from './ipc';

export async function createProject(data: ProjectCreate): Promise<Project> {
  return unwrapIpc(await window.electron.project.create(data));
}

export async function listProjects(): Promise<Project[]> {
  return unwrapIpc(await window.electron.project.list());
}

export async function deleteProject(id: string): Promise<boolean> {
  return unwrapIpc(await window.electron.project.delete(id));
}

export async function updateProjectRootDir(id: string, rootDir: string): Promise<Project> {
  return unwrapIpc(await window.electron.project.updateRootDir(id, rootDir));
}

export const projectService = { create: createProject, list: listProjects, delete: deleteProject, updateRootDir: updateProjectRootDir };
