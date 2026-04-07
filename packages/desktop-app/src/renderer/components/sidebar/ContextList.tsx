import React, { useEffect, useState } from 'react';
import { Plus, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';
import { useContextStore } from '../../stores/context-store';
import { useNetworkStore } from '../../stores/network-store';
import { useEditorStore } from '../../stores/editor-store';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { useI18n } from '../../hooks/useI18n';

interface CtxState { x: number; y: number; id: string; name: string }

export function ContextList(): JSX.Element {
  const { t } = useI18n();
  const currentNetwork = useNetworkStore((s) => s.currentNetwork);
  const { contexts, loadContexts, createContext, deleteContext, activeContextId, setActiveContext } = useContextStore();
  const [ctx, setCtx] = useState<CtxState | null>(null);

  useEffect(() => {
    if (currentNetwork) {
      loadContexts(currentNetwork.id);
    }
  }, [currentNetwork?.id, loadContexts]);

  const handleCreate = async () => {
    if (!currentNetwork) return;
    const context = await createContext({
      network_id: currentNetwork.id,
      name: t('context.newDefault'),
    });
    useEditorStore.getState().openTab({
      type: 'context',
      targetId: context.id,
      title: context.name,
    });
  };

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'context',
      targetId: id,
      title: name,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, id, name });
  };

  const buildMenuItems = (): ContextMenuEntry[] => {
    if (!ctx) return [];
    return [
      { label: t('editor.openInEditor'), icon: <ExternalLink size={14} />, onClick: () => handleClick(ctx.id, ctx.name) },
      { type: 'divider' as const },
      { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => {
        useEditorStore.getState().closeTab(`context:${ctx.id}`);
        deleteContext(ctx.id);
      }},
    ];
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {t('context.title')}
        </span>
        <button
          type="button"
          onClick={handleCreate}
          className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col">
        {contexts.map((c) => {
          const isActive = activeContextId === c.id;
          return (
            <div
              key={c.id}
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-surface-hover transition-colors group"
              onContextMenu={(e) => handleContextMenu(e, c.id, c.name)}
            >
              <button
                type="button"
                className="flex-1 text-sm text-default text-left truncate"
                onClick={() => handleClick(c.id, c.name)}
              >
                {c.name}
              </button>
              <button
                type="button"
                className={`p-0.5 transition-colors rounded ${isActive ? 'text-accent' : 'text-muted opacity-0 group-hover:opacity-100 hover:text-default'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveContext(isActive ? null : c.id);
                }}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          );
        })}
        {contexts.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('context.noContexts')}
          </div>
        )}
      </div>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={buildMenuItems()} onClose={() => setCtx(null)} />}
    </div>
  );
}
