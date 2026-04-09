import React, { useState, useEffect } from 'react';
import type { ArchetypeField, ArchetypeFieldUpdate } from '@netior/shared/types';
import { Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { TypeSelector } from '../ui/TypeSelector';
import { Toggle } from '../ui/Toggle';
import { Tooltip } from '../ui/Tooltip';
import { ArchetypeRefPicker } from '../ui/ArchetypeRefPicker';
import { useI18n } from '../../hooks/useI18n';
import { useArchetypeStore } from '../../stores/archetype-store';
import {
  parseArchetypeFieldOptions,
  stringifyArchetypeFieldOptions,
} from '../../lib/archetype-field-options';

interface ArchetypeFieldRowProps {
  field: ArchetypeField;
  onUpdate: (id: string, data: ArchetypeFieldUpdate) => void;
  onDelete: (id: string) => void;
}

const CHOICE_TYPES = new Set(['select', 'multi-select', 'radio']);

function parseChoices(options: string | null): string {
  return parseArchetypeFieldOptions(options).choices.join(', ');
}

export function ArchetypeFieldRow({ field, onUpdate, onDelete }: ArchetypeFieldRowProps): JSX.Element {
  const { t } = useI18n();
  const archetypes = useArchetypeStore((state) => state.archetypes);
  const showOptions = CHOICE_TYPES.has(field.field_type);
  const showArchetypeRef = field.field_type === 'archetype_ref';
  const fieldOptions = parseArchetypeFieldOptions(field.options);
  const conceptOptionSourceId = fieldOptions.conceptOptionSourceIds[0] ?? null;

  // Local state buffers to avoid breaking IME composition
  const [nameText, setNameText] = useState(field.name);
  const [optionsText, setOptionsText] = useState(() => parseChoices(field.options));

  // Sync from external changes
  useEffect(() => { setNameText(field.name); }, [field.name]);
  useEffect(() => { setOptionsText(parseChoices(field.options)); }, [field.options]);

  const commitOptions = () => {
    const choices = optionsText.split(',').map((s) => s.trim()).filter(Boolean);
    onUpdate(field.id, {
      options: stringifyArchetypeFieldOptions({
        ...fieldOptions,
        choices,
      }),
    });
  };

  const updateConceptOptionSource = (archetypeId: string | null) => {
    const patch: ArchetypeFieldUpdate = {
      options: stringifyArchetypeFieldOptions({
        ...fieldOptions,
        conceptOptionSourceIds: archetypeId ? [archetypeId] : [],
      }),
    };

    if (archetypeId && !nameText.trim()) {
      const sourceArchetype = archetypes.find((archetype) => archetype.id === archetypeId);
      if (sourceArchetype) {
        patch.name = sourceArchetype.name;
        setNameText(sourceArchetype.name);
      }
    }

    onUpdate(field.id, patch);
  };

  return (
    <div className="flex flex-col gap-1.5 py-1.5 group">
      <div className="flex items-center gap-2">
        <Input
          inputSize="sm"
          className="flex-1 min-w-[100px]"
          value={nameText}
          placeholder={t('archetype.fieldName')}
          onChange={(e) => setNameText(e.target.value)}
          onBlur={() => onUpdate(field.id, { name: nameText })}
          onKeyDown={(e) => { if (e.key === 'Enter') onUpdate(field.id, { name: nameText }); }}
        />
        <TypeSelector
          value={field.field_type}
          onChange={(type) => onUpdate(field.id, {
            field_type: type,
            ref_archetype_id: type === 'archetype_ref' ? field.ref_archetype_id : null,
          })}
        />
        <Toggle
          checked={field.required}
          onChange={(checked) => onUpdate(field.id, { required: checked })}
          label={t('archetype.required')}
        />
        <Tooltip content={t('archetype.deleteField')} position="top">
          <button
            type="button"
            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-status-error"
            onClick={() => onDelete(field.id)}
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>

      {showOptions && (
        <div className="flex flex-col gap-1.5 pl-0">
          <Input
            inputSize="sm"
            value={optionsText}
            placeholder={t('archetype.options')}
            onChange={(e) => setOptionsText(e.target.value)}
            onBlur={commitOptions}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitOptions();
            }}
          />
          <div>
            <div className="mb-1 text-[11px] font-medium text-secondary">
              {t('archetype.conceptOptions' as never)}
            </div>
            <ArchetypeRefPicker
              mode="archetype"
              value={conceptOptionSourceId}
              excludeArchetypeId={field.archetype_id}
              onChange={updateConceptOptionSource}
            />
          </div>
        </div>
      )}

      {showArchetypeRef && (
        <div className="pl-0">
          <ArchetypeRefPicker
            mode="archetype"
            value={field.ref_archetype_id}
            excludeArchetypeId={field.archetype_id}
            onChange={(value) => onUpdate(field.id, { ref_archetype_id: value })}
          />
        </div>
      )}
    </div>
  );
}
