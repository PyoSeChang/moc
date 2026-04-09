import React, { useEffect, useMemo } from 'react';
import type { ArchetypeField } from '@netior/shared/types';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useConceptStore } from '../../stores/concept-store';
import { useProjectStore } from '../../stores/project-store';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { NumberInput } from '../ui/NumberInput';
import { Toggle } from '../ui/Toggle';
import { Select } from '../ui/Select';
import { RadioGroup } from '../ui/RadioGroup';
import { MultiSelect } from '../ui/MultiSelect';
import { TagInput } from '../ui/TagInput';
import { Rating } from '../ui/Rating';
import { ColorPicker } from '../ui/ColorPicker';
import { DatePicker } from '../ui/DatePicker';
import { LinkInput } from '../ui/LinkInput';
import { RelationPicker } from '../ui/RelationPicker';
import { FilePicker } from '../ui/FilePicker';
import { useI18n } from '../../hooks/useI18n';
import {
  parseArchetypeFieldOptions,
  toConceptOptionValue,
} from '../../lib/archetype-field-options';

interface ConceptPropertiesPanelProps {
  archetypeId: string;
  properties: Record<string, string | null>;
  onChange: (fieldId: string, value: string | null) => void;
}

function parseArrayValue(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function parseNestedPropertyValue(value: string | null): Record<string, string | null> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, item]) => typeof item === 'string' || item === null),
    ) as Record<string, string | null>;
  } catch {
    return {};
  }
}

export function ConceptPropertiesPanel({ archetypeId, properties, onChange }: ConceptPropertiesPanelProps): JSX.Element {
  const fields = useArchetypeStore((s) => s.fields[archetypeId] ?? []);
  const loadFields = useArchetypeStore((s) => s.loadFields);

  useEffect(() => {
    loadFields(archetypeId);
  }, [archetypeId, loadFields]);

  if (fields.length === 0) return <></>;

  return (
    <div className="flex flex-col gap-2 border-b border-subtle px-3 py-3">
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={properties[field.id] ?? null}
          onChange={(val) => onChange(field.id, val)}
        />
      ))}
    </div>
  );
}

interface FieldInputProps {
  field: ArchetypeField;
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FieldInput({ field, value, onChange }: FieldInputProps): JSX.Element {
  const { t } = useI18n();
  const choices = useFieldChoiceOptions(field);

  const label = (
    <label className="text-xs font-medium text-muted">
      {field.name}
      {field.required && <span className="text-status-error ml-0.5">*</span>}
    </label>
  );

  switch (field.field_type) {
    case 'text':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <Input
            inputSize="sm"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <TextArea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            rows={3}
          />
        </div>
      );
    case 'number':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <NumberInput
            value={value ? Number(value) : 0}
            onChange={(val) => onChange(String(val))}
          />
        </div>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-2 py-0.5">
          <Toggle
            checked={value === 'true'}
            onChange={(checked) => onChange(String(checked))}
            label={field.name}
          />
        </div>
      );
    case 'date':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <DatePicker value={value ?? ''} onChange={(v) => onChange(v || null)} />
        </div>
      );
    case 'datetime':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <DatePicker value={value ?? ''} onChange={(v) => onChange(v || null)} includeTime />
        </div>
      );
    case 'select':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <Select
            options={choices}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            selectSize="sm"
            placeholder="Select..."
          />
        </div>
      );
    case 'multi-select': {
      const arr = parseArrayValue(value);
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <MultiSelect
            options={choices}
            value={arr}
            onChange={(v) => onChange(v.length > 0 ? JSON.stringify(v) : null)}
          />
        </div>
      );
    }
    case 'radio':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <RadioGroup
            options={choices}
            value={value ?? undefined}
            onChange={(v) => onChange(v || null)}
          />
        </div>
      );
    case 'relation':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <RelationPicker
            value={value ?? undefined}
            onChange={(v) => onChange(v)}
          />
        </div>
      );
    case 'archetype_ref':
      return (
        <EmbeddedArchetypePropertiesInput
          field={field}
          value={value}
          onChange={onChange}
          missingTargetMessage={t('concept.referenceFieldNeedsType' as never)}
          emptyMessage={t('concept.embeddedFieldEmpty' as never)}
        />
      );
    case 'file':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <FilePicker
            value={value ?? undefined}
            onChange={(v) => onChange(v || null)}
          />
        </div>
      );
    case 'url':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <LinkInput
            value={value ?? undefined}
            onChange={(v) => onChange(v || null)}
          />
        </div>
      );
    case 'color':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <ColorPicker
            value={value ?? undefined}
            onChange={(v) => onChange(v)}
          />
        </div>
      );
    case 'rating':
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <Rating
            value={value ? Number(value) : 0}
            onChange={(v) => onChange(String(v))}
          />
        </div>
      );
    case 'tags': {
      const tags = parseArrayValue(value);
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <TagInput
            value={tags}
            onChange={(v) => onChange(v.length > 0 ? JSON.stringify(v) : null)}
          />
        </div>
      );
    }
    default:
      return (
        <div className="flex flex-col gap-0.5">
          {label}
          <Input inputSize="sm" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} />
        </div>
      );
  }
}

