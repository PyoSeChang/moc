import { randomUUID } from 'crypto';
import { getDatabase } from '../connection';
import type { Module, ModuleCreate, ModuleUpdate, ModuleDirectory, ModuleDirectoryCreate } from '@netior/shared/types';

// ── Module ──

export function createModule(data: ModuleCreate): Module {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO modules (id, project_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, data.project_id, data.name, now, now);

  return db.prepare('SELECT * FROM modules WHERE id = ?').get(id) as Module;
}

export function listModules(projectId: string): Module[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM modules WHERE project_id = ? ORDER BY created_at')
    .all(projectId) as Module[];
}

export function updateModule(id: string, data: ModuleUpdate): Module | undefined {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM modules WHERE id = ?').get(id) as Module | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE modules SET name = ?, updated_at = ? WHERE id = ?`,
  ).run(
    data.name !== undefined ? data.name : existing.name,
    now,
    id,
  );

  return db.prepare('SELECT * FROM modules WHERE id = ?').get(id) as Module;
}

export function deleteModule(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM modules WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Module Directory ──

export function addModuleDirectory(data: ModuleDirectoryCreate): ModuleDirectory {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO module_directories (id, module_id, dir_path, created_at) VALUES (?, ?, ?, ?)`,
  ).run(id, data.module_id, data.dir_path, now);

  return db.prepare('SELECT * FROM module_directories WHERE id = ?').get(id) as ModuleDirectory;
}

export function listModuleDirectories(moduleId: string): ModuleDirectory[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM module_directories WHERE module_id = ? ORDER BY created_at')
    .all(moduleId) as ModuleDirectory[];
}

export function updateModuleDirectoryPath(id: string, dirPath: string): ModuleDirectory {
  const db = getDatabase();
  db.prepare('UPDATE module_directories SET dir_path = ? WHERE id = ?').run(dirPath, id);
  return db.prepare('SELECT * FROM module_directories WHERE id = ?').get(id) as ModuleDirectory;
}

export function removeModuleDirectory(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM module_directories WHERE id = ?').run(id);
  return result.changes > 0;
}
