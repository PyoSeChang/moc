import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ExternalLink, Trash2, FolderPlus, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useTypeGroupStore } from '../../stores/type-group-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { getIconComponent } from '../ui/lucide-utils';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { useI18n } from '../../hooks/useI18n';
import type { Archetype, TypeGroup } from '@netior/shared/types';

interface CtxState { x: number; y: number; id: string; name: string; kind: 'archetype' | 'group' }

export function ArchetypeList(): JSX.Element {
  const { t } = useI18n();
  const archetypes = useArchetypeStore((s) => s.archetypes);
  const createArchetype = useArchetypeStore((s) => s.createArchetype);
  const deleteArchetype = useArchetypeStore((s) => s.deleteArchetype);
  const groups = useTypeGroupStore((s) => s.groups);
  const loadGroups = useTypeGroupStore((s) => s.loadGroups);
  const createGroup = useTypeGroupStore((s) => s.createGroup);
  const deleteGroup = useTypeGroupStore((s) => s.deleteGroup);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

  const archetypeGroups = useMemo(
    () => groups.filter((g) => g.kind === 'archetype'),
    [groups],
  );

  useEffect(() => {
    if (currentProject) loadGroups(currentProject.id, 'archetype');
  }, [currentProject, loadGroups]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, Archetype[]>();
    for (const a of archetypes) {
      const key = a.group_id ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [archetypes]);

  const handleCreate = async () => {
    if (!currentProject) return;
    const archetype = await createArchetype({
      project_id: currentProject.id,
      name: 'New Archetype',
    });
    useEditorStore.getState().openTab({
      type: 'archetype',
      targetId: archetype.id,
      title: archetype.name,
    });
  };

  const handleCreateFolder = async () => {
    if (!currentProject || !folderName.trim()) return;
    await createGroup({
      project_id: currentProject.id,
      kind: 'archetype',
      name: folderName.trim(),
    });
    setFolderName('');
    setCreatingFolder(false);
  };

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'archetype',
      targetId: id,
      title: name,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, name: string, kind: 'archetype' | 'group') => {
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
        useEditorStore.getState().closeTab(`archetype:${ctx.id}`);
        deleteArchetype(ctx.id);
      }},
    ];
  };

  const renderArchetypeItem = (a: Archetype, depth: number) => {
    const Icon = a.icon ? getIconComponent(a.icon) : null;
    return (
      <button
        key={a.id}
        type="button"
        className="flex items-center gap-2 px-3 py-1 text-sm text-default hover:bg-surface-hover transition-colors text-left"
        style={{ paddingLeft: depth * 14 + 12 }}
        onClick={() => handleClick(a.id, a.name)}
        onContextMenu={(e) => handleContextMenu(e, a.id, a.name, 'archetype')}
      >
        {a.color && (
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
        )}
        {Icon && <Icon size={14} className="shrink-0 text-secondary" />}
        <span className="truncate">{a.name}</span>
      </button>
    );
  };

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
        {!isCollapsed && items.map((a) => renderArchetypeItem(a, 1))}
      </div>
    );
  };

  const ungrouped = grouped.get(null) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {t('archetype.title')}
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
        {archetypeGroups.map((g) => renderFolder(g))}
        {ungrouped.map((a) => renderArchetypeItem(a, 0))}
        {archetypes.length === 0 && archetypeGroups.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('archetype.noArchetypes')}
          </div>
        )}
      </div>
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={buildMenuItems()} onClose={() => setCtx(null)} />}
    </div>
  );
}
