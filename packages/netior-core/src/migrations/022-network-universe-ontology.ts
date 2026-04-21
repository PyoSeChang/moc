import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  return columns.some((entry) => entry.name === column);
}

export function migrate022(db: Database.Database): void {
  if (!hasColumn(db, 'networks', 'kind')) {
    db.exec(`ALTER TABLE networks ADD COLUMN kind TEXT NOT NULL DEFAULT 'network'`);
  }

  db.exec(`
    UPDATE networks
       SET kind = 'universe',
           name = 'Universe',
           scope = 'app',
           parent_network_id = NULL
     WHERE scope = 'app'
       AND parent_network_id IS NULL
  `);

  db.exec(`
    UPDATE networks
       SET kind = 'ontology',
           name = 'Ontology',
           parent_network_id = NULL
     WHERE scope = 'project'
       AND parent_network_id IN (SELECT id FROM networks WHERE kind = 'universe')
       AND NOT EXISTS (SELECT 1 FROM network_nodes nn WHERE nn.network_id = networks.id)
       AND NOT EXISTS (SELECT 1 FROM edges e WHERE e.network_id = networks.id)
  `);

  db.exec(`
    UPDATE networks
       SET parent_network_id = NULL
     WHERE kind = 'network'
       AND parent_network_id IN (
         SELECT id FROM networks WHERE kind IN ('universe', 'ontology')
       )
  `);

  db.exec(`
    INSERT INTO objects (id, object_type, scope, project_id, ref_id, created_at)
    SELECT 'object-type-group-' || tg.id, 'type_group', tg.scope, tg.project_id, tg.id, tg.created_at
      FROM type_groups tg
     WHERE NOT EXISTS (
       SELECT 1 FROM objects o WHERE o.object_type = 'type_group' AND o.ref_id = tg.id
     )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_networks_kind ON networks(kind)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_networks_project_kind ON networks(project_id, kind)`);
}
