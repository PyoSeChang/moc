import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

export function migrate017(db: Database.Database): void {
  if (!hasColumn(db, 'edges', 'system_contract')) {
    db.exec(`ALTER TABLE edges ADD COLUMN system_contract TEXT`);
  }

  db.exec(`UPDATE network_nodes SET node_type = 'group' WHERE node_type = 'box'`);
}
