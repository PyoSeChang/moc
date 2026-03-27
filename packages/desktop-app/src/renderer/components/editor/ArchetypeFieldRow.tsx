import React from 'react';
import type { ArchetypeField, ArchetypeFieldUpdate } from '@moc/shared/types';
import { Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { TypeSelector } from '../ui/TypeSelector';
import { Toggle } from '../ui/Toggle';
interface ArchetypeFieldRowProps {
  field: ArchetypeField;
  onUpdate: (id: string, data: ArchetypeFieldUpdate) => void;
  onDelete: (id: string) => void;
}

const CHOICE_TYPES = new Set(['select', 'multi-select', 'radio']);

export function ArchetypeFieldRow({ field, onUpdate, onDelete }: ArchetypeFieldRowProps): JSX.Element {
  const showOptions = CHOICE_TYPES.has(field.field_type);

  return (
    <div className="flex items-start gap-2 py-1.5 group">
      <Input
        inputSize="sm"
        className="flex-1 min-w-[100px]"
        value={field.name}
        placeholder="Field name"
        onChange={(e) => onUpdate(field.id, { name: e.target.value })}
        onBlur={(e) => onUpdate(field.id, { name: e.target.value })}
      />
      <TypeSelector
        value={field.field_type}
        onChange={(type) => onUpdate(field.id, { field_type: type })}
      />
      {showOptions && (
        <Input
          inputSize="sm"
          className="flex-1 min-w-[80px]"
          value={field.options ? JSON.parse(field.options).choices?.join(', ') ?? '' : ''}
          placeholder="Options (comma-separated)"
          onChange={(e) => {
            const choices = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onUpdate(field.id, { options: JSON.stringify({ choices }) });
          }}
        />
      )}
      <Toggle
        checked={field.required}
        onChange={(checked) => onUpdate(field.id, { required: checked })}
        label="Req"
      />
      <button
        type="button"
        className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-status-error"
        onClick={() => onDelete(field.id)}
        title="Delete field"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
