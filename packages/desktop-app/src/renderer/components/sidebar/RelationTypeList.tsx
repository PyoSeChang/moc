import React from 'react';
import { Plus } from 'lucide-react';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { useI18n } from '../../hooks/useI18n';

export function RelationTypeList(): JSX.Element {
  const { t } = useI18n();
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);
  const createRelationType = useRelationTypeStore((s) => s.createRelationType);
  const currentProject = useProjectStore((s) => s.currentProject);

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

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'relationType',
      targetId: id,
      title: name,
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {t('relationType.title')}
        </span>
        <button
          type="button"
          onClick={handleCreate}
          className="p-1 text-muted hover:text-default transition-colors rounded hover:bg-surface-hover"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col">
        {relationTypes.map((rt) => (
          <button
            key={rt.id}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-default hover:bg-surface-hover transition-colors text-left"
            onClick={() => handleClick(rt.id, rt.name)}
          >
            {rt.color && (
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
            )}
            <span className="truncate">{rt.name}</span>
          </button>
        ))}
        {relationTypes.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('relationType.noRelationTypes')}
          </div>
        )}
      </div>
    </div>
  );
}
