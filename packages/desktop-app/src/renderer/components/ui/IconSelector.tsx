import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { iconNames, getIconComponent } from './lucide-utils';
import { Input } from './Input';

interface IconSelectorProps {
  value?: string;
  onChange?: (name: string) => void;
  placeholder?: string;
}

const PAGE_SIZE = 120;

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, placeholder = 'Select icon' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return iconNames;
    const q = search.toLowerCase();
    return iconNames.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  const paged = useMemo(() => filtered.slice(0, (page + 1) * PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
    setSearch('');
  };

  const SelectedIcon = value ? getIconComponent(value) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-2 px-3 py-2 text-sm bg-input border border-subtle rounded-lg hover:border-default transition-all duration-fast"
        onClick={handleOpen}
      >
        {SelectedIcon ? <SelectedIcon size={16} /> : null}
        <span className={value ? 'text-default' : 'text-muted'}>
          {value || placeholder}
        </span>
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-surface-panel border border-default rounded-lg overflow-hidden"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 320,
            zIndex: 10001,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <Input
              inputSize="sm"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[240px] overflow-y-auto">
            {paged.map((name) => {
              const Icon = getIconComponent(name);
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                    name === value ? 'bg-accent text-on-accent' : 'text-default hover:bg-surface-hover'
                  }`}
                  onClick={() => {
                    onChange?.(name);
                    setOpen(false);
                  }}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
          {paged.length < filtered.length && (
            <button
              type="button"
              className="w-full py-1.5 text-xs text-muted hover:text-default hover:bg-surface-hover transition-colors"
              onClick={() => setPage((p) => p + 1)}
            >
              Load more ({filtered.length - paged.length} remaining)
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
};
