import React, { useCallback, useRef } from 'react';
import type { EditorTab } from '@moc/shared/types';
import { useEditorStore } from '../../../stores/editor-store';
import { EditorViewModeSwitch } from '../EditorViewModeSwitch';
import { ConceptEditor } from '../ConceptEditor';

interface SideModeEditorProps {
  tab: EditorTab;
  children: React.ReactNode;
}

export function SideModeEditor({ tab, children }: SideModeEditorProps): JSX.Element {
  const { updateSideSplitRatio, setViewMode, toggleMinimize } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;

      const handleMove = (ev: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const ratio = (ev.clientX - rect.left) / rect.width;
        updateSideSplitRatio(tab.id, ratio);
      };

      const handleUp = () => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [tab.id, updateSideSplitRatio],
  );

  const leftPercent = `${tab.sideSplitRatio * 100}%`;
  const rightPercent = `${(1 - tab.sideSplitRatio) * 100}%`;

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Left: canvas / children */}
      <div className="overflow-hidden" style={{ width: leftPercent }}>
        {children}
      </div>

      {/* Split handle */}
      <div
        className="shrink-0 cursor-col-resize bg-border-subtle hover:bg-accent"
        style={{ width: 4 }}
        onMouseDown={handleDragStart}
      />

      {/* Right: editor pane */}
      <div className="flex flex-col overflow-hidden bg-surface-panel" style={{ width: rightPercent }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-subtle px-3 py-1.5">
          <span className="truncate text-xs font-medium text-default">
            {tab.conceptTitle}
            {tab.isDirty && <span className="ml-1 text-accent">*</span>}
          </span>
          <EditorViewModeSwitch
            currentMode={tab.viewMode}
            onModeChange={(mode) => setViewMode(tab.id, mode)}
            onMinimize={() => toggleMinimize(tab.id)}
          />
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-hidden">
          <ConceptEditor tab={tab} />
        </div>
      </div>
    </div>
  );
}
