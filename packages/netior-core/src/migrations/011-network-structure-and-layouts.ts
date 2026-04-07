import type Database from 'better-sqlite3';
import { hasColumn, tableExists } from '../connection';

export function migrate011(db: Database.Database): void {
  // ── Recreate networks table: make project_id nullable, add scope/parent_network_id,
  //    remove concept_id/viewport/layout columns ──
  db.exec(`
    CREATE TABLE networks_new (
      id                 TEXT PRIMARY KEY,
      project_id         TEXT REFERENCES projects(id) ON DELETE CASCADE,
      name               TEXT NOT NULL,
      scope              TEXT NOT NULL DEFAULT 'project',
      parent_network_id  TEXT REFERENCES networks_new(id) ON DELETE CASCADE,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    INSERT INTO networks_new (id, project_id, name, scope, parent_network_id, created_at, updated_at)
    SELECT id, project_id, name, 'project', NULL, created_at, updated_at
    FROM networks
  `);

  // Drop indexes that reference old networks table
  db.exec(`DROP INDEX IF EXISTS idx_network_nodes_concept`);

  // Update foreign key references: network_nodes, edges reference networks
  // SQLite doesn't enforce FK on existing data during ALTER, but we need to
  // drop and recreate to maintain referential integrity
  db.exec(`DROP TABLE IF EXISTS edges`);
  db.exec(`DROP TABLE IF EXISTS network_nodes`);
  db.exec(`DROP TABLE networks`);
  db.exec(`ALTER TABLE networks_new RENAME TO networks`);

  // ── Recreate network_nodes without position columns ──
  db.exec(`
    CREATE TABLE network_nodes (
      id          TEXT PRIMARY KEY,
      network_id  TEXT NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
      concept_id  TEXT REFERENCES concepts(id) ON DELETE CASCADE,
      file_id     TEXT REFERENCES files(id) ON DELETE CASCADE,
      metadata    TEXT
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX idx_network_nodes_concept
      ON network_nodes(network_id, concept_id) WHERE concept_id IS NOT NULL
  `);

  // ── Recreate edges without visual columns ──
  db.exec(`
    CREATE TABLE edges (
      id               TEXT PRIMARY KEY,
      network_id       TEXT NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
      source_node_id   TEXT NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
      target_node_id   TEXT NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
      relation_type_id TEXT REFERENCES relation_types(id) ON DELETE SET NULL,
      description      TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── layouts table ──
  if (!tableExists(db, 'layouts')) {
    db.exec(`
      CREATE TABLE layouts (
        id                TEXT PRIMARY KEY,
        layout_type       TEXT NOT NULL DEFAULT 'freeform',
        layout_config_json TEXT,
        viewport_json     TEXT,
        network_id        TEXT UNIQUE,
        context_id        TEXT UNIQUE,
        created_at        TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE,
        CHECK ((network_id IS NOT NULL AND context_id IS NULL) OR (network_id IS NULL AND context_id IS NOT NULL))
      )
    `);
  }

  // ── layout_nodes table ──
  if (!tableExists(db, 'layout_nodes')) {
    db.exec(`
      CREATE TABLE layout_nodes (
        id            TEXT PRIMARY KEY,
        layout_id     TEXT NOT NULL,
        node_id       TEXT NOT NULL,
        position_json TEXT NOT NULL,
        FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE CASCADE,
        FOREIGN KEY (node_id) REFERENCES network_nodes(id) ON DELETE CASCADE,
        UNIQUE(layout_id, node_id)
      )
    `);
  }

  // ── layout_edges table ──
  if (!tableExists(db, 'layout_edges')) {
    db.exec(`
      CREATE TABLE layout_edges (
        id          TEXT PRIMARY KEY,
        layout_id   TEXT NOT NULL,
        edge_id     TEXT NOT NULL,
        visual_json TEXT NOT NULL,
        FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE CASCADE,
        FOREIGN KEY (edge_id) REFERENCES edges(id) ON DELETE CASCADE,
        UNIQUE(layout_id, edge_id)
      )
    `);
  }
}
