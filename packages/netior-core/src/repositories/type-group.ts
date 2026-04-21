import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import { createObject, deleteObjectByRef } from './objects';
import { syncProjectOntologyForDb } from './system-networks';
import type { TypeGroup, TypeGroupCreate, TypeGroupUpdate, TypeGroupKind } from '@netior/shared/types';

export function createTypeGroup(data: TypeGroupCreate): TypeGroup {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO type_groups (id, scope, project_id, kind, name, parent_group_id, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.scope ?? 'project',
    data.project_id,
    data.kind,
    data.name,
    data.parent_group_id ?? null,
    data.sort_order ?? 0,
    now,
    now,
  );

  createObject('type_group', data.scope ?? 'project', data.project_id, id);
  if (data.project_id) {
    syncProjectOntologyForDb(db, data.project_id);
  }

  return db.prepare('SELECT * FROM type_groups WHERE id = ?').get(id) as TypeGroup;
}

export function listTypeGroups(projectId: string, kind: TypeGroupKind): TypeGroup[] {
  const db = getDatabase();
  return db.prepare(
    'SELECT * FROM type_groups WHERE project_id = ? AND kind = ? ORDER BY sort_order, created_at',
  ).all(projectId, kind) as TypeGroup[];
}

export function getTypeGroup(id: string): TypeGroup | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM type_groups WHERE id = ?').get(id) as TypeGroup | undefined;
}

export function updateTypeGroup(id: string, data: TypeGroupUpdate): TypeGroup | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM type_groups WHERE id = ?').get(id) as TypeGroup | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();

  db.prepare(
    `UPDATE type_groups SET name = ?, parent_group_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.name !== undefined ? data.name : existing.name,
    data.parent_group_id !== undefined ? data.parent_group_id : existing.parent_group_id,
    data.sort_order !== undefined ? data.sort_order : existing.sort_order,
    now,
    id,
  );

  return db.prepare('SELECT * FROM type_groups WHERE id = ?').get(id) as TypeGroup;
}

export function deleteTypeGroup(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM type_groups WHERE id = ?').run(id);
  if (result.changes > 0) {
    deleteObjectByRef('type_group', id);
    return true;
  }
  return false;
}
