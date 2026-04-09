import React, { useMemo, useState } from 'react';
import { ExternalLink, FolderPlus, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type { TypeGroup } from '@netior/shared/types';
import type { TranslationKey } from '@netior/shared/i18n';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { TypeGroupModal } from './TypeGroupModal';
import { useI18n } from '../../hooks/useI18n';

type ContextState =
  | { x: number; y: number; kind: 'relationType'; id: string; name: string }
  | { x: number; y: number; kind: 'group'; group: TypeGroup };

type GroupDialogState =
  | { mode: 'create'; parentGroupId: string | null }
  | { mode: 'rename'; group: TypeGroup };

const UNGROUPED_KEY = '__ungrouped__';

export function RelationTypeList(): JSX.Element {
  const { t } = useI18n();
  const tk = (key: string) => t(key as TranslationKey);
  const relationTypes = useRelationTypeStore((state) => state.relationTypes);
  const createRelationType = useRelationTypeStore((state) => state.createRelationType);
  const deleteRelationType = useRelationTypeStore((state) => state.deleteRelationType);
  const groups = useTypeGroupStore((state) => state.groupsByKind.relation_type);
  const createGroup = useTypeGroupStore((state) => state.createGroup);
  const updateGroup = useTypeGroupStore((state) => state.updateGroup);
  const deleteGroup = useTypeGroupStore((state) => state.deleteGroup);
  const currentProject = useProjectStore((state) => state.currentProject);
  const [ctx, setCtx] = useState<ContextState | null>(null);
  const [groupDialog, setGroupDialog] = useState<GroupDialogState | null>(null);

  const relationTypesByGroup = useMemo(() => {
    const map = new Map<string, typeof relationTypes>();
    for (const relationType of relationTypes) {
      const key = relationType.group_id ?? UNGROUPED_KEY;
      const current = map.get(key) ?? [];
      map.set(key, [...current, relationType]);
    }
    return map;
  }, [relationTypes]);

  const childGroupsByParent = useMemo(() => {
    const map = new Map<string | null, TypeGroup[]>();
    for (const group of groups) {
      const key = group.parent_group_id ?? null;
      const current = map.get(key) ?? [];
      map.set(key, [...current, group]);
    }
    return map;
  }, [groups]);

  const handleCreateRelationType = async (groupId: string | null = null) => {
    if (!currentProject) return;
    const relationType = await createRelationType({
      project_id: currentProject.id,
      group_id: groupId,
      name: t('relationType.newDefault'),
    });
    useEditorStore.getState().openTab({
      type: 'relationType',
      targetId: relationType.id,
      title: relationType.name,
    });
  };

  const handleOpenRelationType = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'relationType',
      targetId: id,
      title: name,
    });
  };

  const handleContextMenu = (event: React.MouseEvent, nextCtx: ContextState) => {
    event.preventDefault();
    event.stopPropagation();
    setCtx(nextCtx);
  };

  const buildMenuItems = (): ContextMenuEntry[] => {
    if (!ctx) return [];

    if (ctx.kind === 'relationType') {
      return [
        {
          label: t('editor.openInEditor'),
          icon: <ExternalLink size={14} />,
          onClick: () => handleOpenRelationType(ctx.id, ctx.name),
        },
        { type: 'divider' as const },
        {
          label: t('common.delete'),
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => {
            useEditorStore.getState().closeTab(`relationType:${ctx.id}`);
            void deleteRelationType(ctx.id);
          },
        },
      ];
    }

    return [
      {
        label: tk('relationType.createInGroup'),
        icon: <Plus size={14} />,
        onClick: () => void handleCreateRelationType(ctx.group.id),
      },
      {
        label: tk('typeGroup.createSubgroup'),
        icon: <FolderPlus size={14} />,
        onClick: () => setGroupDialog({ mode: 'create', parentGroupId: ctx.group.id }),
      },
      {
        label: tk('typeGroup.rename'),
        icon: <Pencil size={14} />,
        onClick: () => setGroupDialog({ mode: 'rename', group: ctx.group }),
      },
      { type: 'divider' as const },
      {
        label: t('common.delete'),
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => void deleteGroup(ctx.group.id),
      },
    ];
  };

  const submitGroupDialog = async (name: string) => {
    if (!currentProject || !groupDialog) return;

    if (groupDialog.mode === 'create') {
      const siblingCount = groups.filter((group) => (
        (group.parent_group_id ?? null) === groupDialog.parentGroupId
      )).length;
      await createGroup({
        project_id: currentProject.id,
        kind: 'relation_type',
        name,
        parent_group_id: groupDialog.parentGroupId ?? undefined,
        sort_order: siblingCount,
      });
      return;
    }

    await updateGroup(groupDialog.group.id, { name });
  };

  const renderRelationTypeRow = (id: string, name: string, color: string | null, depth: number) => (
    <button
      key={id}
      type="button"
      className="flex items-center gap-2 py-1.5 pr-3 text-sm text-default hover:bg-surface-hover transition-colors text-left"
      style={{ paddingLeft: 16 + (depth * 16) }}
      onClick={() => handleOpenRelationType(id, name)}
      onContextMenu={(event) => handleContextMenu(event, {
        x: event.clientX,
        y: event.clientY,
        kind: 'relationType',
        id,
        name,
      })}
    >
      {color && <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className="truncate">{name}</span>
    </button>
  );

  const renderGroupNode = (group: TypeGroup, depth: number): JSX.Element => {
    const childGroups = childGroupsByParent.get(group.id) ?? [];
    const groupedRelationTypes = relationTypesByGroup.get(group.id) ?? [];

    return (
      <div key={group.id} className="flex flex-col">
        <button
          type="button"
          className="flex items-center gap-2 py-1.5 pr-3 text-xs font-medium uppercase tracking-wide text-secondary hover:bg-surface-hover transition-colors text-left"
          style={{ paddingLeft: 12 + (depth * 16) }}
          onContextMenu={(event) => handleContextMenu(event, {
            x: event.clientX,
            y: event.clientY,
            kind: 'group',
            group,
          })}
        >
          <FolderTree size={13} className="shrink-0" />
          <span className="truncate">{group.name}</span>
        </button>
        {groupedRelationTypes.map((relationType) => renderRelationTypeRow(
          relationType.id,
          relationType.name,
          relationType.color,
          depth + 1,
        ))}
        {childGroups.map((child) => renderGroupNode(child, depth + 1))}
      </div>
    );
  };

  const topLevelGroups = childGroupsByParent.get(null) ?? [];
  const ungroupedRelationTypes = relationTypesByGroup.get(UNGROUPED_KEY) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {t('relationType.title')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGroupDialog({ mode: 'create', parentGroupId: null })}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-default transition-colors"
            title={tk('typeGroup.create')}
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            onClick={() => void handleCreateRelationType()}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-default transition-colors"
            title={tk('relationType.create')}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        {topLevelGroups.map((group) => renderGroupNode(group, 0))}
        {ungroupedRelationTypes.length > 0 && (
          <>
            {topLevelGroups.length > 0 && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                {tk('typeGroup.ungrouped')}
              </div>
            )}
            {ungroupedRelationTypes.map((relationType) => renderRelationTypeRow(
              relationType.id,
              relationType.name,
              relationType.color,
              0,
            ))}
          </>
        )}
        {relationTypes.length === 0 && groups.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('relationType.noRelationTypes')}
          </div>
        )}
      </div>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={buildMenuItems()} onClose={() => setCtx(null)} />}
      <TypeGroupModal
        open={groupDialog !== null}
        onClose={() => setGroupDialog(null)}
        onSubmit={submitGroupDialog}
        initialValue={groupDialog?.mode === 'rename' ? groupDialog.group.name : ''}
        title={groupDialog?.mode === 'rename' ? tk('typeGroup.rename') : tk('typeGroup.create')}
      />
    </div>
  );
}
