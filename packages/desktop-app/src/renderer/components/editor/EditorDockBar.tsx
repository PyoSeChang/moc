import React from 'react';
import { useEditorStore } from '../../stores/editor-store';

export function EditorDockBar(): JSX.Element | null {
  const { tabs, toggleMinimize } = useEditorStore();

  const minimizedTabs = tabs.filter((t) => t.isMinimized);

  if (minimizedTabs.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1 border-t border-subtle bg-surface-panel px-2 py-1">
      {minimizedTabs.map((tab) => (
        <button
          key={tab.id}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-default"
          onClick={() => toggleMinimize(tab.id)}
          title={`Restore ${tab.title}`}
        >
          <span className="max-w-[120px] truncate">{tab.title}</span>
          {tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}
