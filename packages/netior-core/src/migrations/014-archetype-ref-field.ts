import type Database from 'better-sqlite3';

export function migrate014(db: Database.Database): void {
  db.exec(`ALTER TABLE archetype_fields ADD COLUMN ref_archetype_id TEXT REFERENCES archetypes(id) ON DELETE SET NULL`);
}
