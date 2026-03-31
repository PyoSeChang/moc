import React, { useEffect, useState, useRef, useCallback } from 'react';
import { narreService, type MentionResult } from '../../../services/narre-service';
import { useI18n } from '../../../hooks/useI18n';
import { ScrollArea } from '../../ui/ScrollArea';
import { Spinner } from '../../ui/Spinner';

interface NarreMentionPickerProps {
  query: string;
  projectId: string;
  position: { top: number; left: number };
  onSelect: (mention: MentionResult) => void;
  onClose: () => void;
}

// Labels are resolved via i18n in the component below

function groupByType(results: MentionResult[]): Record<string, MentionResult[]> {
  const groups: Record<string, MentionResult[]> = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

export function NarreMentionPicker({
  query,
  projectId,
  position,
  onSelect,
  onClose,
}: NarreMentionPickerProps): JSX.Element {
  const { t } = useI18n();
  const [results, setResults] = useState<MentionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await narreService.searchMentions(projectId, query);
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, projectId]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [results, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const grouped = groupByType(results);
  let flatIdx = 0;

  return (
    <div
      ref={containerRef}
      className="fixed z-[10000] min-w-[220px] max-w-[320px] rounded-lg border border-default bg-surface-panel shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ScrollArea className="max-h-[240px]">
        {loading && (
          <div className="flex items-center justify-center py-3">
            <Spinner size="sm" />
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="px-3 py-2 text-xs text-muted">
            {t('common.noResults')}
          </div>
        )}

        {!loading && Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {type === 'concept' ? t('concept.title')
                : type === 'archetype' ? t('archetype.title')
                : type === 'relationType' ? t('relationType.title')
                : type === 'canvasType' ? t('canvasType.title')
                : type === 'canvas' ? t('sidebar.canvases')
                : type}
            </div>
            {items.map((item) => {
              const currentIdx = flatIdx++;
              const isSelected = currentIdx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={[
                    'flex items-center gap-2 px-3 py-1 text-xs cursor-pointer transition-colors',
                    isSelected ? 'bg-surface-hover text-default' : 'text-secondary hover:bg-surface-hover',
                  ].join(' ')}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => setSelectedIndex(currentIdx)}
                >
                  {item.icon && (
                    <span className="shrink-0 text-xs">{item.icon}</span>
                  )}
                  {item.color && !item.icon && (
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="truncate">{item.display}</span>
                </div>
              );
            })}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
