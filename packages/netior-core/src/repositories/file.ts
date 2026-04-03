import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import type { FileEntity, FileEntityCreate, FileEntityUpdate } from '@netior/shared/types';

export function createFileEntity(data: FileEntityCreate): FileEntity {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO files (id, project_id, path, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, data.project_id, data.path, data.type, now, now);

  return db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileEntity;
}

export function getFileEntity(id: string): FileEntity | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileEntity | undefined;
}

export function getFileEntityByPath(projectId: string, path: string): FileEntity | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM files WHERE project_id = ? AND path = ?').get(projectId, path) as FileEntity | undefined;
}

export function getFileEntitiesByProject(projectId: string): FileEntity[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY type, path').all(projectId) as FileEntity[];
}

export function updateFileEntity(id: string, data: FileEntityUpdate): FileEntity | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileEntity | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE files SET metadata = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.metadata !== undefined ? data.metadata : existing.metadata,
    now,
    id,
  );

  return db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileEntity;
}

export function deleteFileEntity(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM files WHERE id = ?').run(id);
  return result.changes > 0;
}
