import React, { useState, useMemo } from 'react';
import type { NetworkObjectType } from '@netior/shared/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useConceptStore } from '../../stores/concept-store';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useRelationTypeStore } from '../../stores/relation-type-store';
import { useNetworkStore } from '../../stores/network-store';
import { useContextStore } from '../../stores/context-store';
import { useI18n } from '../../hooks/useI18n';

interface ObjectPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (objectType: NetworkObjectType, refId: string) => void;
}

type PickerTab = 'concept' | 'network' | 'archetype' | 'relation_type' | 'context';

const TABS = [
  { key: 'concept' as PickerTab, labelKey: 'concept.title' as const },
  { key: 'network' as PickerTab, labelKey: 'network.networks' as const },
  { key: 'archetype' as PickerTab, labelKey: 'archetype.title' as const },
  { key: 'relation_type' as PickerTab, labelKey: 'relationType.title' as const },
  { key: 'context' as PickerTab, labelKey: 'context.title' as const },
];

export function ObjectPickerModal({ open, onClose, onSelect }: ObjectPickerModalProps): JSX.Element {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<PickerTab>('concept');
  const [search, setSearch] = useState('');

  const concepts = useConceptStore((s) => s.concepts);
  const archetypes = useArchetypeStore((s) => s.archetypes);
  const relationTypes = useRelationTypeStore((s) => s.relationTypes);
  const networks = useNetworkStore((s) => s.networks);
  const currentNetwork = useNetworkStore((s) => s.currentNetwork);
  const contexts = useContextStore((s) => s.contexts);

  const items = useMemo(() => {
    const q = search.toLowerCase();
    switch (activeTab) {
      case 'concept':
        return concepts
          .filter((c) => c.title.toLowerCase().includes(q))
          .map((c) => ({ id: c.id, name: c.title }));
      case 'network':
        return networks
          .filter((n) => n.id !== currentNetwork?.id && n.name.toLowerCase().includes(q))
          .map((n) => ({ id: n.id, name: n.name }));
      case 'archetype':
        return archetypes
          .filter((a) => a.name.toLowerCase().includes(q))
          .map((a) => ({ id: a.id, name: a.name }));
      case 'relation_type':
        return relationTypes
          .filter((r) => r.name.toLowerCase().includes(q))
          .map((r) => ({ id: r.id, name: r.name }));
      case 'context':
        return contexts
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c) => ({ id: c.id, name: c.name }));
      default:
        return [];
    }
  }, [activeTab, search, concepts, networks, currentNetwork, archetypes, relationTypes, contexts]);

  const handleSelect = (refId: string) => {
    onSelect(activeTab, refId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('network.selectObject')} width="480px">
      <div className="flex flex-col gap-3 min-h-[300px] max-h-[500px]">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-subtle pb-1">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === key
                  ? 'bg-interactive-selected text-accent'
                  : 'text-secondary hover:bg-surface-hover hover:text-default'
              }`}
              onClick={() => { setActiveTab(key); setSearch(''); }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Search */}
        <Input
          inputSize="sm"
          placeholder={t('network.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* List */}
        <div className="flex-1 overflow-auto border border-subtle rounded-md">
          {items.length > 0 ? (
            <div className="flex flex-col">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex items-center px-3 py-1.5 text-sm text-default hover:bg-surface-hover transition-colors text-left"
                  onClick={() => handleSelect(item.id)}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted p-4">
              {t('common.noResults') ?? 'No results'}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
