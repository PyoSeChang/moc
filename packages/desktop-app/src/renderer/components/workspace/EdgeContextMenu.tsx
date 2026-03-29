import React, { useCallback, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorStore } from '../../stores/editor-store';
import { useI18n } from '../../hooks/useI18n';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
}

export function EdgeContextMenu({ x, y, edgeId, onClose }: EdgeContextMenuProps): JSX.Element {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeEdge } = useCanvasStore();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    // Close any open EdgeEditor tab for this edge
    const tabId = `edge:${edgeId}`;
    const tab = useEditorStore.getState().tabs.find((t) => t.id === tabId);
    if (tab) useEditorStore.getState().closeTab(tabId);

    await removeEdge(edgeId);
    onClose();
  }, [edgeId, removeEdge, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface-card border border-subtle rounded shadow-lg py-1 min-w-[140px]"
      style={{ left: x, top: y }}
    >
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-status-error hover:bg-surface-hover cursor-pointer"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
        {t('edge.delete')}
      </button>
    </div>
  );
}
