import type Anthropic from '@anthropic-ai/sdk';

export function getAnthropicTools(): Anthropic.Tool[] {
  return [
    // ── Archetype tools ──
    {
      name: 'list_archetypes',
      description: 'List all archetypes for a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'create_archetype',
      description: 'Create a new archetype for a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
          name: { type: 'string', description: 'Archetype name' },
          icon: { type: 'string', description: 'Icon identifier' },
          color: { type: 'string', description: 'Color value' },
          node_shape: { type: 'string', description: 'Node shape for canvas rendering' },
          description: { type: 'string', description: 'Archetype description' },
        },
        required: ['project_id', 'name'],
      },
    },
    {
      name: 'update_archetype',
      description: 'Update an existing archetype.',
      input_schema: {
        type: 'object' as const,
        properties: {
          archetype_id: { type: 'string', description: 'The archetype ID to update' },
          name: { type: 'string', description: 'New name' },
          icon: { type: 'string', description: 'New icon identifier' },
          color: { type: 'string', description: 'New color value' },
          node_shape: { type: 'string', description: 'New node shape' },
          description: { type: 'string', description: 'New description' },
        },
        required: ['archetype_id'],
      },
    },
    {
      name: 'delete_archetype',
      description: 'Delete an archetype. Warning: this will unset the archetype on all concepts using it.',
      input_schema: {
        type: 'object' as const,
        properties: {
          archetype_id: { type: 'string', description: 'The archetype ID to delete' },
        },
        required: ['archetype_id'],
      },
    },

    // ── Relation Type tools ──
    {
      name: 'list_relation_types',
      description: 'List all relation types for a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'create_relation_type',
      description: 'Create a new relation type for a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
          name: { type: 'string', description: 'Relation type name' },
          directed: { type: 'boolean', description: 'Whether the relation is directed (has arrow)' },
          line_style: { type: 'string', enum: ['solid', 'dashed', 'dotted'], description: 'Line style' },
          color: { type: 'string', description: 'Color value' },
          description: { type: 'string', description: 'Relation type description' },
        },
        required: ['project_id', 'name'],
      },
    },
    {
      name: 'update_relation_type',
      description: 'Update an existing relation type.',
      input_schema: {
        type: 'object' as const,
        properties: {
          relation_type_id: { type: 'string', description: 'The relation type ID to update' },
          name: { type: 'string', description: 'New name' },
          directed: { type: 'boolean', description: 'New directed value' },
          line_style: { type: 'string', enum: ['solid', 'dashed', 'dotted'], description: 'New line style' },
          color: { type: 'string', description: 'New color value' },
          description: { type: 'string', description: 'New description' },
        },
        required: ['relation_type_id'],
      },
    },
    {
      name: 'delete_relation_type',
      description: 'Delete a relation type. Warning: edges using this type will have their relation_type_id set to NULL.',
      input_schema: {
        type: 'object' as const,
        properties: {
          relation_type_id: { type: 'string', description: 'The relation type ID to delete' },
        },
        required: ['relation_type_id'],
      },
    },

    // ── Canvas Type tools ──
    {
      name: 'list_canvas_types',
      description: 'List all canvas types for a project, including their allowed relation types.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'create_canvas_type',
      description: 'Create a new canvas type for a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
          name: { type: 'string', description: 'Canvas type name' },
          icon: { type: 'string', description: 'Icon identifier' },
          color: { type: 'string', description: 'Color value' },
          description: { type: 'string', description: 'Canvas type description' },
          allowed_relation_type_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of relation types allowed on this canvas type',
          },
        },
        required: ['project_id', 'name'],
      },
    },
    {
      name: 'update_canvas_type',
      description: 'Update an existing canvas type. If allowed_relation_type_ids is provided, it replaces the existing list entirely.',
      input_schema: {
        type: 'object' as const,
        properties: {
          canvas_type_id: { type: 'string', description: 'The canvas type ID to update' },
          name: { type: 'string', description: 'New name' },
          icon: { type: 'string', description: 'New icon identifier' },
          color: { type: 'string', description: 'New color value' },
          description: { type: 'string', description: 'New description' },
          allowed_relation_type_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'New list of allowed relation type IDs (replaces existing)',
          },
        },
        required: ['canvas_type_id'],
      },
    },
    {
      name: 'delete_canvas_type',
      description: 'Delete a canvas type. Canvases using this type will have their canvas_type_id set to NULL.',
      input_schema: {
        type: 'object' as const,
        properties: {
          canvas_type_id: { type: 'string', description: 'The canvas type ID to delete' },
        },
        required: ['canvas_type_id'],
      },
    },

    // ── Concept tools ──
    {
      name: 'list_concepts',
      description: 'List or search concepts in a project. If query is provided, searches by title; otherwise returns all concepts.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
          query: { type: 'string', description: 'Search query to filter concepts by title' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'create_concept',
      description: 'Create a new concept in a project.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
          title: { type: 'string', description: 'Concept title' },
          archetype_id: { type: 'string', description: 'Archetype ID to assign' },
          color: { type: 'string', description: 'Color value' },
          icon: { type: 'string', description: 'Icon identifier' },
        },
        required: ['project_id', 'title'],
      },
    },
    {
      name: 'update_concept',
      description: 'Update an existing concept.',
      input_schema: {
        type: 'object' as const,
        properties: {
          concept_id: { type: 'string', description: 'The concept ID to update' },
          title: { type: 'string', description: 'New title' },
          archetype_id: { type: 'string', description: 'New archetype ID' },
          color: { type: 'string', description: 'New color value' },
          icon: { type: 'string', description: 'New icon identifier' },
        },
        required: ['concept_id'],
      },
    },
    {
      name: 'delete_concept',
      description: 'Delete a concept. Warning: this removes all associated canvas nodes, files, and properties.',
      input_schema: {
        type: 'object' as const,
        properties: {
          concept_id: { type: 'string', description: 'The concept ID to delete' },
        },
        required: ['concept_id'],
      },
    },

    // ── Project tools ──
    {
      name: 'get_project_summary',
      description: 'Get a summary of a project including counts and names of archetypes, relation types, canvas types, concepts, and canvases.',
      input_schema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'The project ID' },
        },
        required: ['project_id'],
      },
    },
  ];
}
