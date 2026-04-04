import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createConcept, getConceptsByProject, updateConcept, deleteConcept, searchConcepts,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerConceptIpc(): void {
  ipcMain.handle('concept:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createConcept(data);
      broadcastChange({ type: 'concepts', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('concept:getByProject', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getConceptsByProject(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('concept:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateConcept(id, data);
      broadcastChange({ type: 'concepts', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('concept:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteConcept(id);
      broadcastChange({ type: 'concepts', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('concept:search', async (_e, projectId: string, query: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: searchConcepts(projectId, query) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
