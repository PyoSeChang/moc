import type Database from 'better-sqlite3';

export function migrate024(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS slot_semantic_aspects (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL REFERENCES archetype_fields(id) ON DELETE CASCADE,
      aspect_key TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      strength REAL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(field_id, aspect_key)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_slot_semantic_aspects_field
      ON slot_semantic_aspects(field_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_slot_semantic_aspects_aspect
      ON slot_semantic_aspects(aspect_key)
  `);

  db.exec(`
    INSERT OR IGNORE INTO slot_semantic_aspects (id, field_id, aspect_key, source, sort_order)
    SELECT 'slot-aspect-' || id || '-' || replace(semantic_annotation, '.', '_'),
           id,
           semantic_annotation,
           'migration',
           0
      FROM archetype_fields
     WHERE semantic_annotation IS NOT NULL
       AND semantic_annotation <> ''
  `);

  const derivedAspects: Array<{ annotation: string; aspect: string; order: number }> = [
    { annotation: 'time.start', aspect: 'temporal.point', order: 10 },
    { annotation: 'time.start', aspect: 'temporal.boundary.start', order: 11 },
    { annotation: 'time.end', aspect: 'temporal.point', order: 10 },
    { annotation: 'time.end', aspect: 'temporal.boundary.end', order: 11 },
    { annotation: 'time.due', aspect: 'temporal.point', order: 10 },
    { annotation: 'time.due', aspect: 'temporal.deadline', order: 11 },
    { annotation: 'time.due', aspect: 'obligation.due', order: 12 },
    { annotation: 'time.due', aspect: 'boundary.deadline', order: 13 },
    { annotation: 'time.due', aspect: 'consequence.trigger', order: 14 },
    { annotation: 'time.recurrence_until', aspect: 'temporal.boundary.end', order: 10 },
    { annotation: 'workflow.completed_at', aspect: 'temporal.point', order: 10 },
    { annotation: 'workflow.completed_at', aspect: 'workflow.completion', order: 11 },
    { annotation: 'structure.parent', aspect: 'relation.parent', order: 10 },
    { annotation: 'structure.parent', aspect: 'structure.hierarchy', order: 11 },
    { annotation: 'knowledge.source_url', aspect: 'provenance.source', order: 10 },
    { annotation: 'knowledge.source_ref', aspect: 'provenance.source', order: 10 },
    { annotation: 'knowledge.source_ref', aspect: 'relation.citation', order: 11 },
    { annotation: 'knowledge.citation', aspect: 'provenance.source', order: 10 },
    { annotation: 'governance.owner', aspect: 'responsibility.accountable_agent', order: 10 },
    { annotation: 'governance.approved_by', aspect: 'authority.approver', order: 10 },
    { annotation: 'governance.approved_at', aspect: 'temporal.point', order: 10 },
    { annotation: 'governance.approved_at', aspect: 'governance.approval_event', order: 11 },
  ];

  const insertDerived = db.prepare(`
    INSERT OR IGNORE INTO slot_semantic_aspects (id, field_id, aspect_key, source, sort_order)
    SELECT 'slot-aspect-' || id || '-' || replace(?, '.', '_'),
           id,
           ?,
           'migration',
           ?
      FROM archetype_fields
     WHERE semantic_annotation = ?
  `);

  for (const item of derivedAspects) {
    insertDerived.run(item.aspect, item.aspect, item.order, item.annotation);
  }
}
