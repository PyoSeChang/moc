import type { Project, ProjectCreate } from '@moc/shared/types';
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

export const projectService = { create: createProject, list: listProjects, delete: deleteProject };
