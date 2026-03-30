import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import type {
  Canvas, CanvasCreate, CanvasUpdate,
  CanvasNode, CanvasNodeCreate, CanvasNodeUpdate,
  Edge, EdgeCreate, EdgeUpdate,
  Concept,
  RelationType,
  CanvasBreadcrumbItem,
} from '@moc/shared/types';

// ── Canvas ──

export function createCanvas(data: CanvasCreate): Canvas {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO canvases (id, project_id, name, concept_id, canvas_type_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, data.project_id, data.name, data.concept_id ?? null, data.canvas_type_id ?? null, now, now);

  return db.prepare('SELECT * FROM canvases WHERE id = ?').get(id) as Canvas;
}

export function listCanvases(projectId: string, rootOnly = false): Canvas[] {
  const db = getDatabase();
  const sql = rootOnly
    ? 'SELECT * FROM canvases WHERE project_id = ? AND concept_id IS NULL ORDER BY created_at'
    : 'SELECT * FROM canvases WHERE project_id = ? ORDER BY created_at';
  return db.prepare(sql).all(projectId) as Canvas[];
}

export interface CanvasTreeNode {
  canvas: Canvas;
  conceptTitle: string | null;
  children: CanvasTreeNode[];
}

export function getCanvasTree(projectId: string): CanvasTreeNode[] {
  const db = getDatabase();

  // All canvases for this project
  const allCanvases = db.prepare('SELECT * FROM canvases WHERE project_id = ? ORDER BY created_at')
    .all(projectId) as Canvas[];

  // All canvas_nodes: which concept is placed in which canvas
  const nodeRows = db.prepare(
    `SELECT cn.canvas_id, cn.concept_id, c.title as concept_title
     FROM canvas_nodes cn
     JOIN concepts c ON cn.concept_id = c.id
     WHERE cn.concept_id IS NOT NULL
       AND cn.canvas_id IN (SELECT id FROM canvases WHERE project_id = ?)`,
  ).all(projectId) as { canvas_id: string; concept_id: string; concept_title: string }[];

  // Map: concept_id → which canvas it's placed in (parent canvas)
  const conceptToParentCanvas = new Map<string, string>();
  const conceptTitles = new Map<string, string>();
  for (const row of nodeRows) {
    conceptToParentCanvas.set(row.concept_id, row.canvas_id);
    conceptTitles.set(row.concept_id, row.concept_title);
  }

  // Map: canvas_id → Canvas
  const canvasMap = new Map(allCanvases.map((c) => [c.id, c]));

  // Group canvases by their parent canvas
  // A canvas's parent = the canvas that contains its concept_id as a node
  const childrenOf = new Map<string, CanvasTreeNode[]>(); // parent_canvas_id → children
  const roots: CanvasTreeNode[] = [];

  for (const canvas of allCanvases) {
    const node: CanvasTreeNode = {
      canvas,
      conceptTitle: canvas.concept_id ? (conceptTitles.get(canvas.concept_id) ?? null) : null,
      children: [],
    };

    if (!canvas.concept_id) {
      // Root canvas
      roots.push(node);
    } else {
      const parentCanvasId = conceptToParentCanvas.get(canvas.concept_id);
      if (parentCanvasId) {
        const siblings = childrenOf.get(parentCanvasId) ?? [];
        siblings.push(node);
        childrenOf.set(parentCanvasId, siblings);
      } else {
        // Concept exists but isn't placed on any canvas — treat as orphan root
        roots.push(node);
      }
    }
  }

  // Recursively attach children
  function attachChildren(nodes: CanvasTreeNode[]): void {
    for (const node of nodes) {
      node.children = childrenOf.get(node.canvas.id) ?? [];
      attachChildren(node.children);
    }
  }
  attachChildren(roots);

  return roots;
}

export function getCanvasesByConceptId(conceptId: string): Canvas[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM canvases WHERE concept_id = ? ORDER BY created_at')
    .all(conceptId) as Canvas[];
}

