import React, { useCallback, useMemo } from 'react';
import type { EditorTab, EdgeUpdate } from '@moc/shared/types';
import { useCanvasStore } from '../../stores/canvas-store';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { canvasService } from '../../services';
import { useI18n } from '../../hooks/useI18n';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';

interface EdgeEditorProps {
  tab: EditorTab;
}

export function EdgeEditor({ tab }: EdgeEditorProps): JSX.Element {
  const { t } = useI18n();
  const edgeId = tab.targetId;
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);
  const { removeEdge, openCanvas, currentCanvas } = useCanvasStore();
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);

  const edge = edges.find((e) => e.id === edgeId);
  const sourceNode = edge ? nodes.find((n) => n.id === edge.source_node_id) : undefined;
  const targetNode = edge ? nodes.find((n) => n.id === edge.target_node_id) : undefined;

  const sourceLabel = sourceNode?.concept?.title ?? sourceNode?.file_path?.split('/').pop() ?? sourceNode?.dir_path?.split('/').pop() ?? '?';
  const targetLabel = targetNode?.concept?.title ?? targetNode?.file_path?.split('/').pop() ?? targetNode?.dir_path?.split('/').pop() ?? '?';

  const relationTypeOptions = useMemo(() => [
    { value: '', label: t('edge.noRelationType') },
    ...relationTypes.map((rt) => ({ value: rt.id, label: rt.name })),
  ], [relationTypes, t]);

  const handleUpdateRelationType = useCallback(async (relationTypeId: string) => {
    const data: EdgeUpdate = { relation_type_id: relationTypeId || null };
    await canvasService.edge.update(edgeId, data);
    // Reload canvas to refresh edge data with relation_type join
    if (currentCanvas) await openCanvas(currentCanvas.id);
  }, [edgeId, currentCanvas, openCanvas]);

  const handleDelete = useCallback(async () => {
    await removeEdge(edgeId);
    useEditorStore.getState().closeTab(tab.id);
  }, [edgeId, removeEdge, tab.id]);

  if (!edge) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        {t('edge.notFound') ?? 'Edge not found'}
      </div>
    );
  }

  return (
    <ScrollArea>
      <div className="flex h-full items-start justify-center">
        <div className="flex flex-col gap-6 p-6 w-full max-w-[600px]">
          {/* Source */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t('edge.source')}</label>
            <div className="px-3 py-2 text-sm bg-surface-base border border-subtle rounded-md text-default">
              {sourceLabel}
            </div>
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t('edge.target')}</label>
            <div className="px-3 py-2 text-sm bg-surface-base border border-subtle rounded-md text-default">
              {targetLabel}
            </div>
          </div>

          {/* Relation Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t('edge.relationType')}</label>
            <Select
              options={relationTypeOptions}
              value={edge.relation_type_id ?? ''}
              onChange={(e) => handleUpdateRelationType(e.target.value)}
              selectSize="sm"
            />
          </div>

          {/* Delete */}
          <div className="pt-4 border-t border-subtle">
            <Button
              size="sm"
              variant="ghost"
              className="text-status-error hover:text-status-error"
              onClick={handleDelete}
            >
              {t('edge.delete')}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
