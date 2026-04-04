import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createArchetype, listArchetypes, getArchetype, updateArchetype, deleteArchetype,
  createField, listFields, updateField, deleteField, reorderFields,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerArchetypeIpc(): void {
  ipcMain.handle('archetype:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createArchetype(data);
      broadcastChange({ type: 'archetypes', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetype:list', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listArchetypes(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetype:get', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getArchetype(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetype:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateArchetype(id, data);
      broadcastChange({ type: 'archetypes', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetype:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteArchetype(id);
      broadcastChange({ type: 'archetypes', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Archetype Fields
  ipcMain.handle('archetypeField:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createField(data);
      broadcastChange({ type: 'archetypes', action: 'updated', id: data.archetype_id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetypeField:list', async (_e, archetypeId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listFields(archetypeId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetypeField:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateField(id, data);
      broadcastChange({ type: 'archetypes', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetypeField:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteField(id);
      broadcastChange({ type: 'archetypes', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('archetypeField:reorder', async (_e, archetypeId: string, orderedIds: string[]): Promise<IpcResult<unknown>> => {
    try {
      reorderFields(archetypeId, orderedIds);
      broadcastChange({ type: 'archetypes', action: 'updated', id: archetypeId });
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