interface EmbeddedArchetypePropertiesInputProps {
  field: ArchetypeField;
  value: string | null;
  onChange: (value: string | null) => void;
  missingTargetMessage: string;
  emptyMessage: string;
}

function EmbeddedArchetypePropertiesInput({
  field,
  value,
  onChange,
  missingTargetMessage,
  emptyMessage,
}: EmbeddedArchetypePropertiesInputProps): JSX.Element {
  const nestedFields = useArchetypeStore((state) => (
    field.ref_archetype_id ? state.fields[field.ref_archetype_id] ?? [] : []
  ));
  const loadFields = useArchetypeStore((state) => state.loadFields);
  const nestedValues = useMemo(() => parseNestedPropertyValue(value), [value]);

  useEffect(() => {
    if (!field.ref_archetype_id) return;
    loadFields(field.ref_archetype_id);
  }, [field.ref_archetype_id, loadFields]);

  const label = (
    <label className="text-xs font-medium text-muted">
      {field.name}
      {field.required && <span className="text-status-error ml-0.5">*</span>}
    </label>
  );

  const updateNestedValue = (fieldId: string, nextValue: string | null) => {
    const next = { ...nestedValues };
    if (nextValue == null) {
      delete next[fieldId];
    } else {
      next[fieldId] = nextValue;
    }

    onChange(Object.keys(next).length > 0 ? JSON.stringify(next) : null);
  };

  if (!field.ref_archetype_id) {
    return (
      <div className="flex flex-col gap-0.5">
        {label}
        <div className="rounded-lg border border-subtle bg-surface-base px-3 py-2 text-xs text-muted">
          {missingTargetMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <div className="rounded-xl border border-subtle bg-surface-base p-3">
        {nestedFields.length === 0 ? (
          <div className="text-xs text-muted">{emptyMessage}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {nestedFields.map((nestedField) => (
              <FieldInput
                key={`${field.id}:${nestedField.id}`}
                field={nestedField}
                value={nestedValues[nestedField.id] ?? null}
                onChange={(nextValue) => updateNestedValue(nestedField.id, nextValue)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useFieldChoiceOptions(field: ArchetypeField): { value: string; label: string }[] {
  const currentProjectId = useProjectStore((state) => state.currentProject?.id ?? null);
  const concepts = useConceptStore((state) => state.concepts);
  const loadConcepts = useConceptStore((state) => state.loadByProject);
  const optionsConfig = useMemo(() => parseArchetypeFieldOptions(field.options), [field.options]);
  const sourceIds = optionsConfig.conceptOptionSourceIds;

  useEffect(() => {
    if (sourceIds.length === 0 || !currentProjectId || concepts.length > 0) return;
    loadConcepts(currentProjectId);
  }, [concepts.length, currentProjectId, loadConcepts, sourceIds.length]);

  return useMemo(() => {
    const staticOptions = optionsConfig.choices.map((choice) => ({
      value: choice,
      label: choice,
    }));
    const conceptOptions = concepts
      .filter((concept) => concept.archetype_id && sourceIds.includes(concept.archetype_id))
      .map((concept) => ({
        value: toConceptOptionValue(concept.id),
        label: concept.title,
      }));

    return [...staticOptions, ...conceptOptions];
  }, [concepts, optionsConfig.choices, sourceIds]);
}
