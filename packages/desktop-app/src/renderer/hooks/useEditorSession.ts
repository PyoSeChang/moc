import { useState, useRef, useCallback, useEffect } from 'react';
import { useEditorStore } from '../stores/editor-store';
import { registerSession, unregisterSession } from '../lib/editor-session-registry';

export interface EditorSessionConfig<T> {
  tabId: string;
  /** Load initial/persisted state */
  load: () => Promise<T> | T;
  /** Persist state */
  save: (state: T) => Promise<void>;
  /** Custom equality check (default: JSON.stringify comparison) */
  isEqual?: (a: T, b: T) => boolean;
  /** Dependencies that trigger reload */
  deps?: unknown[];
}

export interface EditorSession<T> {
  state: T;
  setState: (updater: T | ((prev: T) => T)) => void;
  isDirty: boolean;
  save: () => Promise<void>;
  revert: () => void;
  isLoading: boolean;
  reload: () => Promise<void>;
}

function defaultIsEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useEditorSession<T>(config: EditorSessionConfig<T>): EditorSession<T> {
  const { tabId, load, save, isEqual = defaultIsEqual, deps = [] } = config;

  const [state, setStateRaw] = useState<T>(undefined as unknown as T);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirtyLocal] = useState(false);
  const snapshotRef = useRef<T>(undefined as unknown as T);
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  // Stable refs for save config to avoid stale closures
  const saveRef = useRef(save);
  saveRef.current = save;
  const loadRef = useRef(load);
  loadRef.current = load;

  const syncDirty = useCallback((current: T) => {
    const dirty = !isEqualRef.current(snapshotRef.current, current);
    setIsDirtyLocal(dirty);
    useEditorStore.getState().setDirty(tabId, dirty);
  }, [tabId]);

  const doLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadRef.current();
      snapshotRef.current = data;
      setStateRaw(data);
      setIsDirtyLocal(false);
      useEditorStore.getState().setDirty(tabId, false);
    } finally {
      setIsLoading(false);
    }
  }, [tabId]);

  // Load on mount and when deps change
  useEffect(() => {
    doLoad();
  }, [doLoad, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      // Defer dirty sync to avoid setState-during-render
      queueMicrotask(() => syncDirty(next));
      return next;
    });
  }, [syncDirty]);

  const handleSave = useCallback(async () => {
    const current = state;
    await saveRef.current(current);
    snapshotRef.current = current;
    setIsDirtyLocal(false);
    useEditorStore.getState().setDirty(tabId, false);
  }, [state, tabId]);

  const revert = useCallback(() => {
    setStateRaw(snapshotRef.current);
    setIsDirtyLocal(false);
    useEditorStore.getState().setDirty(tabId, false);
  }, [tabId]);

  // Register/unregister with session registry
  useEffect(() => {
    const handle = {
      save: () => {
        // Read latest state directly to avoid stale closure
        const s = useEditorStore.getState();
        const tab = s.tabs.find((t) => t.id === tabId);
        if (!tab?.isDirty) return Promise.resolve();
        return handleSave();
      },
      isDirty: () => useEditorStore.getState().tabs.find((t) => t.id === tabId)?.isDirty ?? false,
      revert,
    };
    registerSession(tabId, handle);
    return () => unregisterSession(tabId);
  }, [tabId, handleSave, revert]);

  return { state, setState, isDirty, save: handleSave, revert, isLoading, reload: doLoad };
}
