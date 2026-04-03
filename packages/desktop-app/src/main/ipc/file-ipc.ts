import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createFileEntity, getFileEntity, getFileEntityByPath,
  getFileEntitiesByProject, updateFileEntity, deleteFileEntity,
} from '@netior/core';

export function registerFileIpc(): void {
  ipcMain.handle('file:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: createFileEntity(data) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('file:get', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getFileEntity(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('file:getByPath', async (_e, projectId: string, path: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getFileEntityByPath(projectId, path) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('file:getByProject', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getFileEntitiesByProject(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('file:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: updateFileEntity(id, data) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('file:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: deleteFileEntity(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
