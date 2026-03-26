import React from 'react';
import type { EditorTab } from '@moc/shared/types';
import { useEditorStore } from '../../../stores/editor-store';
import { EditorViewModeSwitch } from '../EditorViewModeSwitch';
import { EditorContent } from '../EditorContent';
import { EditorTabStrip } from '../EditorTabStrip';

interface FullModeEditorProps {
  tab: EditorTab;
}

export function FullModeEditor({ tab }: FullModeEditorProps): JSX.Element {
  const { tabs, setActiveTab, closeTab, setViewMode, toggleMinimize } = useEditorStore();

  // Show all full-mode tabs in the tab strip
  const fullTabs = tabs.filter((t) => t.viewMode === 'full' && !t.isMinimized);

  return (
    <div className="flex h-full w-full flex-col bg-surface-panel">
      <EditorTabStrip
        tabs={fullTabs}
        activeTabId={tab.id}
        onActivate={setActiveTab}
        onClose={closeTab}
        rightSlot={
          <EditorViewModeSwitch
            currentMode={tab.viewMode}
            onModeChange={(mode) => setViewMode(tab.id, mode)}
            onMinimize={() => toggleMinimize(tab.id)}
          />
        }
      />

      <div className="flex-1 overflow-hidden">
        <EditorContent tab={tab} />
      </div>
    </div>
  );
}
