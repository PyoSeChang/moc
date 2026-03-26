import React from 'react';
import { X } from 'lucide-react';
import type { EditorTab } from '@moc/shared/types';

interface EditorTabStripProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  rightSlot?: React.ReactNode;
}

/**
 * Generic tab strip for editor panels.
 * Receives pre-filtered tabs from the parent shell container.
 */
export function EditorTabStrip({ tabs, activeTabId, onActivate, onClose, rightSlot }: EditorTabStripProps): JSX.Element {
  if (tabs.length === 0 && !rightSlot) return <></>;

  return (
    <div className="flex h-8 shrink-0 items-center border-b border-subtle bg-surface-panel">
      <div className="flex flex-1 items-center overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`group flex shrink-0 cursor-pointer items-center gap-1 border-r border-subtle px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'bg-surface-base text-default'
                  : 'text-muted hover:bg-surface-hover hover:text-default'
              }`}
              onClick={() => onActivate(tab.id)}
            >
              {tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              <span className="max-w-[120px] truncate">{tab.title}</span>
              <button
                className="ml-1 rounded p-0.5 text-muted opacity-0 hover:text-default group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
      {rightSlot && <div className="shrink-0 px-2">{rightSlot}</div>}
    </div>
  );
}
