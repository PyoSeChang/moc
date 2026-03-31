import React from 'react';
import { Plus } from 'lucide-react';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { getIconComponent } from '../ui/lucide-utils';
import { useI18n } from '../../hooks/useI18n';

export function ArchetypeList(): JSX.Element {
  const { t } = useI18n();
  const archetypes = useArchetypeStore((s) => s.archetypes);
  const createArchetype = useArchetypeStore((s) => s.createArchetype);
  const currentProject = useProjectStore((s) => s.currentProject);

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

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'archetype',
      targetId: id,
      title: name,
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          Archetypes
        </span>
        <button
          type="button"
          onClick={handleCreate}
          className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
          title="Create archetype"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col">
        {archetypes.map((a) => {
          const Icon = a.icon ? getIconComponent(a.icon) : null;
          return (
            <button
              key={a.id}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-default hover:bg-surface-hover transition-colors text-left"
              onClick={() => handleClick(a.id, a.name)}
            >
              {a.color && (
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              )}
              {Icon && <Icon size={14} className="shrink-0 text-secondary" />}
              <span className="truncate">{a.name}</span>
            </button>
          );
        })}
        {archetypes.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            No archetypes yet
          </div>
        )}
      </div>
    </div>
  );
}
