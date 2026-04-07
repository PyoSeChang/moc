import { ipcMain } from 'electron';
import type { IpcResult } from '@netior/shared/types';
import {
  getLayoutByNetwork, updateLayout, deleteLayout,
  setNodePosition, getNodePositions, removeNodePosition,
  setEdgeVisual, getEdgeVisuals, removeEdgeVisual,
} from '@netior/core';
import { broadcastChange } from './broadcast-change';

export function registerLayoutIpc(): void {
  // Layout
  ipcMain.handle('layout:getByNetwork', async (_e, networkId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getLayoutByNetwork(networkId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('layout:update', async (_e, id: string, data): Promise<IpcResult<unknown>> => {
    try {
      const result = updateLayout(id, data);
      broadcastChange({ type: 'layouts', action: 'updated', id });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Layout Nodes
  ipcMain.handle('layoutNode:setPosition', async (_e, layoutId: string, nodeId: string, positionJson: string): Promise<IpcResult<unknown>> => {
    try {
      setNodePosition(layoutId, nodeId, positionJson);
      broadcastChange({ type: 'layouts', action: 'updated', id: layoutId });
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('layoutNode:getPositions', async (_e, layoutId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getNodePositions(layoutId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('layoutNode:remove', async (_e, layoutId: string, nodeId: string): Promise<IpcResult<unknown>> => {
    try {
      const result = removeNodePosition(layoutId, nodeId);
      broadcastChange({ type: 'layouts', action: 'updated', id: layoutId });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Layout Edges
  ipcMain.handle('layoutEdge:setVisual', async (_e, layoutId: string, edgeId: string, visualJson: string): Promise<IpcResult<unknown>> => {
    try {
      setEdgeVisual(layoutId, edgeId, visualJson);
      broadcastChange({ type: 'layouts', action: 'updated', id: layoutId });
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('layoutEdge:getVisuals', async (_e, layoutId: string): Promise<IpcResult<unknown>> => {
    try {
      return { success: true, data: getEdgeVisuals(layoutId) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('layoutEdge:remove', async (_e, layoutId: string, edgeId: string): Promise<IpcResult<unknown>> => {
    try {
      const result = removeEdgeVisual(layoutId, edgeId);
      broadcastChange({ type: 'layouts', action: 'updated', id: layoutId });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
