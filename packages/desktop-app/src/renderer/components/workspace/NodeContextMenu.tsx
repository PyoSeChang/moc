import React, { useCallback, useEffect, useRef } from 'react';
import { Layers, Link, Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useI18n } from '../../hooks/useI18n';
import type { CanvasMode } from '../../stores/ui-store';

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  conceptId?: string;
  canvasCount: number;
  mode: CanvasMode;
  onAddConnection?: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeContextMenu({
  x,
  y,
  nodeId,
  conceptId,
  canvasCount,
  mode,
  onAddConnection,
  onClose,
}: NodeContextMenuProps): JSX.Element {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const { drillInto, removeNode } = useCanvasStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDrillInto = useCallback(async () => {
    if (conceptId) await drillInto(conceptId);
    onClose();
  }, [drillInto, conceptId, onClose]);

  const handleAddConnection = useCallback(() => {
    onAddConnection?.(nodeId);
    onClose();
  }, [onAddConnection, nodeId, onClose]);

  const handleDelete = useCallback(async () => {
    await removeNode(nodeId);
    onClose();
  }, [removeNode, nodeId, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface-card border border-subtle rounded shadow-lg py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {conceptId && canvasCount > 0 && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-default hover:bg-surface-hover cursor-pointer"
          onClick={handleDrillInto}
        >
          <Layers size={14} />
          {t('canvas.openSubCanvas')}
        </button>
      )}
      {mode === 'edit' && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-default hover:bg-surface-hover cursor-pointer"
          onClick={handleAddConnection}
        >
          <Link size={14} />
          {t('edge.addConnection')}
        </button>
      )}
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-default hover:bg-surface-hover cursor-pointer"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
        {t('common.delete')}
      </button>
    </div>
  );
}
