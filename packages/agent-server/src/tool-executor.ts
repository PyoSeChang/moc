import * as core from '@moc/core';
import type { LineStyle } from '@moc/shared/types';

/**
 * Executes a tool by mapping the tool name to the corresponding moc-core function.
 * For MVP, we call moc-core directly instead of going through moc-mcp HTTP.
 */
export function executeTool(
  toolName: string,
  input: Record<string, unknown>,
): string {
  try {
    const result = executeToolInner(toolName, input);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

function executeToolInner(
  toolName: string,
  input: Record<string, unknown>,
): unknown {
  switch (toolName) {
    // ── Archetype ──
    case 'list_archetypes':
      return core.listArchetypes(input.project_id as string);

    case 'create_archetype':
      return core.createArchetype({
        project_id: input.project_id as string,
        name: input.name as string,
        icon: input.icon as string | undefined,
        color: input.color as string | undefined,
        node_shape: input.node_shape as string | undefined,
        description: input.description as string | undefined,
      });

    case 'update_archetype':
      return core.updateArchetype(input.archetype_id as string, {
        name: input.name as string | undefined,
        icon: input.icon as string | undefined,
        color: input.color as string | undefined,
        node_shape: input.node_shape as string | undefined,
        description: input.description as string | undefined,
      });

    case 'delete_archetype':
      return { success: core.deleteArchetype(input.archetype_id as string), id: input.archetype_id };

    // ── Relation Type ──
    case 'list_relation_types':
      return core.listRelationTypes(input.project_id as string);

    case 'create_relation_type':
      return core.createRelationType({
        project_id: input.project_id as string,
        name: input.name as string,
        directed: input.directed as boolean | undefined,
        line_style: input.line_style as LineStyle | undefined,
        color: input.color as string | undefined,
        description: input.description as string | undefined,
      });

    case 'update_relation_type':
      return core.updateRelationType(input.relation_type_id as string, {
        name: input.name as string | undefined,
        directed: input.directed as boolean | undefined,
        line_style: input.line_style as LineStyle | undefined,
        color: input.color as string | undefined,
        description: input.description as string | undefined,
      });

    case 'delete_relation_type':
      return { success: core.deleteRelationType(input.relation_type_id as string), id: input.relation_type_id };

    // ── Canvas Type ──
    case 'list_canvas_types': {
      const canvasTypes = core.listCanvasTypes(input.project_id as string);
      return canvasTypes.map((ct) => ({
        ...ct,
        allowed_relation_types: core.listAllowedRelations(ct.id),
      }));
    }

    case 'create_canvas_type': {
      const ct = core.createCanvasType({
        project_id: input.project_id as string,
        name: input.name as string,
        icon: input.icon as string | undefined,
        color: input.color as string | undefined,
        description: input.description as string | undefined,
      });
      const allowedIds = input.allowed_relation_type_ids as string[] | undefined;
      if (allowedIds && allowedIds.length > 0) {
        for (const rtId of allowedIds) {
          core.addAllowedRelation(ct.id, rtId);
        }
      }
      return { ...ct, allowed_relation_types: core.listAllowedRelations(ct.id) };
    }

    case 'update_canvas_type': {
      const canvasTypeId = input.canvas_type_id as string;
      const updated = core.updateCanvasType(canvasTypeId, {
        name: input.name as string | undefined,
        icon: input.icon as string | undefined,
        color: input.color as string | undefined,
        description: input.description as string | undefined,
      });
      if (!updated) {
        throw new Error(`Canvas type not found: ${canvasTypeId}`);
      }
      const allowedIds = input.allowed_relation_type_ids as string[] | undefined;
      if (allowedIds !== undefined) {
        // Remove existing
        const existing = core.listAllowedRelations(canvasTypeId);
        for (const rel of existing) {
          core.removeAllowedRelationByPair(canvasTypeId, rel.id);
        }
        // Add new
        for (const rtId of allowedIds) {
          core.addAllowedRelation(canvasTypeId, rtId);
        }
      }
      return { ...updated, allowed_relation_types: core.listAllowedRelations(canvasTypeId) };
    }

    case 'delete_canvas_type':
      return { success: core.deleteCanvasType(input.canvas_type_id as string), id: input.canvas_type_id };

    // ── Concept ──
    case 'list_concepts': {
      const query = input.query as string | undefined;
      if (query) {
        return core.searchConcepts(input.project_id as string, query);
      }
      return core.getConceptsByProject(input.project_id as string);
    }

    case 'create_concept':
      return core.createConcept({
        project_id: input.project_id as string,
        title: input.title as string,
        archetype_id: input.archetype_id as string | undefined,
        color: input.color as string | undefined,
        icon: input.icon as string | undefined,
      });

    case 'update_concept': {
      const result = core.updateConcept(input.concept_id as string, {
        title: input.title as string | undefined,
        archetype_id: input.archetype_id as string | undefined,
        color: input.color as string | undefined,
        icon: input.icon as string | undefined,
      });
      if (!result) {
        throw new Error(`Concept not found: ${input.concept_id}`);
      }
      return result;
    }

    case 'delete_concept':
      return { success: core.deleteConcept(input.concept_id as string), id: input.concept_id };

    // ── Project ──
    case 'get_project_summary': {
      const projectId = input.project_id as string;
      const project = core.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
      const archetypes = core.listArchetypes(projectId);
      const relationTypes = core.listRelationTypes(projectId);
      const canvasTypes = core.listCanvasTypes(projectId);
      const concepts = core.getConceptsByProject(projectId);
      const canvases = core.listCanvases(projectId);
      return {
        project: { id: project.id, name: project.name, root_dir: project.root_dir },
        archetypes: {
          count: archetypes.length,
          items: archetypes.map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color })),
        },
        relation_types: {
          count: relationTypes.length,
          items: relationTypes.map((r) => ({ id: r.id, name: r.name, directed: r.directed, line_style: r.line_style })),
        },
        canvas_types: {
          count: canvasTypes.length,
          items: canvasTypes.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
        },
        concepts: {
          count: concepts.length,
          items: concepts.map((c) => ({ id: c.id, title: c.title, archetype_id: c.archetype_id })),
        },
        canvases: {
          count: canvases.length,
          items: canvases.map((c) => ({ id: c.id, name: c.name, concept_id: c.concept_id })),
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
