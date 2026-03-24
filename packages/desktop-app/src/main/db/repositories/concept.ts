import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import type { Concept, ConceptCreate, ConceptUpdate } from '@moc/shared/types';

export function createConcept(data: ConceptCreate): Concept {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO concepts (id, project_id, title, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, data.project_id, data.title, data.color ?? null, data.icon ?? null, now, now);

  return db.prepare('SELECT * FROM concepts WHERE id = ?').get(id) as Concept;
}

export function getConceptsByProject(projectId: string): Concept[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM concepts WHERE project_id = ? ORDER BY created_at')
    .all(projectId) as Concept[];
}

export function updateConcept(id: string, data: ConceptUpdate): Concept | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM concepts WHERE id = ?').get(id) as Concept | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE concepts SET title = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.title !== undefined ? data.title : existing.title,
    data.color !== undefined ? data.color : existing.color,
    data.icon !== undefined ? data.icon : existing.icon,
    now,
    id,
  );

  return db.prepare('SELECT * FROM concepts WHERE id = ?').get(id) as Concept;
}

export function deleteConcept(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM concepts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function searchConcepts(projectId: string, query: string): Concept[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM concepts WHERE project_id = ? AND title LIKE ? ORDER BY title')
    .all(projectId, `%${query}%`) as Concept[];
}
