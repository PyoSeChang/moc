import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  createCanvas, listCanvases, updateCanvas, deleteCanvas, getCanvasFull,
  getCanvasesByConceptId, getCanvasAncestors, getCanvasTree,
  addCanvasNode, updateCanvasNode, removeCanvasNode,
  createEdge, getEdge, updateEdge, deleteEdge,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerCanvasIpc(): void {
  // Canvas CRUD
  ipcMain.handle('canvas:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createCanvas(data);
      broadcastChange({ type: 'canvases', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:list', async (_e, projectId: string, rootOnly?: boolean): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: listCanvases(projectId, rootOnly) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateCanvas(id, data);
      broadcastChange({ type: 'canvases', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteCanvas(id);
      broadcastChange({ type: 'canvases', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:getFull', async (_e, canvasId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getCanvasFull(canvasId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:getByConcept', async (_e, conceptId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getCanvasesByConceptId(conceptId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:getAncestors', async (_e, canvasId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getCanvasAncestors(canvasId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvas:getTree', async (_e, projectId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getCanvasTree(projectId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Canvas Node
  ipcMain.handle('canvasNode:add', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = addCanvasNode(data);
      broadcastChange({ type: 'canvases', action: 'updated', id: data.canvas_id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasNode:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateCanvasNode(id, data);
      broadcastChange({ type: 'canvases', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('canvasNode:remove', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = removeCanvasNode(id);
      broadcastChange({ type: 'canvases', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Edge
  ipcMain.handle('edge:create', async (_e, data): Promise<IpcResult<unknown>> => {
    try {
      const result = createEdge(data);
      broadcastChange({ type: 'edges', action: 'created', id: result.id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('edge:get', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getEdge(id) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('edge:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateEdge(id, data);
      broadcastChange({ type: 'edges', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('edge:delete', async (_e, id: string): Promise<IpcResult<unknown>> => {
    try {
      const result = deleteEdge(id);
      broadcastChange({ type: 'edges', action: 'deleted', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
