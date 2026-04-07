import { ipcMain } from 'electron';
import type { IpcResult, TypeGroupKind } from '@netior/shared/types';
import { createTypeGroup, listTypeGroups, updateTypeGroup, deleteTypeGroup } from '@netior/core';

export function registerTypeGroupIpc(): void {
  ipcMain.handle('typeGroup:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createTypeGroup(data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('typeGroup:list', async (_e, projectId: string, kind: TypeGroupKind): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listTypeGroups(projectId, kind) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('typeGroup:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateTypeGroup(id, data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('typeGroup:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteTypeGroup(id);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
