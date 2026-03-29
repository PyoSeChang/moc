import React from 'react';
import { Plus } from 'lucide-react';
import { useCanvasTypeStore } from '../../stores/canvas-type-store';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import { getIconComponent } from '../ui/lucide-utils';
import { useI18n } from '../../hooks/useI18n';

export function CanvasTypeList(): JSX.Element {
  const { t } = useI18n();
  const canvasTypes = useCanvasTypeStore((s) => s.canvasTypes);
  const createCanvasType = useCanvasTypeStore((s) => s.createCanvasType);
  const currentProject = useProjectStore((s) => s.currentProject);

  const handleCreate = async () => {
    if (!currentProject) return;
    const ct = await createCanvasType({
      project_id: currentProject.id,
      name: t('canvasType.newDefault'),
    });
    useEditorStore.getState().openTab({
      type: 'canvasType',
      targetId: ct.id,
      title: ct.name,
    });
  };

  const handleClick = (id: string, name: string) => {
    useEditorStore.getState().openTab({
      type: 'canvasType',
      targetId: id,
      title: name,
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {t('canvasType.title')}
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
        {canvasTypes.map((ct) => {
          const Icon = ct.icon ? getIconComponent(ct.icon) : null;
          return (
            <button
              key={ct.id}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-default hover:bg-surface-hover transition-colors text-left"
              onClick={() => handleClick(ct.id, ct.name)}
            >
              {ct.color && (
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ct.color }} />
              )}
              {Icon && <Icon size={14} className="shrink-0 text-muted" />}
              <span className="truncate">{ct.name}</span>
            </button>
          );
        })}
        {canvasTypes.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted text-center">
            {t('canvasType.noCanvasTypes')}
          </div>
        )}
      </div>
    </div>
  );
}
