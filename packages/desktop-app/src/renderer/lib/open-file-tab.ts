import type { EditorTab, EditorTabType, SplitDirection, SplitLeaf, SplitNode } from '@netior/shared/types';
import { useEditorStore, collectLeaves, containsTab, getActiveTabFromLayout } from '../stores/editor-store';

export type FileOpenPlacement = 'smart' | 'current' | 'right' | 'below' | 'float';

export interface FileOpenPaneOption {
  id: string;
  mode: 'side' | 'full';
  activeTabId: string;
  label: string;
}

interface OpenFileTabParams {
  filePath: string;
  title?: string;
  sourceTabId?: string;
  placement?: FileOpenPlacement;
}

const WORK_SOURCE_TYPES = new Set<EditorTabType>(['terminal', 'narre']);
const DOCUMENT_TARGET_TYPES = new Set<EditorTabType>(['file']);

function tabIdForFile(filePath: string): string {
  return `file:${filePath}`;
}

function fileTitle(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop() ?? filePath;
}

function getLeaves(layout: SplitNode | null): SplitLeaf[] {
  return layout ? collectLeaves(layout) : [];
}

function findLeafWithTabId(layout: SplitNode | null, tabId: string): SplitLeaf | null {
  return getLeaves(layout).find((leaf) => leaf.tabIds.includes(tabId)) ?? null;
}

function getLeafMode(tabId: string): 'side' | 'full' | null {
  const state = useEditorStore.getState();
  if (state.sideLayout && containsTab(state.sideLayout, tabId)) return 'side';
  if (state.fullLayout && containsTab(state.fullLayout, tabId)) return 'full';
  return null;
}

function findDocumentLeaf(mode: 'side' | 'full', sourceTabId?: string): SplitLeaf | null {
  const state = useEditorStore.getState();
  const tabsById = new Map(state.tabs.map((tab) => [tab.id, tab]));
  const leaves = getLeaves(mode === 'side' ? state.sideLayout : state.fullLayout);

  return leaves.find((leaf) => {
    if (sourceTabId && leaf.tabIds.includes(sourceTabId)) return false;
    return leaf.tabIds.some((tabId) => {
      const tab = tabsById.get(tabId);
      return tab ? DOCUMENT_TARGET_TYPES.has(tab.type) : false;
    });
  }) ?? null;
}

function getSourceTab(sourceTabId?: string): EditorTab | null {
  const state = useEditorStore.getState();
  if (sourceTabId) return state.tabs.find((tab) => tab.id === sourceTabId) ?? null;
  return state.activeTabId ? (state.tabs.find((tab) => tab.id === state.activeTabId) ?? null) : null;
}

async function openFileTabRaw(filePath: string, title: string, viewMode?: 'side' | 'full' | 'float'): Promise<void> {
  const state = useEditorStore.getState();
  const sideActiveTabId = state.sideLayout ? getActiveTabFromLayout(state.sideLayout, state.activeTabId) : null;
  const sideActiveTab = sideActiveTabId ? state.tabs.find((tab) => tab.id === sideActiveTabId) : null;

  await useEditorStore.getState().openTab({
    type: 'file',
    targetId: filePath,
    title,
    viewMode,
    sideSplitRatio: viewMode === 'side' ? sideActiveTab?.sideSplitRatio : undefined,
  });
}

export async function openFileTab({
  filePath,
  title = fileTitle(filePath),
  sourceTabId,
  placement = 'smart',
}: OpenFileTabParams): Promise<void> {
  const sourceTab = getSourceTab(sourceTabId);
  const sourceMode = sourceTab ? getLeafMode(sourceTab.id) : null;
  const targetTabId = tabIdForFile(filePath);

  if (placement === 'float') {
    await openFileTabRaw(filePath, title, 'float');
    return;
  }

  const splitDirection = placement === 'below' ? 'vertical' : 'horizontal';
  if ((placement === 'right' || placement === 'below') && sourceTab && sourceMode) {
    await openFileTabRaw(filePath, title, sourceMode);
    useEditorStore.getState().splitTab(sourceTab.id, targetTabId, splitDirection, 'after');
    return;
  }

  if (placement === 'current') {
    await openFileTabRaw(filePath, title);
    return;
  }

  if (sourceTab && sourceMode && WORK_SOURCE_TYPES.has(sourceTab.type)) {
    const documentLeaf = findDocumentLeaf(sourceMode, sourceTab.id);
    if (documentLeaf) {
      await openFileTabRaw(filePath, title, sourceMode);
      useEditorStore.getState().moveTabToPane(targetTabId, documentLeaf.activeTabId, sourceMode);
      return;
    }

    await openFileTabRaw(filePath, title, sourceMode);
    const currentState = useEditorStore.getState();
    const stillHasSource = findLeafWithTabId(sourceMode === 'side' ? currentState.sideLayout : currentState.fullLayout, sourceTab.id);
    if (stillHasSource) {
      useEditorStore.getState().splitTab(sourceTab.id, targetTabId, 'horizontal', 'after');
    }
    return;
  }

  await openFileTabRaw(filePath, title);
}

export async function openFileInPane(
  filePath: string,
  targetPaneTabId: string,
  mode: 'side' | 'full',
  title = fileTitle(filePath),
): Promise<void> {
  await openFileTabRaw(filePath, title, mode);
  useEditorStore.getState().moveTabToPane(tabIdForFile(filePath), targetPaneTabId, mode);
}

export async function openFileBesideTab(
  filePath: string,
  targetTabId: string,
  mode: 'side' | 'full',
  direction: SplitDirection,
  position: 'before' | 'after',
  title = fileTitle(filePath),
): Promise<string> {
  const openedTabId = tabIdForFile(filePath);
  await openFileTabRaw(filePath, title, mode);
  useEditorStore.getState().splitTab(targetTabId, openedTabId, direction, position);
  return openedTabId;
}

export function getFileOpenPaneOptions(sourceTabId?: string): FileOpenPaneOption[] {
  const state = useEditorStore.getState();
  const tabsById = new Map(state.tabs.map((tab) => [tab.id, tab]));
  const options: FileOpenPaneOption[] = [];

  const addLeaves = (mode: 'side' | 'full', layout: SplitNode | null): void => {
    const leaves = getLeaves(layout);
    leaves.forEach((leaf, index) => {
      const activeTab = tabsById.get(leaf.activeTabId);
      if (!activeTab || activeTab.id === sourceTabId) return;
      options.push({
        id: `${mode}:${index}:${leaf.activeTabId}`,
        mode,
        activeTabId: leaf.activeTabId,
        label: `${mode === 'full' ? 'Full' : 'Side'} ${index + 1}: ${activeTab.title}`,
      });
    });
  };

  addLeaves('full', state.fullLayout);
  addLeaves('side', state.sideLayout);
  return options;
}
