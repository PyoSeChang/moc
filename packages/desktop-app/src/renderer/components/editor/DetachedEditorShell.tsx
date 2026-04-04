import React, { useEffect } from 'react';
import type { EditorViewMode } from '@netior/shared/types';
import { EditorContent } from './EditorContent';
import { EditorTabStrip } from './EditorTabStrip';
import { EditorViewModeSwitch } from './EditorViewModeSwitch';
import { CloseConfirmDialog } from './CloseConfirmDialog';
import { WindowControls } from '../ui/WindowControls';
import { useEditorStore, MAIN_HOST_ID } from '../../stores/editor-store';
import { useDetachedShortcuts } from '../../shortcuts/useDetachedShortcuts';

interface DetachedEditorShellProps {
  hostId: string;
}

export function DetachedEditorShell({ hostId }: DetachedEditorShellProps): JSX.Element {
  const tabs = useEditorStore((s) => s.tabs.filter((t) => t.hostId === hostId));
  const host = useEditorStore((s) => s.hosts[hostId]);
  const activeTabId = host?.activeTabId ?? null;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? null;

  const { setHostActiveTab, requestCloseTab, moveTabToHost } = useEditorStore();

  // Set up detached-window shortcuts
  useDetachedShortcuts(hostId);

  // Notify main that focus is on this host when window receives focus
  useEffect(() => {
    const onFocus = () => useEditorStore.getState().setFocusedHost(hostId);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [hostId]);

  // If host is removed (all tabs closed), close the window
  useEffect(() => {
    if (!host && tabs.length === 0) {
      window.close();
    }
  }, [host, tabs.length]);

  const handleModeChange = (mode: EditorViewMode) => {
    if (mode === 'detached' || !activeTab) return;
    // Reattach: move tab to main host
    moveTabToHost(activeTab.id, MAIN_HOST_ID);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-panel">
      {/* Title bar */}
      <div
        className="flex shrink-0 items-center border-b border-subtle bg-surface-base"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          className="flex min-w-0 flex-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <EditorTabStrip
            tabs={tabs}
            activeTabId={activeTabId}
            onActivate={(tabId) => setHostActiveTab(hostId, tabId)}
            onClose={requestCloseTab}
            rightSlot={
              <EditorViewModeSwitch
                currentMode="detached"
                onModeChange={handleModeChange}
              />
            }
          />
        </div>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WindowControls />
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <EditorContent tab={activeTab} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No open tabs
          </div>
        )}
      </div>

      <CloseConfirmDialog />
    </div>
  );
}
