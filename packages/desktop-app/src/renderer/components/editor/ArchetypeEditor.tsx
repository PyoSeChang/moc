import React, { useEffect, useCallback, useMemo } from 'react';
import type { EditorTab, TypeGroup } from '@netior/shared/types';
import type { TranslationKey } from '@netior/shared/i18n';
import { Plus } from 'lucide-react';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useEditorStore } from '../../stores/editor-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { useEditorSession } from '../../hooks/useEditorSession';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { IconSelector } from '../ui/IconSelector';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { ArchetypeFieldRow } from './ArchetypeFieldRow';
import { useSettingsStore } from '../../stores/settings-store';
import { useUIStore } from '../../stores/ui-store';
import {
  NetworkObjectEditorShell,
  NetworkObjectEditorSection,
  NetworkObjectMetadataList,
} from './NetworkObjectEditorShell';

interface ArchetypeEditorProps {
  tab: EditorTab;
}

interface ArchetypeState {
  group_id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  node_shape: string | null;
  file_template: string | null;
}

export function ArchetypeEditor({ tab }: ArchetypeEditorProps): JSX.Element {
  const { t } = useI18n();
  const archetypeId = tab.targetId;
  const archetypes = useArchetypeStore((s) => s.archetypes);
  const fields = useArchetypeStore((s) => s.fields[archetypeId] ?? []);
  const groups = useTypeGroupStore((s) => s.groupsByKind.archetype);
  const { loadFields, createField, updateField, deleteField } = useArchetypeStore();
  const updateArchetype = useArchetypeStore((s) => s.updateArchetype);
  const fieldComplexityLevel = useSettingsStore((s) => s.fieldComplexityLevel);
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  const archetype = archetypes.find((a) => a.id === archetypeId);

  useEffect(() => {
    loadFields(archetypeId);
  }, [archetypeId, loadFields]);

  const session = useEditorSession<ArchetypeState>({
    tabId: tab.id,
    load: () => {
      const a = useArchetypeStore.getState().archetypes.find((ar) => ar.id === archetypeId);
      if (!a) return { group_id: null, name: '', description: null, icon: null, color: null, node_shape: null, file_template: null };
      return {
        group_id: a.group_id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        color: a.color,
        node_shape: a.node_shape,
        file_template: a.file_template,
      };
    },
    save: async (state) => {
      await updateArchetype(archetypeId, state);
      useEditorStore.getState().updateTitle(tab.id, state.name);
    },
    deps: [archetypeId],
  });

  const handleAddField = async () => {
    await createField({
      archetype_id: archetypeId,
      name: '',
      field_type: 'text',
      sort_order: fields.length,
    });
  };

  const handleUpdateField = useCallback(
    (id: string, data: Parameters<typeof updateField>[2]) => {
      updateField(id, archetypeId, data);
    },
    [archetypeId, updateField],
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      deleteField(id, archetypeId);
    },
    [archetypeId, deleteField],
  );

  const nodeShapeOptions = [
    { value: 'rectangle', label: t('archetype.rectangle') },
    { value: 'rounded', label: t('archetype.rounded') },
    { value: 'circle', label: t('archetype.circle') },
    { value: 'diamond', label: t('archetype.diamond') },
    { value: 'hexagon', label: t('archetype.hexagon') },
    { value: 'parallelogram', label: t('archetype.parallelogram') },
    { value: 'cylinder', label: t('archetype.cylinder') },
    { value: 'stadium', label: t('archetype.stadium') },
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

  if (!archetype) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        {t('archetype.notFound')}
      </div>
    );
  }

  if (session.isLoading) return <></>;

  const update = (patch: Partial<ArchetypeState>) => {
    session.setState((prev) => ({ ...prev, ...patch }));
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <NetworkObjectEditorShell
        badge={t('archetype.title')}
        title={session.state.name || archetype.name}
        subtitle={t('editorShell.networkObject' as never)}
        description={t('archetype.descriptionPlaceholder')}
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
            <label className="text-xs font-medium text-secondary">{t('archetype.name')}</label>
            <Input
              value={session.state.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">{t('archetype.description')}</label>
            <TextArea
              value={session.state.description ?? ''}
              onChange={(e) => update({ description: e.target.value || null })}
              rows={4}
              placeholder={t('archetype.descriptionPlaceholder')}
            />
          </div>
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection title={t('archetype.visualDefaults')}>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-secondary">{t('archetype.icon')}</span>
            <IconSelector
              value={session.state.icon ?? undefined}
              onChange={(icon) => update({ icon })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-secondary">{t('archetype.color')}</span>
            <ColorPicker
              value={session.state.color ?? undefined}
              onChange={(color) => update({ color })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-secondary">{t('archetype.nodeShape')}</span>
            <Select
              options={nodeShapeOptions}
              value={session.state.node_shape ?? ''}
              onChange={(e) => update({ node_shape: e.target.value || null })}
              placeholder={t('archetype.nodeShapePlaceholder')}
              selectSize="sm"
            />
          </div>
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection title={t('archetype.fileTemplate')} defaultOpen={false}>
          <TextArea
            value={session.state.file_template ?? ''}
            onChange={(e) => update({ file_template: e.target.value || null })}
            rows={6}
            placeholder={t('archetype.fileTemplatePlaceholder')}
            className="font-mono text-xs"
          />
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection
          title={t('archetype.propertySchema')}
          actions={(
            <Button size="sm" variant="ghost" onClick={handleAddField}>
              <Plus size={14} className="mr-1" />
              {t('archetype.addField')}
            </Button>
          )}
        >
          <div className="mb-3 rounded-lg border border-subtle bg-surface-base px-3 py-2">
            <div className="text-xs font-medium text-default">
              {t('settings.fieldComplexity' as never)}
              {': '}
              {t(`settings.fieldComplexity${fieldComplexityLevel[0].toUpperCase()}${fieldComplexityLevel.slice(1)}` as TranslationKey)}
            </div>
            <div className="mt-1 text-xs text-secondary">
              {t(`settings.fieldComplexity${fieldComplexityLevel[0].toUpperCase()}${fieldComplexityLevel.slice(1)}Desc` as TranslationKey)}
            </div>
            <button
              type="button"
              className="mt-2 text-xs text-accent transition-colors hover:text-accent-hover"
              onClick={() => setShowSettings(true)}
            >
              {t('typeSelector.openSettings' as TranslationKey)}
            </button>
          </div>

          {fields.length === 0 && (
            <div className="py-4 text-center text-xs text-muted">
              {t('archetype.noFields')}
            </div>
          )}

          <div className="flex flex-col">
            {fields.map((field) => (
              <ArchetypeFieldRow
                key={field.id}
                field={field}
                onUpdate={handleUpdateField}
                onDelete={handleDeleteField}
              />
            ))}
          </div>
        </NetworkObjectEditorSection>

        <NetworkObjectEditorSection title={t('editorShell.metadata' as never)} defaultOpen={false}>
          <NetworkObjectMetadataList
            items={[
              { label: t('editorShell.objectId' as never), value: <code className="font-mono text-xs">{archetype.id}</code> },
            ]}
          />
        </NetworkObjectEditorSection>
      </NetworkObjectEditorShell>
    </ScrollArea>
  );
}
