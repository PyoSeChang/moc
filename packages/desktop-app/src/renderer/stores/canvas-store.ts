import { create } from 'zustand';
import type {
  Canvas, CanvasCreate, CanvasUpdate,
  CanvasNode, CanvasNodeCreate, CanvasNodeUpdate,
  Edge, EdgeCreate, Concept,
} from '@moc/shared/types';
import { canvasService } from '../services';

export interface CanvasNodeWithConcept extends CanvasNode {
  concept: Concept;
}

interface CanvasStore {
  canvases: Canvas[];
  currentCanvas: Canvas | null;
  nodes: CanvasNodeWithConcept[];
  edges: Edge[];
  loading: boolean;

  // Canvas CRUD
  loadCanvases: (projectId: string) => Promise<void>;
  createCanvas: (data: CanvasCreate) => Promise<Canvas>;
  openCanvas: (canvasId: string) => Promise<void>;
  updateCanvas: (id: string, data: CanvasUpdate) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;

  // Node
  addNode: (data: CanvasNodeCreate) => Promise<CanvasNode>;
  updateNode: (id: string, data: CanvasNodeUpdate) => Promise<void>;
  removeNode: (id: string) => Promise<void>;

  // Edge
  addEdge: (data: EdgeCreate) => Promise<Edge>;
  removeEdge: (id: string) => Promise<void>;

  // Viewport
  saveViewport: (viewport: { viewport_x: number; viewport_y: number; viewport_zoom: number }) => Promise<void>;

  clear: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvases: [],
  currentCanvas: null,
  nodes: [],
  edges: [],
  loading: false,

  loadCanvases: async (projectId) => {
    const canvases = await canvasService.list(projectId);
    set({ canvases });
  },

  createCanvas: async (data) => {
    const canvas = await canvasService.create(data);
    set((s) => ({ canvases: [...s.canvases, canvas] }));
    return canvas;
  },

  openCanvas: async (canvasId) => {
    set({ loading: true });
    try {
      const full = await canvasService.getFull(canvasId);
      if (!full) return;
      set({
        currentCanvas: full.canvas,
        nodes: full.nodes,
        edges: full.edges,
      });
    } finally {
      set({ loading: false });
    }
  },

  updateCanvas: async (id, data) => {
    const updated = await canvasService.update(id, data);
    set((s) => ({
      canvases: s.canvases.map((c) => (c.id === id ? updated : c)),
      currentCanvas: s.currentCanvas?.id === id ? updated : s.currentCanvas,
    }));
  },

  deleteCanvas: async (id) => {
    await canvasService.delete(id);
    set((s) => ({
      canvases: s.canvases.filter((c) => c.id !== id),
      currentCanvas: s.currentCanvas?.id === id ? null : s.currentCanvas,
      nodes: s.currentCanvas?.id === id ? [] : s.nodes,
      edges: s.currentCanvas?.id === id ? [] : s.edges,
    }));
  },

  addNode: async (data) => {
    const node = await canvasService.node.add(data);
    // Need to reload full to get concept data
    const { currentCanvas } = get();
    if (currentCanvas) await get().openCanvas(currentCanvas.id);
    return node;
  },

  updateNode: async (id, data) => {
    await canvasService.node.update(id, data);
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              position_x: data.position_x ?? n.position_x,
              position_y: data.position_y ?? n.position_y,
              width: data.width !== undefined ? data.width : n.width,
              height: data.height !== undefined ? data.height : n.height,
            }
          : n,
      ),
    }));
  },

  removeNode: async (id) => {
    await canvasService.node.remove(id);
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source_node_id !== id && e.target_node_id !== id),
    }));
  },

  addEdge: async (data) => {
    const edge = await canvasService.edge.create(data);
    set((s) => ({ edges: [...s.edges, edge] }));
    return edge;
  },

  removeEdge: async (id) => {
    await canvasService.edge.delete(id);
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
  },

  saveViewport: async (viewport) => {
    const { currentCanvas } = get();
    if (!currentCanvas) return;
    await get().updateCanvas(currentCanvas.id, viewport);
  },

  clear: () => set({ canvases: [], currentCanvas: null, nodes: [], edges: [] }),
}));
