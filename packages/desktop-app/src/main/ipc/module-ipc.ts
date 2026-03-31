import { ipcMain } from 'electron';
import type { IpcResult } from '@moc/shared/types';
import {
  createModule, listModules, updateModule, deleteModule,
  addModuleDirectory, listModuleDirectories, removeModuleDirectory,
} from '@moc/core';

export function registerModuleIpc(): void {
  ipcMain.handle('module:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: createModule(data) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('module:list', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listModules(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('module:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: updateModule(id, data) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('module:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: deleteModule(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Module Directory
  ipcMain.handle('moduleDir:add', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: addModuleDirectory(data) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('moduleDir:list', async (_e, moduleId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listModuleDirectories(moduleId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('moduleDir:remove', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: removeModuleDirectory(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
