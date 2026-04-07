import React, { useCallback, useEffect } from 'react';
import { ExternalLink, FileText, Link, Plus, Trash2, Layers } from 'lucide-react';
import { useNetworkStore } from '../../stores/network-store';
import { useEditorStore } from '../../stores/editor-store';
import { useI18n } from '../../hooks/useI18n';
import { networkService } from '../../services';
import type { NodeType } from '@netior/shared/types';
import type { CanvasMode } from '../../stores/ui-store';

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  conceptId?: string;
  fileId?: string;
  filePath?: string;
  networkId?: string;
  mode: CanvasMode;
  onAddConnection?: (nodeId: string) => void;
  onOpenNetwork?: (networkId: string) => void;
  onCreateNetwork?: (conceptId: string) => void;
  onClose: () => void;
}

export function NodeContextMenu({
  x,
  y,
  nodeId,
  conceptId,
  fileId,
  filePath,
  networkId,
  mode,
  onAddConnection,
  onOpenNetwork,
  onCreateNetwork,
  onClose,
}: NodeContextMenuProps): JSX.Element {
  const { t } = useI18n();
  const { removeNode, currentNetwork } = useNetworkStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOpenNetwork = useCallback(() => {
    if (networkId) onOpenNetwork?.(networkId);
    onClose();
  }, [onOpenNetwork, networkId, onClose]);

  const handleCreateNetwork = useCallback(() => {
    if (conceptId) onCreateNetwork?.(conceptId);
    onClose();
  }, [onCreateNetwork, conceptId, onClose]);

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
      className="fixed z-50 bg-surface-modal border border-default rounded-md shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Portal: open network */}
      {networkId && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1 text-xs text-default hover:bg-surface-hover cursor-pointer"
          onClick={handleOpenNetwork}
        >
          <ExternalLink size={14} />
          {t('network.openSubNetwork')}
        </button>
      )}

      {/* Network creation */}
      {conceptId && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1 text-xs text-default hover:bg-surface-hover cursor-pointer"
          onClick={handleCreateNetwork}
        >
          <Plus size={14} />
          {t('network.createNetwork')}
        </button>
      )}

      {/* Edit metadata (file/dir nodes only) */}
      {fileId && currentNetwork && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-default hover:bg-surface-hover cursor-pointer"
          onClick={() => {
            useEditorStore.getState().openTab({
              type: 'fileMetadata',
              targetId: fileId,
              title: filePath?.replace(/\\/g, '/').split('/').pop() ?? 'Metadata',
              networkId: currentNetwork.id,
            });
            onClose();
          }}
        >
          <FileText size={14} />
          {t('fileMetadata.editMetadata')}
        </button>
      )}

      {/* Edge connection (edit mode only) */}
      {mode === 'edit' && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1 text-xs text-default hover:bg-surface-hover cursor-pointer"
          onClick={handleAddConnection}
        >
          <Link size={14} />
          {t('edge.addConnection')}
        </button>
      )}

      {/* Node type change */}
      <div className="my-1 border-t border-subtle" />
      <div className="px-3 py-1 text-[10px] text-muted uppercase tracking-wider flex items-center gap-1">
        <Layers size={10} />
        {t('network.changeNodeType')}
      </div>
      {([
        { type: 'basic' as NodeType, label: 'network.nodeTypeBasic' as const },
        { type: 'portal' as NodeType, label: 'network.nodeTypePortal' as const },
        { type: 'box' as NodeType, label: 'network.nodeTypeBox' as const },
      ]).map(({ type: nt, label }) => (
        <button
          key={nt}
          className="flex w-full items-center gap-2 px-3 py-1 text-xs text-default hover:bg-surface-hover cursor-pointer"
          onClick={async () => {
            await networkService.node.update(nodeId, { node_type: nt });
            const { currentNetwork, openNetwork: reload } = useNetworkStore.getState();
            if (currentNetwork) await reload(currentNetwork.id);
            onClose();
          }}
        >
          {t(label)}
        </button>
      ))}

      <div className="my-1 border-t border-subtle" />

      {/* Delete */}
      <button
        className="flex w-full items-center gap-2 px-3 py-1 text-xs text-default hover:bg-surface-hover cursor-pointer"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
        {t('common.delete')}
      </button>
    </div>
  );
}
