import React from 'react';
import type { EditorTab } from '@moc/shared/types';
import { ConceptEditor } from './ConceptEditor';
import { FileEditor } from './FileEditor';

interface EditorContentProps {
  tab: EditorTab;
}

/**
 * Content router: resolves tab.type to the appropriate editor component.
 * This is the single entry point for all editor content rendering.
 * Shell components (FloatWindow, side pane, full mode) render this.
 */
export function EditorContent({ tab }: EditorContentProps): JSX.Element {
  switch (tab.type) {
    case 'concept':
      return <ConceptEditor tab={tab} />;
    case 'file':
      return <FileEditor tab={tab} />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-xs text-muted">
          Unknown editor type
        </div>
      );
  }
}
