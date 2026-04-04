import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createRelationType, listRelationTypes, getRelationType,
  updateRelationType, deleteRelationType,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerRelationTypeIpc(): void {
  ipcMain.handle('relationType:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createRelationType(data);
      broadcastChange({ type: 'relationTypes', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('relationType:list', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listRelationTypes(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('relationType:get', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getRelationType(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('relationType:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateRelationType(id, data);
      broadcastChange({ type: 'relationTypes', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('relationType:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteRelationType(id);
      broadcastChange({ type: 'relationTypes', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
