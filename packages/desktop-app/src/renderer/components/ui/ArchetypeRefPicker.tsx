import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BoxSelect, X } from 'lucide-react';
import { useConceptStore } from '../../stores/concept-store';
import { useI18n } from '../../hooks/useI18n';

export interface ArchetypeRefPickerProps {
  archetypeId: string;
  value: string | null;
  onChange: (conceptId: string | null) => void;
  disabled?: boolean;
}

export const ArchetypeRefPicker: React.FC<ArchetypeRefPickerProps> = ({ archetypeId, value, onChange, disabled }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const concepts = useConceptStore((s) => s.concepts);
  const filtered = useMemo(() => {
    const byArchetype = concepts.filter((c) => c.archetype_id === archetypeId);
    if (!search) return byArchetype;
    const q = search.toLowerCase();
    return byArchetype.filter((c) => c.title.toLowerCase().includes(q));
  }, [concepts, archetypeId, search]);

  const selected = concepts.find((c) => c.id === value);

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

  const handleOpen = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(!open);
    setSearch('');
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`flex items-center gap-2 px-3 py-1.5 bg-input border border-subtle rounded-lg text-sm cursor-pointer hover:border-default transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleOpen}
      >
        <BoxSelect size={14} className="text-muted" />
        <span className={`flex-1 ${selected ? 'text-default' : 'text-muted'}`}>
          {selected?.title || t('concept.searchPlaceholder')}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-muted hover:text-default"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-surface-panel border border-default rounded-lg overflow-hidden"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: Math.max(dropdownPos.width, 200),
            zIndex: 10001,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <input
              className="w-full px-2 py-1 text-sm bg-input border border-subtle rounded text-default outline-none focus:border-accent"
              placeholder={t('concept.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover ${
                  c.id === value ? 'text-accent bg-accent-muted' : 'text-default'
                }`}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                {c.color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />}
                {c.title}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted">
                {t('typeSelector.noResults')}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
