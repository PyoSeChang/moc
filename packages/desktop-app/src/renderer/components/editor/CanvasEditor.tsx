import React, { useCallback, useMemo } from 'react';
import type { EditorTab, CanvasUpdate } from '@moc/shared/types';
import { useCanvasStore } from '../../stores/canvas-store';
import { useCanvasTypeStore } from '../../stores/canvas-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';

interface CanvasEditorProps {
  tab: EditorTab;
}

export function CanvasEditor({ tab }: CanvasEditorProps): JSX.Element {
  const { t } = useI18n();
  const canvasId = tab.targetId;
  const { canvases, updateCanvas, deleteCanvas } = useCanvasStore();
  const canvasTypes = useCanvasTypeStore((s) => s.canvasTypes);

  const canvas = canvases.find((c) => c.id === canvasId);

  const canvasTypeOptions = useMemo(() => [
    { value: '', label: t('canvasType.noType') ?? 'None' },
    ...canvasTypes.map((ct) => ({ value: ct.id, label: ct.name })),
  ], [canvasTypes, t]);

  const handleUpdate = useCallback(async (data: CanvasUpdate) => {
    await updateCanvas(canvasId, data);
    if (data.name) {
      useEditorStore.getState().updateTitle(tab.id, data.name);
    }
  }, [canvasId, tab.id, updateCanvas]);

  const handleDelete = useCallback(async () => {
    await deleteCanvas(canvasId);
    useEditorStore.getState().closeTab(tab.id);
  }, [canvasId, deleteCanvas, tab.id]);

  if (!canvas) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        {t('canvas.notFound') ?? 'Canvas not found'}
      </div>
    );
  }

  return (
    <ScrollArea>
      <div className="flex h-full items-start justify-center">
        <div className="flex flex-col gap-6 p-6 w-full max-w-[600px]">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('canvas.name') ?? 'Name'}</label>
            <Input
              value={canvas.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
            />
          </div>

          {/* Canvas Type */}
          {canvasTypes.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-secondary">{t('canvasType.title')}</label>
              <Select
                options={canvasTypeOptions}
                value={canvas.canvas_type_id ?? ''}
                onChange={(e) => handleUpdate({ canvas_type_id: e.target.value || null })}
                selectSize="sm"
              />
            </div>
          )}

          {/* Info */}
          {canvas.concept_id && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-secondary">{t('canvas.parentConcept') ?? 'Parent Concept'}</label>
              <div className="px-3 py-2 text-sm bg-surface-base border border-subtle rounded-md text-secondary">
                {canvas.concept_id}
              </div>
            </div>
          )}

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
  );
}
