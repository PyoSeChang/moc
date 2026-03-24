import { app } from 'electron';
import { join } from 'path';
import { mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { migrate001 } from './migrations/001-initial';

let db: Database.Database | null = null;

interface Migration {
  version: number;
  migrate: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  { version: 1, migrate: migrate001 },
];

export function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

export function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { name: string } | undefined;
  return !!row;
}

export async function initDatabase(): Promise<void> {
  const dbDir = join(app.getPath('userData'), 'data');
  mkdirSync(dbDir, { recursive: true });

  const dbPath = join(dbDir, 'moc.db');
  db = new Database(dbPath);

  // Enable WAL mode and foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  // Run pending migrations
  const applied = new Set(
    (db.prepare('SELECT version FROM _migrations').all() as { version: number }[])
      .map((r) => r.version),
  );

  for (const m of migrations) {
    if (!applied.has(m.version)) {
      db.pragma('foreign_keys = OFF');
      db.transaction(() => {
        m.migrate(db!);
        db!.prepare('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)').run(
          m.version,
          new Date().toISOString(),
        );
      })();
      db.pragma('foreign_keys = ON');
    }
  }
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
