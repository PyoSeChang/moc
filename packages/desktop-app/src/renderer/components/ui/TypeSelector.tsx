import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Type, Hash, ToggleLeft, Calendar, Clock, List, CheckSquare, CircleDot, Link2, FileText, Globe, Palette, Star, Tags } from 'lucide-react';
import type { FieldType } from '@moc/shared/types';

interface TypeSelectorProps {
  value?: FieldType;
  onChange?: (type: FieldType) => void;
}

interface TypeOption {
  value: FieldType;
  label: string;
  icon: React.FC<{ size?: string | number }>;
}

interface TypeCategory {
  label: string;
  types: TypeOption[];
}

const CATEGORIES: TypeCategory[] = [
  {
    label: 'Basic',
    types: [
      { value: 'text', label: 'Text', icon: Type },
      { value: 'textarea', label: 'Textarea', icon: FileText },
      { value: 'number', label: 'Number', icon: Hash },
      { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
    ],
  },
  {
    label: 'Date',
    types: [
      { value: 'date', label: 'Date', icon: Calendar },
      { value: 'datetime', label: 'Date & Time', icon: Clock },
    ],
  },
  {
    label: 'Choice',
    types: [
      { value: 'select', label: 'Select', icon: List },
      { value: 'multi-select', label: 'Multi Select', icon: CheckSquare },
      { value: 'radio', label: 'Radio', icon: CircleDot },
    ],
  },
  {
    label: 'Reference',
    types: [
      { value: 'relation', label: 'Relation', icon: Link2 },
      { value: 'file', label: 'File', icon: FileText },
    ],
  },
  {
    label: 'Rich',
    types: [
      { value: 'url', label: 'URL', icon: Globe },
      { value: 'color', label: 'Color', icon: Palette },
      { value: 'rating', label: 'Rating', icon: Star },
      { value: 'tags', label: 'Tags', icon: Tags },
    ],
  },
];

const ALL_TYPES = CATEGORIES.flatMap((c) => c.types);

export const TypeSelector: React.FC<TypeSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selected = ALL_TYPES.find((t) => t.value === value);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-input border border-subtle rounded-lg hover:border-default transition-all duration-fast min-w-[120px]"
        onClick={handleOpen}
      >
        {selected && <selected.icon size={14} />}
        <span className={`flex-1 text-left ${selected ? 'text-default' : 'text-muted'}`}>
          {selected?.label || 'Type'}
        </span>
        <ChevronDown size={12} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-surface-panel border border-default rounded-lg overflow-y-auto max-h-[320px]"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 200,
            zIndex: 10001,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {cat.label}
              </div>
              {cat.types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover ${
                    t.value === value ? 'text-accent bg-accent-muted' : 'text-default'
                  }`}
                  onClick={() => {
                    onChange?.(t.value);
                    setOpen(false);
                  }}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
};
