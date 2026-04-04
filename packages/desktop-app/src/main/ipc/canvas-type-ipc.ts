import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createCanvasType, listCanvasTypes, getCanvasType,
  updateCanvasType, deleteCanvasType,
  addAllowedRelation, removeAllowedRelation, removeAllowedRelationByPair, listAllowedRelations,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerCanvasTypeIpc(): void {
  ipcMain.handle('canvasType:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createCanvasType(data);
      broadcastChange({ type: 'canvasTypes', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:list', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listCanvasTypes(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:get', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getCanvasType(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateCanvasType(id, data);
      broadcastChange({ type: 'canvasTypes', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteCanvasType(id);
      broadcastChange({ type: 'canvasTypes', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:addRelation', async (_e, canvasTypeId: string, relationTypeId: string): Promise<IpcResult<unknown>> => {
    try {
      const result = addAllowedRelation(canvasTypeId, relationTypeId);
      broadcastChange({ type: 'canvasTypes', action: 'updated', id: canvasTypeId });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:removeRelation', async (_e, canvasTypeId: string, relationTypeId: string): Promise<IpcResult<unknown>> => {
    try {
      const result = removeAllowedRelationByPair(canvasTypeId, relationTypeId);
      broadcastChange({ type: 'canvasTypes', action: 'updated', id: canvasTypeId });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasType:listRelations', async (_e, canvasTypeId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listAllowedRelations(canvasTypeId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
