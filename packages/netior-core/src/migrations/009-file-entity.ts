import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';

export function migrate009(db: Database.Database): void {
  // 1. Create files table
  db.exec(`
    CREATE TABLE files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, path)
    )
  `);

  // 2. Migrate existing canvas_nodes file_path/dir_path → files records
  const rows = db
    .prepare(
      `SELECT DISTINCT c.project_id, cn.file_path, cn.dir_path
       FROM canvas_nodes cn
       JOIN canvases c ON c.id = cn.canvas_id
       WHERE cn.file_path IS NOT NULL OR cn.dir_path IS NOT NULL`,
    )
    .all() as { project_id: string; file_path: string | null; dir_path: string | null }[];

  const insertFile = db.prepare(
    `INSERT OR IGNORE INTO files (id, project_id, path, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
  );

  for (const row of rows) {
    const path = row.file_path ?? row.dir_path;
    const type = row.file_path ? 'file' : 'directory';
    if (path) {
      insertFile.run(randomUUID(), row.project_id, path, type);
    }
  }

  // 3. Reconstruct canvas_nodes table (drop file_path/dir_path, add file_id/metadata)
  db.exec(`
    CREATE TABLE canvas_nodes_new (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
      concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
      file_id TEXT REFERENCES files(id) ON DELETE CASCADE,
      metadata TEXT,
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      width REAL,
      height REAL
    )
  `);

  // 4. Migrate data: map file_path/dir_path → file_id
  db.exec(`
    INSERT INTO canvas_nodes_new (id, canvas_id, concept_id, file_id, position_x, position_y, width, height)
      SELECT
        cn.id,
        cn.canvas_id,
        cn.concept_id,
        f.id,
        cn.position_x,
        cn.position_y,
        cn.width,
        cn.height
      FROM canvas_nodes cn
      LEFT JOIN canvases c ON c.id = cn.canvas_id
      LEFT JOIN files f ON f.project_id = c.project_id
        AND f.path = COALESCE(cn.file_path, cn.dir_path)
  `);

  db.exec(`DROP TABLE canvas_nodes`);
  db.exec(`ALTER TABLE canvas_nodes_new RENAME TO canvas_nodes`);

  // Recreate unique index for concept nodes
  db.exec(`
    CREATE UNIQUE INDEX idx_canvas_nodes_concept
      ON canvas_nodes(canvas_id, concept_id) WHERE concept_id IS NOT NULL
  `);

  // 5. Drop concept_files table
  db.exec(`DROP TABLE IF EXISTS concept_files`);
}
