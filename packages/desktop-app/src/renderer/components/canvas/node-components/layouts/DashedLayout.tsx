import React from 'react';
import { Globe } from 'lucide-react';
import { resolveIcon } from '../../../../utils/icon-resolver';
import type { ShapeLayoutProps } from '../types';

/** Template / portal nodes — icon + label + field count / portal badge */
export const DashedLayout: React.FC<ShapeLayoutProps> = ({
  icon,
  label,
  semanticTypeLabel,
  systemType,
  content,
}) => {
  const fieldCount = Array.isArray(content?.fields) ? content.fields.length : 0;
  const isPortal = systemType === 'portal';

  return (
    <div className="w-full h-full flex flex-row items-center gap-2 py-2 px-3">
      <span className="text-[20px] leading-none shrink-0">{resolveIcon(icon)}</span>
      <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
        <span className="text-sm font-medium text-default whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
        <span className="text-xs text-secondary whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
          {isPortal && <Globe size={10} className="shrink-0 text-accent" />}
          {semanticTypeLabel}
          {fieldCount > 0 && !isPortal && <span className="opacity-60"> · {fieldCount}</span>}
        </span>
      </div>
    </div>
  );
};
