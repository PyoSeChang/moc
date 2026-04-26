import React, { useMemo, useState } from 'react';
import { ExternalLink, FolderPlus, FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';
import type { TypeGroup } from '@netior/shared/types';
import type { TranslationKey } from '@netior/shared/i18n';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { getIconComponent } from '../ui/lucide-utils';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { TypeGroupModal } from './TypeGroupModal';
import { useI18n } from '../../hooks/useI18n';

type ContextState =
  | { x: number; y: number; kind: 'archetype'; id: string; name: string }
  | { x: number; y: number; kind: 'group'; group: TypeGroup };

type GroupDialogState =
  | { mode: 'create'; parentGroupId: string | null }
  | { mode: 'rename'; group: TypeGroup };

const UNGROUPED_KEY = '__ungrouped__';

export function ArchetypeList(): JSX.Element {
  const { t } = useI18n();
  const tk = (key: string) => t(key as TranslationKey);
  const archetypes = useArchetypeStore((state) => state.archetypes);
  const createArchetype = useArchetypeStore((state) => state.createArchetype);
  const deleteArchetype = useArchetypeStore((state) => state.deleteArchetype);
  const groups = useTypeGroupStore((state) => state.groupsByKind.archetype);
  const createGroup = useTypeGroupStore((state) => state.createGroup);
  const updateGroup = useTypeGroupStore((state) => state.updateGroup);
  const deleteGroup = useTypeGroupStore((state) => state.deleteGroup);
  const currentProject = useProjectStore((state) => state.currentProject);
  const [ctx, setCtx] = useState<ContextState | null>(null);
  const [groupDialog, setGroupDialog] = useState<GroupDialogState | null>(null);

  const archetypesByGroup = useMemo(() => {
    const map = new Map<string, typeof archetypes>();
    for (const archetype of archetypes) {
      const key = archetype.group_id ?? UNGROUPED_KEY;
      const current = map.get(key) ?? [];
      map.set(key, [...current, archetype]);
    }
    return map;
  }, [archetypes]);

  const childGroupsByParent = useMemo(() => {
    const map = new Map<string | null, TypeGroup[]>();
    for (const group of groups) {
      const key = group.parent_group_id ?? null;
      const current = map.get(key) ?? [];
      map.set(key, [...current, group]);
    }
    return map;
  }, [groups]);

  const handleCreateArchetype = async (groupId: string | null = null) => {
    if (!currentProject) return;
    const archetype = await createArchetype({
      project_id: currentProject.id,
      group_id: groupId,
      name: tk('archetype.newDefault'),
    });
    useEditorStore.getState().openTab({
      type: 'archetype',
      targetId: archetype.id,
      title: archetype.name,
      isDirty: true,
    });
  };

  const handleOpenArchetype = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'archetype',
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

    if (ctx.kind === 'archetype') {
      return [
        {
          label: t('editor.openInEditor'),
          icon: <ExternalLink size={14} />,
          onClick: () => handleOpenArchetype(ctx.id, ctx.name),
        },
        { type: 'divider' as const },
        {
          label: t('common.delete'),
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => {
            useEditorStore.getState().closeTab(`archetype:${ctx.id}`);
            void deleteArchetype(ctx.id);
          },
        },
      ];
    }

    return [
      {
          label: tk('archetype.createInGroup'),
        icon: <Plus size={14} />,
        onClick: () => void handleCreateArchetype(ctx.group.id),
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
        kind: 'archetype',
        name,
        parent_group_id: groupDialog.parentGroupId ?? undefined,
        sort_order: siblingCount,
      });
      return;
    }

    await updateGroup(groupDialog.group.id, { name });
  };

  const renderArchetypeRow = (id: string, name: string, color: string | null, icon: string | null, depth: number) => {
    const Icon = icon ? getIconComponent(icon) : null;
    return (
      <button
        key={id}
        type="button"
        className="flex items-center gap-2 py-1.5 pr-3 text-sm text-default hover:bg-state-hover transition-colors text-left"
        style={{ paddingLeft: 16 + (depth * 16) }}
        onClick={() => handleOpenArchetype(id, name)}
        onContextMenu={(event) => handleContextMenu(event, {
          x: event.clientX,
          y: event.clientY,
          kind: 'archetype',
          id,
          name,
        })}
      >
        {color && <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        {Icon && <Icon size={14} className="shrink-0 text-secondary" />}
        <span className="truncate">{name}</span>
      </button>
    );
  };

  const renderGroupNode = (group: TypeGroup, depth: number): JSX.Element => {
    const childGroups = childGroupsByParent.get(group.id) ?? [];
    const groupedArchetypes = archetypesByGroup.get(group.id) ?? [];

    return (
      <div key={group.id} className="flex flex-col">
        <button
          type="button"
          className="flex items-center gap-2 py-1.5 pr-3 text-xs font-medium uppercase tracking-wide text-secondary hover:bg-state-hover transition-colors text-left"
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
        {groupedArchetypes.map((archetype) => renderArchetypeRow(
          archetype.id,
          archetype.name,
          archetype.color,
          archetype.icon,
          depth + 1,
        ))}
        {childGroups.map((child) => renderGroupNode(child, depth + 1))}
      </div>
    );
  };

  const topLevelGroups = childGroupsByParent.get(null) ?? [];
  const ungroupedArchetypes = archetypesByGroup.get(UNGROUPED_KEY) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {t('archetype.title')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGroupDialog({ mode: 'create', parentGroupId: null })}
            className="rounded p-1 text-muted hover:bg-state-hover hover:text-default transition-colors"
            title={tk('typeGroup.create')}
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            onClick={() => void handleCreateArchetype()}
            className="rounded p-1 text-muted hover:bg-state-hover hover:text-default transition-colors"
            title={t('archetype.create')}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        {topLevelGroups.map((group) => renderGroupNode(group, 0))}
        {ungroupedArchetypes.length > 0 && (
          <>
            {topLevelGroups.length > 0 && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                {tk('typeGroup.ungrouped')}
              </div>
            )}
            {ungroupedArchetypes.map((archetype) => renderArchetypeRow(
              archetype.id,
              archetype.name,
              archetype.color,
              archetype.icon,
              0,
            ))}
          </>
        )}
        {archetypes.length === 0 && groups.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('archetype.noArchetypes')}
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
