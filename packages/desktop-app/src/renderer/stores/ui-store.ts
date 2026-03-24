import { create } from 'zustand';

export type CanvasMode = 'browse' | 'edit';
export type RenderingMode = 'canvas';
type SidebarView = 'canvases' | 'files' | 'search';

interface UIStore {
  canvasMode: CanvasMode;
  sidebarView: SidebarView;
  sidebarOpen: boolean;
  editorDockOpen: boolean;

  setCanvasMode: (mode: CanvasMode) => void;
  setSidebarView: (view: SidebarView) => void;
  toggleSidebar: () => void;
  toggleEditorDock: () => void;
  setEditorDockOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  canvasMode: 'edit',
  sidebarView: 'canvases',
  sidebarOpen: true,
  editorDockOpen: false,

  setCanvasMode: (mode) => set({ canvasMode: mode }),
  setSidebarView: (view) => set({ sidebarView: view }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleEditorDock: () => set((s) => ({ editorDockOpen: !s.editorDockOpen })),
  setEditorDockOpen: (open) => set({ editorDockOpen: open }),
}));
