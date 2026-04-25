import type { EditorTab, EditorViewMode } from '@netior/shared/types';

const DEFAULT_ALLOWED_VIEW_MODES: EditorViewMode[] = ['side', 'full', 'float', 'detached'];
const NETWORK_VIEWER_ALLOWED_VIEW_MODES: EditorViewMode[] = ['full', 'detached'];

export function getAllowedViewModes(tab: Pick<EditorTab, 'type'> | null | undefined): EditorViewMode[] {
  if (tab?.type === 'networkViewer') {
    return NETWORK_VIEWER_ALLOWED_VIEW_MODES;
  }

  return DEFAULT_ALLOWED_VIEW_MODES;
}

export function coerceViewModeForTab(tab: Pick<EditorTab, 'type'> | null | undefined, mode: EditorViewMode): EditorViewMode {
  const allowedModes = getAllowedViewModes(tab);

  if (allowedModes.includes(mode)) {
    return mode;
  }

  if (allowedModes.includes('full')) {
    return 'full';
  }

  return allowedModes[0] ?? 'side';
}