export function getCanvasAncestors(canvasId: string): CanvasBreadcrumbItem[] {
  const db = getDatabase();
  const breadcrumbs: CanvasBreadcrumbItem[] = [];
  const visited = new Set<string>();
  let currentId: string | null = canvasId;

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const canvas = db.prepare('SELECT * FROM canvases WHERE id = ?').get(currentId) as Canvas | undefined;
    if (!canvas) break;

    let conceptTitle: string | null = null;
    if (canvas.concept_id) {
      const concept = db.prepare('SELECT title FROM concepts WHERE id = ?').get(canvas.concept_id) as { title: string } | undefined;
      conceptTitle = concept?.title ?? null;
    }

    breadcrumbs.unshift({
      canvasId: canvas.id,
      canvasName: canvas.name,
      conceptTitle,
    });

    if (!canvas.concept_id) break;

    // Find parent canvas: which canvas contains this concept as a node?
    const parentNode = db.prepare(
      'SELECT canvas_id FROM canvas_nodes WHERE concept_id = ? LIMIT 1',
    ).get(canvas.concept_id) as { canvas_id: string } | undefined;

    currentId = parentNode?.canvas_id ?? null;
  }

  return breadcrumbs;
}

export function updateCanvas(id: string, data: CanvasUpdate): Canvas | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM canvases WHERE id = ?').get(id) as Canvas | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE canvases SET name = ?, canvas_type_id = ?, viewport_x = ?, viewport_y = ?, viewport_zoom = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.name !== undefined ? data.name : existing.name,
    data.canvas_type_id !== undefined ? data.canvas_type_id : existing.canvas_type_id,
    data.viewport_x !== undefined ? data.viewport_x : existing.viewport_x,
    data.viewport_y !== undefined ? data.viewport_y : existing.viewport_y,
    data.viewport_zoom !== undefined ? data.viewport_zoom : existing.viewport_zoom,
    now,
    id,
  );

  return db.prepare('SELECT * FROM canvases WHERE id = ?').get(id) as Canvas;
}

