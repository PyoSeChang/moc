import React from 'react';
import { resolveIcon } from '../../../../utils/icon-resolver';
import type { ShapeLayoutProps } from '../types';

export const GroupLayout: React.FC<ShapeLayoutProps> = ({ icon, label, semanticTypeLabel }) => (
  <div className="flex h-full w-full flex-col items-start justify-start gap-1 px-3 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[16px] leading-none text-secondary">{resolveIcon(icon, 16)}</span>
      <span className="truncate text-sm font-medium text-default">{label}</span>
    </div>
    <span className="truncate text-[11px] text-secondary">{semanticTypeLabel}</span>
  </div>
);
