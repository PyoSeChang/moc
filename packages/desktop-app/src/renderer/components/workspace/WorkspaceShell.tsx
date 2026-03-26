import React, { useCallback, useRef } from 'react';
import type { Project } from '@moc/shared/types';
import { Sidebar } from '../sidebar/Sidebar';
import { ConceptWorkspace } from './ConceptWorkspace';
import { CanvasBreadcrumb } from './CanvasBreadcrumb';
import { FloatWindowLayer } from '../editor/modes/FloatWindowLayer';
import { FullModeEditor } from '../editor/modes/FullModeEditor';
import { EditorDockBar } from '../editor/EditorDockBar';
import { EditorViewModeSwitch } from '../editor/EditorViewModeSwitch';
import { EditorContent } from '../editor/EditorContent';
import { EditorTabStrip } from '../editor/EditorTabStrip';
import { useEditorStore } from '../../stores/editor-store';

interface WorkspaceShellProps {
  project: Project;
}

export function WorkspaceShell({ project }: WorkspaceShellProps): JSX.Element {
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const { setActiveTab, closeTab, setViewMode, toggleMinimize, updateSideSplitRatio } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Layout decision (Culturium pattern):
  // 1. Active tab is full mode → full editor takes over
  // 2. Any non-minimized side tab exists → show side split (independent of activeTab)
  // 3. Otherwise → canvas only (float windows render in separate layer)
  const isFullMode = activeTab && !activeTab.isMinimized && activeTab.viewMode === 'full';
  const sideTabs = tabs.filter((t) => t.viewMode === 'side' && !t.isMinimized);
  const hasSideEditor = !isFullMode && sideTabs.length > 0;

  // Active side tab: prefer global activeTab if it's a side tab, otherwise fallback to first side tab
  const activeSideTab = hasSideEditor
    ? (sideTabs.find((t) => t.id === activeTabId) ?? sideTabs[0])
    : null;

  // Side split drag
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleSplitDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!activeSideTab) return;
      e.preventDefault();
      draggingRef.current = true;

      const handleMove = (ev: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const ratio = (ev.clientX - rect.left) / rect.width;
        updateSideSplitRatio(activeSideTab.id, ratio);
      };

      const handleUp = () => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [activeSideTab, updateSideSplitRatio],
  );

  const splitRatio = activeSideTab?.sideSplitRatio ?? 0.5;

  return (
    <div className="relative flex h-full">
      <Sidebar project={project} />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {isFullMode ? (
          <FullModeEditor tab={activeTab} />
        ) : (
          <>
            {/* Canvas — always in same tree position, width adjusts */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: hasSideEditor ? `${splitRatio * 100}%` : '100%' }}
            >
              <CanvasBreadcrumb />
              <ConceptWorkspace projectId={project.id} />
            </div>

            {/* Side editor pane — shown when ANY side tab exists */}
            {hasSideEditor && activeSideTab && (
              <>
                <div
                  className="shrink-0 cursor-col-resize bg-border-subtle hover:bg-accent"
                  style={{ width: 4 }}
                  onMouseDown={handleSplitDragStart}
                />
                <div
                  className="flex flex-col overflow-hidden bg-surface-panel"
                  style={{ width: `${(1 - splitRatio) * 100}%` }}
                >
                  <EditorTabStrip
                    tabs={sideTabs}
                    activeTabId={activeSideTab.id}
                    onActivate={setActiveTab}
                    onClose={closeTab}
                    rightSlot={
                      <EditorViewModeSwitch
                        currentMode={activeSideTab.viewMode}
                        onModeChange={(mode) => setViewMode(activeSideTab.id, mode)}
                        onMinimize={() => toggleMinimize(activeSideTab.id)}
                      />
                    }
                  />
                  <div className="flex-1 overflow-hidden">
                    <EditorContent tab={activeSideTab} />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <FloatWindowLayer />
      <EditorDockBar />
    </div>
  );
}
