import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import { upsertProperty, getByConceptId, deleteProperty } from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerConceptPropertyIpc(): void {
  ipcMain.handle('conceptProp:upsert', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = upsertProperty(data);
      broadcastChange({ type: 'concepts', action: 'updated', id: data.concept_id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('conceptProp:getByConcept', async (_e, conceptId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getByConceptId(conceptId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('conceptProp:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteProperty(id);
      broadcastChange({ type: 'concepts', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
