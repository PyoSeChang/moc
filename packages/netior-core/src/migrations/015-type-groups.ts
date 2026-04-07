import type Database from 'better-sqlite3';

export function migrate015(db: Database.Database): void {
  db.exec(`
    CREATE TABLE type_groups (
      id              TEXT PRIMARY KEY,
      scope           TEXT NOT NULL DEFAULT 'project',
      project_id      TEXT,
      kind            TEXT NOT NULL,
      name            TEXT NOT NULL,
      parent_group_id TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_group_id) REFERENCES type_groups(id) ON DELETE CASCADE
    )
  `);

  db.exec(`ALTER TABLE archetypes ADD COLUMN group_id TEXT REFERENCES type_groups(id) ON DELETE SET NULL`);
  db.exec(`ALTER TABLE relation_types ADD COLUMN group_id TEXT REFERENCES type_groups(id) ON DELETE SET NULL`);
}
