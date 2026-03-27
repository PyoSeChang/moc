import React, { useEffect, useState, useCallback } from 'react';
import type { EditorTab, ArchetypeUpdate } from '@moc/shared/types';
import { Plus } from 'lucide-react';
import { useArchetypeStore } from '../../stores/archetype-store';
import { useEditorStore } from '../../stores/editor-store';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { IconSelector } from '../ui/IconSelector';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { ArchetypeFieldRow } from './ArchetypeFieldRow';

interface ArchetypeEditorProps {
  tab: EditorTab;
}

const NODE_SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'parallelogram', label: 'Parallelogram' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'stadium', label: 'Stadium' },
];

export function ArchetypeEditor({ tab }: ArchetypeEditorProps): JSX.Element {
  const archetypeId = tab.targetId;
  const archetypes = useArchetypeStore((s) => s.archetypes);
  const fields = useArchetypeStore((s) => s.fields[archetypeId] ?? []);
  const { updateArchetype, loadFields, createField, updateField, deleteField } = useArchetypeStore();

  const archetype = archetypes.find((a) => a.id === archetypeId);

  useEffect(() => {
    loadFields(archetypeId);
  }, [archetypeId, loadFields]);

  const handleUpdate = useCallback(
    (data: ArchetypeUpdate) => {
      updateArchetype(archetypeId, data);
      // Sync tab title
      if (data.name) {
        useEditorStore.getState().updateTitle(tab.id, data.name);
      }
    },
    [archetypeId, tab.id, updateArchetype],
  );

  const handleAddField = async () => {
    await createField({
      archetype_id: archetypeId,
      name: '',
      field_type: 'text',
      sort_order: fields.length,
    });
  };

  const handleUpdateField = useCallback(
    (id: string, data: Parameters<typeof updateField>[2]) => {
      updateField(id, archetypeId, data);
    },
    [archetypeId, updateField],
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      deleteField(id, archetypeId);
    },
    [archetypeId, deleteField],
  );

  if (!archetype) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted">
        Archetype not found
      </div>
    );
  }

  return (
    <ScrollArea>
      <div className="flex flex-col gap-6 p-4 max-w-[600px]">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Name</label>
          <Input
            value={archetype.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Description</label>
          <TextArea
            value={archetype.description ?? ''}
            onChange={(e) => handleUpdate({ description: e.target.value || null })}
            rows={2}
            placeholder="Describe this archetype..."
          />
        </div>

        {/* Visual Defaults */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-muted">Visual Defaults</label>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted">Icon</span>
            <IconSelector
              value={archetype.icon ?? undefined}
              onChange={(icon) => handleUpdate({ icon })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted">Color</span>
            <ColorPicker
              value={archetype.color ?? undefined}
              onChange={(color) => handleUpdate({ color })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted">Node Shape</span>
            <Select
              options={NODE_SHAPE_OPTIONS}
              value={archetype.node_shape ?? ''}
              onChange={(e) => handleUpdate({ node_shape: e.target.value || null })}
              placeholder="Default shape"
              selectSize="sm"
            />
          </div>
        </div>

        {/* File Template */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">File Template</label>
          <TextArea
            value={archetype.file_template ?? ''}
            onChange={(e) => handleUpdate({ file_template: e.target.value || null })}
            rows={6}
            placeholder="# Title\n\n## Section\n..."
            className="font-mono text-xs"
          />
        </div>

        {/* Fields Schema */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted">Property Schema</label>
            <Button size="sm" variant="ghost" onClick={handleAddField}>
              <Plus size={14} className="mr-1" />
              Add Field
            </Button>
          </div>

          {fields.length === 0 && (
            <div className="text-xs text-muted py-4 text-center">
              No fields defined yet
            </div>
          )}

          <div className="flex flex-col">
            {fields.map((field) => (
              <ArchetypeFieldRow
                key={field.id}
                field={field}
                onUpdate={handleUpdateField}
                onDelete={handleDeleteField}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
