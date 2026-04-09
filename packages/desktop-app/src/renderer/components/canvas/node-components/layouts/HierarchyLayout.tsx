import React from 'react';
import { resolveIcon } from '../../../../utils/icon-resolver';
import type { ShapeLayoutProps } from '../types';

export const HierarchyLayout: React.FC<ShapeLayoutProps> = ({ icon, label, semanticTypeLabel }) => (
  <div className="flex h-full w-full flex-col gap-2 px-3 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[16px] leading-none text-accent">{resolveIcon(icon, 16)}</span>
      <span className="truncate text-sm font-medium text-default">{label}</span>
    </div>
    <div className="flex items-center gap-2 text-[11px] text-secondary">
      <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
      <span className="truncate">{semanticTypeLabel}</span>
    </div>
    <div className="pointer-events-none mt-auto h-px w-full bg-border-subtle" aria-hidden="true" />
  </div>
);
