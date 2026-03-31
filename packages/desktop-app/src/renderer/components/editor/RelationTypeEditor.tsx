import React, { useCallback } from 'react';
import type { EditorTab, RelationTypeUpdate } from '@moc/shared/types';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { ScrollArea } from '../ui/ScrollArea';

interface RelationTypeEditorProps {
  tab: EditorTab;
}

export function RelationTypeEditor({ tab }: RelationTypeEditorProps): JSX.Element {
  const { t } = useI18n();
  const relationTypeId = tab.targetId;
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);
  const { updateRelationType } = useRelationTypeStore();

  const relationType = relationTypes.find((rt) => rt.id === relationTypeId);

  const handleUpdate = useCallback(
    (data: RelationTypeUpdate) => {
      updateRelationType(relationTypeId, data);
      if (data.name) {
        useEditorStore.getState().updateTitle(tab.id, data.name);
      }
    },
    [relationTypeId, tab.id, updateRelationType],
  );

  const lineStyleOptions = [
    { value: 'solid', label: t('relationType.solid') },
    { value: 'dashed', label: t('relationType.dashed') },
    { value: 'dotted', label: t('relationType.dotted') },
  ];

  if (!relationType) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        {t('relationType.notFound')}
      </div>
    );
  }

  return (
    <ScrollArea>
      <div className="flex h-full items-start justify-center">
        <div className="flex flex-col gap-6 p-6 w-full max-w-[600px]">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('relationType.name')}</label>
            <Input
              value={relationType.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('relationType.description')}</label>
            <TextArea
              value={relationType.description ?? ''}
              onChange={(e) => handleUpdate({ description: e.target.value || null })}
              rows={4}
              placeholder={t('relationType.descriptionPlaceholder')}
            />
          </div>

          {/* Visual */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-secondary">{t('relationType.visual')}</label>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-secondary">{t('relationType.color')}</span>
              <ColorPicker
                value={relationType.color ?? undefined}
                onChange={(color) => handleUpdate({ color })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-secondary">{t('relationType.lineStyle')}</span>
              <Select
                options={lineStyleOptions}
                value={relationType.line_style}
                onChange={(e) => handleUpdate({ line_style: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                selectSize="sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Toggle
                checked={relationType.directed}
                onChange={(checked) => handleUpdate({ directed: checked })}
              />
              <span className="text-xs text-secondary">{t('relationType.directed')}</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
