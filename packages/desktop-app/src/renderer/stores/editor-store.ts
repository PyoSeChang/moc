import { create } from 'zustand';
import type { EditorViewMode, EditorTab, EditorTabType } from '@moc/shared/types';
import { editorPrefsService } from '../services';

interface OpenTabParams {
  type: EditorTabType;
  targetId: string;
  title: string;
  viewMode?: EditorViewMode;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTabId: string | null;

  /** Generic open: works for concept, file, or any future type */
  openTab: (params: OpenTabParams) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  setViewMode: (tabId: string, mode: EditorViewMode) => void;
  toggleMinimize: (tabId: string) => void;

  updateFloatRect: (tabId: string, rect: Partial<EditorTab['floatRect']>) => void;
  updateSideSplitRatio: (tabId: string, ratio: number) => void;
  updateTitle: (tabId: string, title: string) => void;

  setActiveFile: (tabId: string, filePath: string | null) => void;
  setDirty: (tabId: string, dirty: boolean) => void;

  clear: () => void;
}

const FLOAT_STAGGER = 30;
const DEFAULT_FLOAT_RECT = { x: 120, y: 80, width: 600, height: 450 };

let floatSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function debouncedSavePrefs(targetId: string, data: Record<string, unknown>) {
  if (floatSaveTimers[targetId]) {
    clearTimeout(floatSaveTimers[targetId]);
  }
  floatSaveTimers[targetId] = setTimeout(() => {
    editorPrefsService.upsert(targetId, data).catch((err) => {
      console.error('[EditorPrefs] Failed to save prefs:', targetId, err);
    });
    delete floatSaveTimers[targetId];
  }, 300);
}

function makeTabId(type: EditorTabType, targetId: string): string {
  return `${type}:${targetId}`;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: async ({ type, targetId, title, viewMode }) => {
    const { tabs } = get();
    const tabId = makeTabId(type, targetId);

    // Reuse existing tab
    const existing = tabs.find((t) => t.id === tabId);
    if (existing) {
      set({
        activeTabId: tabId,
        tabs: tabs.map((t) => (t.id === tabId ? { ...t, isMinimized: false } : t)),
      });
      return;
    }

    // Load prefs (concept tabs only)
    let prefs;
    if (type === 'concept') {
      try {
        prefs = await editorPrefsService.get(targetId);
      } catch (err) {
        console.error('[EditorPrefs] Failed to load prefs:', targetId, err);
      }
    }

    const floatCount = tabs.filter((t) => t.viewMode === 'float' && !t.isMinimized).length;
    const stagger = floatCount * FLOAT_STAGGER;

    const tab: EditorTab = {
      id: tabId,
      type,
      targetId,
      title,
      viewMode: viewMode ?? (prefs?.view_mode as EditorViewMode) ?? 'float',
      floatRect: {
        x: prefs?.float_x ?? DEFAULT_FLOAT_RECT.x + stagger,
        y: prefs?.float_y ?? DEFAULT_FLOAT_RECT.y + stagger,
        width: prefs?.float_width ?? DEFAULT_FLOAT_RECT.width,
        height: prefs?.float_height ?? DEFAULT_FLOAT_RECT.height,
      },
      isMinimized: false,
      sideSplitRatio: prefs?.side_split_ratio ?? 0.5,
      isDirty: false,
      activeFilePath: null,
    };

    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tabId }));
  },

  closeTab: (tabId) => {
    const tab = get().tabs.find((t) => t.id === tabId);
    // Save prefs before closing (concept tabs)
    if (tab && tab.type === 'concept') {
      editorPrefsService.upsert(tab.targetId, {
        view_mode: tab.viewMode,
        float_x: tab.floatRect.x,
        float_y: tab.floatRect.y,
        float_width: tab.floatRect.width,
        float_height: tab.floatRect.height,
        side_split_ratio: tab.sideSplitRatio,
      }).catch((err) => {
        console.error('[EditorPrefs] Failed to save on close:', tab.targetId, err);
      });
    }

    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== tabId);
      const activeTabId =
        s.activeTabId === tabId
          ? tabs.length > 0 ? tabs[tabs.length - 1].id : null
          : s.activeTabId;
      return { tabs, activeTabId };
    });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  setViewMode: (tabId, mode) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, viewMode: mode } : t)),
    }));
    const tab = get().tabs.find((t) => t.id === tabId);
    if (tab?.type === 'concept') {
      debouncedSavePrefs(tab.targetId, { view_mode: mode });
    }
  },

  toggleMinimize: (tabId) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, isMinimized: !t.isMinimized } : t,
      ),
    }));
  },

  updateFloatRect: (tabId, rect) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, floatRect: { ...t.floatRect, ...rect } } : t,
      ),
    }));
    const tab = get().tabs.find((t) => t.id === tabId);
    if (tab?.type === 'concept') {
      const merged = { ...tab.floatRect, ...rect };
      debouncedSavePrefs(tab.targetId, {
        float_x: merged.x, float_y: merged.y,
        float_width: merged.width, float_height: merged.height,
      });
    }
  },

  updateSideSplitRatio: (tabId, ratio) => {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, sideSplitRatio: clamped } : t,
      ),
    }));
    const tab = get().tabs.find((t) => t.id === tabId);
    if (tab?.type === 'concept') {
      debouncedSavePrefs(tab.targetId, { side_split_ratio: clamped });
    }
  },

  updateTitle: (tabId, title) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    }));
  },

  setActiveFile: (tabId, filePath) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, activeFilePath: filePath } : t,
      ),
    }));
  },

  setDirty: (tabId, dirty) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: dirty } : t)),
    }));
  },

  clear: () => {
    Object.values(floatSaveTimers).forEach(clearTimeout);
    floatSaveTimers = {};
    set({ tabs: [], activeTabId: null });
  },
}));
