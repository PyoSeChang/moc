import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import type {
  Canvas, CanvasCreate, CanvasUpdate,
  CanvasNode, CanvasNodeCreate, CanvasNodeUpdate,
  Edge, EdgeCreate,
  Concept,
} from '@moc/shared/types';

// ── Canvas ──

export function createCanvas(data: CanvasCreate): Canvas {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO canvases (id, project_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, data.project_id, data.name, now, now);

  return db.prepare('SELECT * FROM canvases WHERE id = ?').get(id) as Canvas;
}

export function listCanvases(projectId: string): Canvas[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM canvases WHERE project_id = ? ORDER BY created_at')
    .all(projectId) as Canvas[];
}

export function updateCanvas(id: string, data: CanvasUpdate): Canvas | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM canvases WHERE id = ?').get(id) as Canvas | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE canvases SET name = ?, viewport_x = ?, viewport_y = ?, viewport_zoom = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.name !== undefined ? data.name : existing.name,
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
  nodes: (CanvasNode & { concept: Concept })[];
  edges: Edge[];
}

export function getCanvasFull(canvasId: string): CanvasFullData | undefined {
  const db = getDatabase();
  const canvas = db.prepare('SELECT * FROM canvases WHERE id = ?').get(canvasId) as Canvas | undefined;
  if (!canvas) return undefined;

  const nodes = db.prepare(
    `SELECT cn.*, c.title, c.color, c.icon, c.project_id as concept_project_id,
            c.created_at as concept_created_at, c.updated_at as concept_updated_at
     FROM canvas_nodes cn
     JOIN concepts c ON cn.concept_id = c.id
     WHERE cn.canvas_id = ?`,
  ).all(canvasId) as (Record<string, unknown>)[];

  const parsedNodes = nodes.map((row) => ({
    id: row.id as string,
    canvas_id: row.canvas_id as string,
    concept_id: row.concept_id as string,
    position_x: row.position_x as number,
    position_y: row.position_y as number,
    width: row.width as number | null,
    height: row.height as number | null,
    concept: {
      id: row.concept_id as string,
      project_id: row.concept_project_id as string,
      title: row.title as string,
      color: row.color as string | null,
      icon: row.icon as string | null,
      created_at: row.concept_created_at as string,
      updated_at: row.concept_updated_at as string,
    },
  }));

  const edges = db
    .prepare('SELECT * FROM edges WHERE canvas_id = ?')
    .all(canvasId) as Edge[];

  return { canvas, nodes: parsedNodes, edges };
}

// ── Canvas Node ──

export function addCanvasNode(data: CanvasNodeCreate): CanvasNode {
  const db = getDatabase();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO canvas_nodes (id, canvas_id, concept_id, position_x, position_y, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, data.canvas_id, data.concept_id, data.position_x, data.position_y, data.width ?? null, data.height ?? null);

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
    `INSERT INTO edges (id, canvas_id, source_node_id, target_node_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, data.canvas_id, data.source_node_id, data.target_node_id, now);

  return db.prepare('SELECT * FROM edges WHERE id = ?').get(id) as Edge;
}

export function deleteEdge(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM edges WHERE id = ?').run(id);
  return result.changes > 0;
}
