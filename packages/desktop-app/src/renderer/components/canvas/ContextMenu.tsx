import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="min-w-[180px] p-1 bg-surface-panel border border-subtle rounded-lg shadow-lg"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={`flex items-center gap-2 w-full py-2 px-3 bg-transparent border-none rounded-md text-default text-sm cursor-pointer transition-[background] duration-fast text-left hover:bg-surface-hover ${item.danger ? 'text-status-error hover:bg-[color-mix(in_srgb,var(--status-error)_10%,transparent)]' : ''} ${item.disabled ? 'text-muted cursor-default' : ''}`}
          disabled={item.disabled}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
        >
          {item.icon && <span className="text-[16px] leading-none shrink-0">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
};
