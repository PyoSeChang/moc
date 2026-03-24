import type {
  Canvas, CanvasCreate, CanvasUpdate,
  CanvasNode, CanvasNodeCreate, CanvasNodeUpdate,
  Edge, EdgeCreate,
} from '@moc/shared/types';
import { unwrapIpc } from './ipc';

// Canvas
export async function createCanvas(data: CanvasCreate): Promise<Canvas> {
  return unwrapIpc(await window.electron.canvas.create(data as Record<string, unknown>));
}

export async function listCanvases(projectId: string): Promise<Canvas[]> {
  return unwrapIpc(await window.electron.canvas.list(projectId));
}

export async function updateCanvas(id: string, data: CanvasUpdate): Promise<Canvas> {
  return unwrapIpc(await window.electron.canvas.update(id, data as Record<string, unknown>));
}

export async function deleteCanvas(id: string): Promise<boolean> {
  return unwrapIpc(await window.electron.canvas.delete(id));
}

export async function getCanvasFull(canvasId: string) {
  return unwrapIpc(await window.electron.canvas.getFull(canvasId));
}

// Canvas Node
export async function addCanvasNode(data: CanvasNodeCreate): Promise<CanvasNode> {
  return unwrapIpc(await window.electron.canvasNode.add(data as Record<string, unknown>));
}

export async function updateCanvasNode(id: string, data: CanvasNodeUpdate): Promise<CanvasNode> {
  return unwrapIpc(await window.electron.canvasNode.update(id, data as Record<string, unknown>));
}

export async function removeCanvasNode(id: string): Promise<boolean> {
  return unwrapIpc(await window.electron.canvasNode.remove(id));
}

// Edge
export async function createEdge(data: EdgeCreate): Promise<Edge> {
  return unwrapIpc(await window.electron.edge.create(data as Record<string, unknown>));
}

export async function deleteEdge(id: string): Promise<boolean> {
  return unwrapIpc(await window.electron.edge.delete(id));
}

export const canvasService = {
  create: createCanvas, list: listCanvases, update: updateCanvas,
  delete: deleteCanvas, getFull: getCanvasFull,
  node: { add: addCanvasNode, update: updateCanvasNode, remove: removeCanvasNode },
  edge: { create: createEdge, delete: deleteEdge },
};
