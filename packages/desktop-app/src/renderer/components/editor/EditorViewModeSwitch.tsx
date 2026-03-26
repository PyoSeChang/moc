import React from 'react';
import { Maximize2, Maximize, PanelRight, ExternalLink, Minus } from 'lucide-react';
import type { EditorViewMode } from '@moc/shared/types';

interface EditorViewModeSwitchProps {
  currentMode: EditorViewMode;
  onModeChange: (mode: EditorViewMode) => void;
  onMinimize: () => void;
}

const MODE_BUTTONS: { mode: EditorViewMode; icon: typeof Maximize2; title: string }[] = [
  { mode: 'float', icon: Maximize2, title: 'Float' },
  { mode: 'full', icon: Maximize, title: 'Full' },
  { mode: 'side', icon: PanelRight, title: 'Side' },
  { mode: 'detached', icon: ExternalLink, title: 'Detached' },
];

export function EditorViewModeSwitch({
  currentMode,
  onModeChange,
  onMinimize,
}: EditorViewModeSwitchProps): JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {MODE_BUTTONS.map(({ mode, icon: Icon, title }) => (
        <button
          key={mode}
          title={title}
          className={`rounded p-1 transition-colors ${
            currentMode === mode
              ? 'bg-accent text-on-accent'
              : 'text-muted hover:bg-surface-hover hover:text-default'
          }`}
          onClick={() => onModeChange(mode)}
        >
          <Icon size={14} />
        </button>
      ))}
      <button
        title="Minimize"
        className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-default"
        onClick={onMinimize}
      >
        <Minus size={14} />
      </button>
    </div>
  );
}
