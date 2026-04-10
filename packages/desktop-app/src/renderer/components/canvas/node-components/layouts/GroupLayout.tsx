import React from 'react';
import { resolveIcon } from '../../../../utils/icon-resolver';
import type { ShapeLayoutProps } from '../types';

export const GroupLayout: React.FC<ShapeLayoutProps> = ({ icon, label, semanticTypeLabel, collapsed, metadata }) => {
  const childCount = typeof metadata?.childCount === 'number' ? metadata.childCount : 0;
  const portalCount = typeof metadata?.portalCount === 'number' ? metadata.portalCount : 0;

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[16px] leading-none text-secondary">{resolveIcon(icon, 16)}</span>
        <span className="truncate text-sm font-medium text-default">{label}</span>
      </div>
      <span className="truncate text-[11px] text-secondary">{semanticTypeLabel}</span>
      {collapsed && (
        <div className="mt-auto flex items-center gap-2 text-[11px] text-secondary">
          <span>{childCount} items</span>
          {portalCount > 0 && <span>{portalCount} portals</span>}
        </div>
      )}
    </div>
  );
};
