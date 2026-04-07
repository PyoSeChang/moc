import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useNetworkStore, type NetworkNodeWithObject, type EdgeWithRelationType } from '../../stores/network-store';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import type { ContextMember } from '@netior/shared/types';

interface ContextMemberPickerProps {
  existingMembers: ContextMember[];
  onSelect: (memberType: 'object' | 'edge', memberId: string) => void;
  onClose: () => void;
}

function getNodeLabel(node: NetworkNodeWithObject): string {
  if (node.concept) return node.concept.title;
  if (node.file) {
    const path = node.file.path ?? '';
    return path.replace(/\\/g, '/').split('/').pop() || '?';
  }
  return node.object?.object_type ?? 'Unknown';
}

function getEdgeLabel(edge: EdgeWithRelationType, nodes: NetworkNodeWithObject[]): string {
  const src = nodes.find((n) => n.id === edge.source_node_id);
  const tgt = nodes.find((n) => n.id === edge.target_node_id);
  const srcLabel = src ? getNodeLabel(src) : '?';
  const tgtLabel = tgt ? getNodeLabel(tgt) : '?';
  const relName = edge.relation_type?.name;
  return relName ? `${srcLabel} —[${relName}]→ ${tgtLabel}` : `${srcLabel} → ${tgtLabel}`;
}

export function ContextMemberPicker({ existingMembers, onSelect, onClose }: ContextMemberPickerProps): JSX.Element {
  const { t } = useI18n();
  const nodes = useNetworkStore((s) => s.nodes);
  const edges = useNetworkStore((s) => s.edges);
  const [search, setSearch] = useState('');

  const existingObjectIds = useMemo(() => new Set(
    existingMembers.filter((m) => m.member_type === 'object').map((m) => m.member_id),
  ), [existingMembers]);

  const existingEdgeIds = useMemo(() => new Set(
    existingMembers.filter((m) => m.member_type === 'edge').map((m) => m.member_id),
  ), [existingMembers]);

  const lowerSearch = search.toLowerCase();

  const filteredNodes = useMemo(() =>
    nodes.filter((n) => {
      if (!n.object) return false;
      if (existingObjectIds.has(n.object.id)) return false;
      if (lowerSearch && !getNodeLabel(n).toLowerCase().includes(lowerSearch)) return false;
      return true;
    }),
  [nodes, existingObjectIds, lowerSearch]);

  const filteredEdges = useMemo(() =>
    edges.filter((e) => {
      if (existingEdgeIds.has(e.id)) return false;
      if (lowerSearch && !getEdgeLabel(e, nodes).toLowerCase().includes(lowerSearch)) return false;
      return true;
    }),
  [edges, nodes, existingEdgeIds, lowerSearch]);

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-8" onMouseDown={(e) => e.stopPropagation()}>
      <div className="bg-surface-modal border border-default rounded-lg shadow-xl w-full max-w-[400px] max-h-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-subtle">
          <span className="text-sm font-medium">{t('context.addMember')}</span>
          <button type="button" className="p-1 text-muted hover:text-default" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <Input
            inputSize="sm"
            placeholder={t('context.searchMembers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-1 pb-2">
          {/* Objects */}
          {filteredNodes.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted uppercase tracking-wider">
                {t('context.objects')}
              </div>
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-default hover:bg-surface-hover rounded transition-colors text-left"
                  onClick={() => {
                    if (node.object) onSelect('object', node.object.id);
                  }}
                >
                  <Badge variant="accent">{node.object?.object_type ?? '?'}</Badge>
                  <span className="truncate">{getNodeLabel(node)}</span>
                </button>
              ))}
            </>
          )}

          {/* Edges */}
          {filteredEdges.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted uppercase tracking-wider mt-1">
                {t('context.edges')}
              </div>
              {filteredEdges.map((edge) => (
                <button
                  key={edge.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-default hover:bg-surface-hover rounded transition-colors text-left"
                  onClick={() => onSelect('edge', edge.id)}
                >
                  <Badge variant="default">edge</Badge>
                  <span className="truncate">{getEdgeLabel(edge, nodes)}</span>
                </button>
              ))}
            </>
          )}

          {filteredNodes.length === 0 && filteredEdges.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted text-center">
              {t('context.noMembers')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