export function deleteCanvas(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM canvases WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Canvas Full Data ──

export interface CanvasFullData {
  canvas: Canvas;
  nodes: (CanvasNode & { concept?: Concept; canvas_count: number })[];
  edges: (Edge & { relation_type?: RelationType })[];
}

type RelationTypeRow = Omit<RelationType, 'directed'> & { directed: number };

export function getCanvasFull(canvasId: string): CanvasFullData | undefined {
  const db = getDatabase();
  const canvas = db.prepare('SELECT * FROM canvases WHERE id = ?').get(canvasId) as Canvas | undefined;
  if (!canvas) return undefined;

  const nodes = db.prepare(
    `SELECT cn.*, c.title, c.color, c.icon, c.archetype_id, c.project_id as concept_project_id,
            c.created_at as concept_created_at, c.updated_at as concept_updated_at,
            (SELECT COUNT(*) FROM canvases sub WHERE sub.concept_id = cn.concept_id) as canvas_count
     FROM canvas_nodes cn
     LEFT JOIN concepts c ON cn.concept_id = c.id
     WHERE cn.canvas_id = ?`,
  ).all(canvasId) as (Record<string, unknown>)[];

  const parsedNodes = nodes.map((row) => {
    const hasConcept = row.concept_id != null && row.title != null;
    return {
      id: row.id as string,
      canvas_id: row.canvas_id as string,
      concept_id: (row.concept_id as string | null) ?? null,
      file_path: (row.file_path as string | null) ?? null,
      dir_path: (row.dir_path as string | null) ?? null,
      position_x: row.position_x as number,
      position_y: row.position_y as number,
      width: row.width as number | null,
      height: row.height as number | null,
      ...(hasConcept ? {
        concept: {
          id: row.concept_id as string,
          project_id: row.concept_project_id as string,
          archetype_id: (row.archetype_id as string | null) ?? null,
          title: row.title as string,
          color: row.color as string | null,
          icon: row.icon as string | null,
          content: null,
          agent_content: null,
          created_at: row.concept_created_at as string,
          updated_at: row.concept_updated_at as string,
        },
      } : {}),
      canvas_count: (row.canvas_count as number) ?? 0,
    };
  });

  const edgeRows = db.prepare(
    `SELECT e.*, rt.id as rt_id, rt.project_id as rt_project_id, rt.name as rt_name,
            rt.description as rt_description, rt.color as rt_color,
            rt.line_style as rt_line_style, rt.directed as rt_directed,
            rt.created_at as rt_created_at, rt.updated_at as rt_updated_at
     FROM edges e
     LEFT JOIN relation_types rt ON e.relation_type_id = rt.id
     WHERE e.canvas_id = ?`,
  ).all(canvasId) as (Record<string, unknown>)[];

  const edges = edgeRows.map((row) => {
    const hasRelationType = row.rt_id != null;
    return {
      id: row.id as string,
      canvas_id: row.canvas_id as string,
      source_node_id: row.source_node_id as string,
      target_node_id: row.target_node_id as string,
      relation_type_id: (row.relation_type_id as string | null) ?? null,
      created_at: row.created_at as string,
      ...(hasRelationType ? {
        relation_type: {
          id: row.rt_id as string,
          project_id: row.rt_project_id as string,
          name: row.rt_name as string,
          description: (row.rt_description as string | null) ?? null,
          color: (row.rt_color as string | null) ?? null,
          line_style: row.rt_line_style as string,
          directed: !!(row.rt_directed as number),
          created_at: row.rt_created_at as string,
          updated_at: row.rt_updated_at as string,
        },
      } : {}),
    };
  });

  return { canvas, nodes: parsedNodes, edges };
}

// ── Canvas Node ──

export function addCanvasNode(data: CanvasNodeCreate): CanvasNode {
  const db = getDatabase();
  const id = randomUUID();

  // Validate: exactly one of concept_id, file_path, dir_path must be set
  const setCount = [data.concept_id, data.file_path, data.dir_path].filter(Boolean).length;
  if (setCount !== 1) {
    throw new Error('Exactly one of concept_id, file_path, or dir_path must be provided');
  }

  db.prepare(
    `INSERT INTO canvas_nodes (id, canvas_id, concept_id, file_path, dir_path, position_x, position_y, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, data.canvas_id,
    data.concept_id ?? null, data.file_path ?? null, data.dir_path ?? null,
    data.position_x, data.position_y, data.width ?? null, data.height ?? null,
  );

  return db.prepare('SELECT * FROM canvas_nodes WHERE id = ?').get(id) as CanvasNode;
}

export function updateCanvasNode(id: string, data: CanvasNodeUpdate): CanvasNode | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM canvas_nodes WHERE id = ?').get(id) as CanvasNode | undefined;
  if (!existing) return undefined;

  db.prepare(
    `UPDATE canvas_nodes SET position_x = ?, position_y = ?, width = ?, height = ? WHERE id = ?`,
  ).run(
    data.position_x !== undefined ? data.position_x : existing.position_x,
    data.position_y !== undefined ? data.position_y : existing.position_y,
    data.width !== undefined ? data.width : existing.width,
    data.height !== undefined ? data.height : existing.height,
    id,
  );

  return db.prepare('SELECT * FROM canvas_nodes WHERE id = ?').get(id) as CanvasNode;
}

export function removeCanvasNode(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM canvas_nodes WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Edge ──

export function createEdge(data: EdgeCreate): Edge {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO edges (id, canvas_id, source_node_id, target_node_id, relation_type_id, description, color, line_style, directed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, data.canvas_id, data.source_node_id, data.target_node_id,
    data.relation_type_id ?? null, data.description ?? null,
    data.color ?? null, data.line_style ?? null, data.directed != null ? (data.directed ? 1 : 0) : null,
    now,
  );

  return db.prepare('SELECT * FROM edges WHERE id = ?').get(id) as Edge;
}

export function getEdge(id: string): Edge | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM edges WHERE id = ?').get(id) as Edge | undefined;
}

export function updateEdge(id: string, data: EdgeUpdate): Edge | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM edges WHERE id = ?').get(id) as Edge | undefined;
  if (!existing) return undefined;

  db.prepare('UPDATE edges SET relation_type_id = ?, description = ?, color = ?, line_style = ?, directed = ? WHERE id = ?').run(
    data.relation_type_id !== undefined ? data.relation_type_id : existing.relation_type_id,
    data.description !== undefined ? data.description : existing.description,
    data.color !== undefined ? data.color : existing.color,
    data.line_style !== undefined ? data.line_style : existing.line_style,
    data.directed !== undefined ? (data.directed != null ? (data.directed ? 1 : 0) : null) : existing.directed,
    id,
  );

  return db.prepare('SELECT * FROM edges WHERE id = ?').get(id) as Edge;
}

export function deleteEdge(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM edges WHERE id = ?').run(id);
  return result.changes > 0;
}
