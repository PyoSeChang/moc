import { ipcMain } from 'electron';
import type { IpcResult } from '@moc/shared/types';
import { createProject, listProjects, deleteProject } from '@moc/core';

export function registerProjectIpc(): void {
  ipcMain.handle('project:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createProject(data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('project:list', async (): Promise<IpcResult<unknown>> => {
    try {
      const result = listProjects();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('project:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteProject(id);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
