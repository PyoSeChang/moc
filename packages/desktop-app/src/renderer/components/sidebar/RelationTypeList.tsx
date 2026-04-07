import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ExternalLink, Trash2, FolderPlus, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { useI18n } from '../../hooks/useI18n';
import type { RelationType, TypeGroup } from '@netior/shared/types';

interface CtxState { x: number; y: number; id: string; name: string; kind: 'relationType' | 'group' }

export function RelationTypeList(): JSX.Element {
  const { t } = useI18n();
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);
  const createRelationType = useRelationTypeStore((s) => s.createRelationType);
  const deleteRelationType = useRelationTypeStore((s) => s.deleteRelationType);
  const groups = useTypeGroupStore((s) => s.groups);
  const loadGroups = useTypeGroupStore((s) => s.loadGroups);
  const createGroup = useTypeGroupStore((s) => s.createGroup);
  const deleteGroup = useTypeGroupStore((s) => s.deleteGroup);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

  const rtGroups = useMemo(
    () => groups.filter((g) => g.kind === 'relation_type'),
    [groups],
  );

  useEffect(() => {
    if (currentProject) loadGroups(currentProject.id, 'relation_type');
  }, [currentProject, loadGroups]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, RelationType[]>();
    for (const rt of relationTypes) {
      const key = rt.group_id ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rt);
    }
    return map;
  }, [relationTypes]);

  const handleCreate = async () => {
    if (!currentProject) return;
    const rt = await createRelationType({
      project_id: currentProject.id,
      name: t('relationType.newDefault'),
    });
    useEditorStore.getState().openTab({
      type: 'relationType',
      targetId: rt.id,
      title: rt.name,
    });
  };

  const handleCreateFolder = async () => {
    if (!currentProject || !folderName.trim()) return;
    await createGroup({
      project_id: currentProject.id,
      kind: 'relation_type',
      name: folderName.trim(),
    });
    setFolderName('');
    setCreatingFolder(false);
  };

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'relationType',
      targetId: id,
      title: name,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, name: string, kind: 'relationType' | 'group') => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, id, name, kind });
  };

  const toggleFolder = (groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const buildMenuItems = (): ContextMenuEntry[] => {
    if (!ctx) return [];
    if (ctx.kind === 'group') {
      return [
        { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => deleteGroup(ctx.id) },
      ];
    }
    return [
      { label: t('editor.openInEditor'), icon: <ExternalLink size={14} />, onClick: () => handleClick(ctx.id, ctx.name) },
      { type: 'divider' as const },
      { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => {
        useEditorStore.getState().closeTab(`relationType:${ctx.id}`);
        deleteRelationType(ctx.id);
      }},
    ];
  };

  const renderItem = (rt: RelationType, depth: number) => (
    <button
      key={rt.id}
      type="button"
      className="flex items-center gap-2 px-3 py-1 text-sm text-default hover:bg-surface-hover transition-colors text-left"
      style={{ paddingLeft: depth * 14 + 12 }}
      onClick={() => handleClick(rt.id, rt.name)}
      onContextMenu={(e) => handleContextMenu(e, rt.id, rt.name, 'relationType')}
    >
      {rt.color && (
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
      )}
      <span className="truncate">{rt.name}</span>
    </button>
  );

  const renderFolder = (group: TypeGroup) => {
    const isCollapsed = collapsed[group.id] ?? false;
    const items = grouped.get(group.id) ?? [];

    return (
      <div key={group.id}>
        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-secondary hover:bg-surface-hover hover:text-default transition-colors"
          style={{ paddingLeft: 4 }}
          onClick={() => toggleFolder(group.id)}
          onContextMenu={(e) => handleContextMenu(e, group.id, group.name, 'group')}
        >
          <button className="shrink-0 p-0.5" onClick={(e) => { e.stopPropagation(); toggleFolder(group.id); }}>
            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          </button>
          <Folder size={12} className="shrink-0 opacity-50" />
          <span className="flex-1 truncate">{group.name}</span>
        </div>
        {!isCollapsed && items.map((rt) => renderItem(rt, 1))}
      </div>
    );
  };

  const ungrouped = grouped.get(null) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {t('relationType.title')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCreatingFolder(true)}
            className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
            title={t('typeGroup.newFolder')}
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {creatingFolder && (
        <div className="px-3 pb-1">
          <input
            className="w-full rounded border border-subtle bg-input px-2 py-1 text-xs text-default outline-none focus:border-accent"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setCreatingFolder(false); setFolderName(''); }
            }}
            placeholder={t('typeGroup.folderName')}
            autoFocus
          />
        </div>
      )}

      <div className="flex flex-col">
        {rtGroups.map((g) => renderFolder(g))}
        {ungrouped.map((rt) => renderItem(rt, 0))}
        {relationTypes.length === 0 && rtGroups.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('relationType.noRelationTypes')}
          </div>
        )}
      </div>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={buildMenuItems()} onClose={() => setCtx(null)} />}
    </div>
  );
}
