import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  return columns.some((entry) => entry.name === column);
}

export function migrate019(db: Database.Database): void {
  if (!hasColumn(db, 'modules', 'path')) {
    db.exec('ALTER TABLE modules ADD COLUMN path TEXT');
  }

  db.exec(`
    UPDATE modules
       SET path = COALESCE(
         path,
         (
           SELECT md.dir_path
             FROM module_directories md
            WHERE md.module_id = modules.id
            ORDER BY md.created_at
            LIMIT 1
         ),
         (
           SELECT p.root_dir
             FROM projects p
            WHERE p.id = modules.project_id
         )
       )
     WHERE path IS NULL OR path = ''
  `);
}
