import React, { useCallback, useMemo } from 'react';
import type { EditorTab, LineStyle, TypeGroup } from '@netior/shared/types';
import type { TranslationKey } from '@netior/shared/i18n';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { useEditorSession } from '../../hooks/useEditorSession';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { ScrollArea } from '../ui/ScrollArea';
import {
  NetworkObjectEditorShell,
  NetworkObjectEditorSection,
  NetworkObjectMetadataList,
} from './NetworkObjectEditorShell';

interface RelationTypeEditorProps {
  tab: EditorTab;
}

interface RelationTypeState {
  group_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  line_style: LineStyle;
  directed: boolean;
}

export function RelationTypeEditor({ tab }: RelationTypeEditorProps): JSX.Element {
  const { t } = useI18n();
  const relationTypeId = tab.targetId;
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);
  const groups = useTypeGroupStore((s) => s.groupsByKind.relation_type);
  const { updateRelationType } = useRelationTypeStore();

  const session = useEditorSession<RelationTypeState>({
    tabId: tab.id,
    load: () => {
      const rt = useRelationTypeStore.getState().relationTypes.find((r) => r.id === relationTypeId);
      if (!rt) return { group_id: null, name: '', description: null, color: null, line_style: 'solid', directed: false };
      return {
        group_id: rt.group_id,
        name: rt.name,
        description: rt.description,
        color: rt.color,
        line_style: rt.line_style,
        directed: rt.directed,
      };
    },
    save: async (state) => {
      await updateRelationType(relationTypeId, state);
      useEditorStore.getState().updateTitle(tab.id, state.name);
    },
    deps: [relationTypeId],
  });

  const lineStyleOptions = [
    { value: 'solid', label: t('relationType.solid') },
    { value: 'dashed', label: t('relationType.dashed') },
    { value: 'dotted', label: t('relationType.dotted') },
  ];

  const buildGroupOptions = useCallback((items: TypeGroup[], parentGroupId: string | null = null, depth = 0): Array<{ value: string; label: string }> => {
    return items
      .filter((item) => (item.parent_group_id ?? null) === parentGroupId)
      .flatMap((item) => ([
        { value: item.id, label: `${'  '.repeat(depth)}${item.name}` },
        ...buildGroupOptions(items, item.id, depth + 1),
      ]));
  }, []);

  const groupOptions = useMemo(() => [
    { value: '', label: t('typeGroup.ungrouped') },
    ...buildGroupOptions(groups),
  ], [groups, buildGroupOptions, t]);

  const relationType = relationTypes.find((rt) => rt.id === relationTypeId);
  if (!relationType) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        {t('relationType.notFound')}
      </div>
    );
  }

  if (session.isLoading) return <></>;

  const update = (patch: Partial<RelationTypeState>) => {
    session.setState((prev) => ({ ...prev, ...patch }));
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <NetworkObjectEditorShell
        badge={t('relationType.title')}
        title={session.state.name || relationType.name}
        subtitle={t('editorShell.networkObject' as never)}
        description={t('relationType.descriptionPlaceholder')}
      >
        <NetworkObjectEditorSection title={t('editorShell.overview' as never)}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('typeGroup.group' as TranslationKey)}</label>
            <Select
              options={groupOptions}
              value={session.state.group_id ?? ''}
              onChange={(e) => update({ group_id: e.target.value || null })}
              selectSize="sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('relationType.name')}</label>
            <Input
              value={session.state.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('relationType.description')}</label>
            <TextArea
              value={session.state.description ?? ''}
              onChange={(e) => update({ description: e.target.value || null })}
              rows={4}
              placeholder={t('relationType.descriptionPlaceholder')}
            />
          </div>
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection title={t('relationType.visual')}>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-secondary">{t('relationType.color')}</span>
            <ColorPicker
              value={session.state.color ?? undefined}
              onChange={(color) => update({ color })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-secondary">{t('relationType.lineStyle')}</span>
            <Select
              options={lineStyleOptions}
              value={session.state.line_style}
              onChange={(e) => update({ line_style: e.target.value as 'solid' | 'dashed' | 'dotted' })}
              selectSize="sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Toggle
              checked={session.state.directed}
              onChange={(checked) => update({ directed: checked })}
            />
            <span className="text-xs text-secondary">{t('relationType.directed')}</span>
          </div>
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection title={t('editorShell.metadata' as never)} defaultOpen={false}>
          <NetworkObjectMetadataList
            items={[
              { label: t('editorShell.objectId' as never), value: <code className="font-mono text-xs">{relationType.id}</code> },
            ]}
          />
        </NetworkObjectEditorSection>
      </NetworkObjectEditorShell>
    </ScrollArea>
  );
}
