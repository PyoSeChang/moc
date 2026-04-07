import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { EditorTab } from '@netior/shared/types';
import { useContextStore } from '../../stores/context-store';
import { useNetworkStore } from '../../stores/network-store';
import { useEditorStore } from '../../stores/editor-store';
import { useEditorSession } from '../../hooks/useEditorSession';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { ContextMemberPicker } from './ContextMemberPicker';

interface ContextEditorProps {
  tab: EditorTab;
}

interface ContextState {
  name: string;
  description: string;
}

export function ContextEditor({ tab }: ContextEditorProps): JSX.Element {
  const { t } = useI18n();
  const contextId = tab.targetId;
  const contexts = useContextStore((s) => s.contexts);
  const members = useContextStore((s) => s.members);
  const context = contexts.find((c) => c.id === contextId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const nodes = useNetworkStore((s) => s.nodes);
  const edges = useNetworkStore((s) => s.edges);

  // Load members when contextId changes
  useEffect(() => {
    useContextStore.getState().loadMembers(contextId);
  }, [contextId]);

  // Filter members for this context
  const contextMembers = members.filter((m) => m.context_id === contextId);
  const objectMembers = contextMembers.filter((m) => m.member_type === 'object');
  const edgeMembers = contextMembers.filter((m) => m.member_type === 'edge');

  const getMemberLabel = useCallback((member: { member_type: 'object' | 'edge'; member_id: string }) => {
    if (member.member_type === 'object') {
      const node = nodes.find((n) => n.object?.id === member.member_id);
      if (!node) return member.member_id.slice(0, 8);
      if (node.concept) return node.concept.title;
      if (node.file) return node.file.path?.replace(/\\/g, '/').split('/').pop() || '?';
      return node.object?.object_type ?? '?';
    }
    // edge
    const edge = edges.find((e) => e.id === member.member_id);
    if (!edge) return member.member_id.slice(0, 8);
    const src = nodes.find((n) => n.id === edge.source_node_id);
    const tgt = nodes.find((n) => n.id === edge.target_node_id);
    const srcLabel = src?.concept?.title ?? src?.file?.path?.replace(/\\/g, '/').split('/').pop() ?? '?';
    const tgtLabel = tgt?.concept?.title ?? tgt?.file?.path?.replace(/\\/g, '/').split('/').pop() ?? '?';
    return `${srcLabel} → ${tgtLabel}`;
  }, [nodes, edges]);

  const session = useEditorSession<ContextState>({
    tabId: tab.id,
    load: () => {
      const c = useContextStore.getState().contexts.find((ctx) => ctx.id === contextId);
      if (!c) return { name: '', description: '' };
      return { name: c.name, description: c.description ?? '' };
    },
    save: async (state) => {
      await useContextStore.getState().updateContext(contextId, {
        name: state.name,
        description: state.description || null,
      });
      useEditorStore.getState().updateTitle(tab.id, state.name);
    },
    deps: [contextId],
  });

  const handleDelete = useCallback(async () => {
    await useContextStore.getState().deleteContext(contextId);
    useEditorStore.getState().closeTab(tab.id);
  }, [contextId, tab.id]);

  if (!context) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        Context not found
      </div>
    );
  }

  if (session.isLoading) return <></>;

  return (
    <div className="relative h-full">
    <ScrollArea className="h-full">
      <div className="flex items-start justify-center">
        <div className="flex flex-col gap-6 p-6 w-full max-w-[600px]">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t('context.name')}</label>
            <Input
              value={session.state.name}
              onChange={(e) => session.setState((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t('context.description')}</label>
            <TextArea
              value={session.state.description}
              onChange={(e) => session.setState((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Members */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted">{t('context.members')}</label>
              <button
                type="button"
                className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
                onClick={() => setPickerOpen(true)}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Object members */}
            {objectMembers.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted uppercase tracking-wider">{t('context.objects')}</span>
                {objectMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-surface-card">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="accent">{m.member_type}</Badge>
                      <span className="text-sm truncate">{getMemberLabel(m)}</span>
                    </div>
                    <button
                      type="button"
                      className="p-0.5 text-muted hover:text-status-error transition-colors flex-shrink-0"
                      onClick={() => useContextStore.getState().removeMember(m.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Edge members */}
            {edgeMembers.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted uppercase tracking-wider">{t('context.edges')}</span>
                {edgeMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-surface-card">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="default">edge</Badge>
                      <span className="text-sm truncate">{getMemberLabel(m)}</span>
                    </div>
                    <button
                      type="button"
                      className="p-0.5 text-muted hover:text-status-error transition-colors flex-shrink-0"
                      onClick={() => useContextStore.getState().removeMember(m.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {contextMembers.length === 0 && (
              <div className="text-xs text-muted text-center py-2">{t('context.noMembers')}</div>
            )}
          </div>

          {/* Delete */}
          <div className="pt-4 border-t border-subtle">
            <Button
              size="sm"
              variant="ghost"
              className="text-status-error hover:text-status-error"
              onClick={handleDelete}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

    </ScrollArea>

      {pickerOpen && (
        <ContextMemberPicker
          existingMembers={contextMembers}
          onSelect={async (memberType, memberId) => {
            await useContextStore.getState().addMember(contextId, memberType, memberId);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
