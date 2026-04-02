import { spawn, type ChildProcess } from 'child_process';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  initDatabase,
  closeDatabase,
  getDatabase,
  createProject,
  createArchetype,
  createRelationType,
  createCanvasType,
  createConcept,
} from '@netior/core';
import type { LineStyle } from '@netior/shared/types';
import type { SeedConfig } from './types.js';

const APPDATA = process.env.APPDATA || process.env.HOME || '.';
const EVAL_DB_PATH = join(APPDATA, 'netior', 'data', 'netior-eval.db');
const EVAL_DATA_DIR = join(APPDATA, 'netior', 'data', 'eval');
const HEALTH_CHECK_TIMEOUT = 15_000;
const HEALTH_CHECK_INTERVAL = 500;

let narreProcess: ChildProcess | null = null;
let seededProjectId: string | null = null;

export function getEvalDbPath(): string {
  return EVAL_DB_PATH;
}

export function getSeededProjectId(): string {
  if (!seededProjectId) throw new Error('No project seeded. Call setupDb() first.');
  return seededProjectId;
}

export function setupDb(seed: SeedConfig): string {
  // Delete existing eval DB for clean slate
  if (existsSync(EVAL_DB_PATH)) {
    unlinkSync(EVAL_DB_PATH);
  }

  mkdirSync(join(APPDATA, 'netior', 'data'), { recursive: true });
  mkdirSync(EVAL_DATA_DIR, { recursive: true });

  initDatabase(EVAL_DB_PATH);

  // Seed project
  const project = createProject({
    name: seed.project.name,
    root_dir: seed.project.root_dir,
  });
  seededProjectId = project.id;

  // Seed archetypes
  const archetypeMap = new Map<string, string>(); // name → id
  if (seed.archetypes) {
    for (const a of seed.archetypes) {
      const created = createArchetype({
        project_id: project.id,
        name: a.name,
        icon: a.icon,
        color: a.color,
        node_shape: a.node_shape,
      });
      archetypeMap.set(a.name, created.id);
    }
  }

  // Seed relation types
  if (seed.relation_types) {
    for (const r of seed.relation_types) {
      createRelationType({
        project_id: project.id,
        name: r.name,
        directed: r.directed ?? false,
        line_style: (r.line_style ?? 'solid') as LineStyle,
        color: r.color,
      });
    }
  }

  // Seed canvas types
  if (seed.canvas_types) {
    for (const c of seed.canvas_types) {
      createCanvasType({
        project_id: project.id,
        name: c.name,
        description: c.description,
      });
    }
  }

  // Seed concepts
  if (seed.concepts) {
    for (const c of seed.concepts) {
      const archetypeId = c.archetype_name ? archetypeMap.get(c.archetype_name) : undefined;
      createConcept({
        project_id: project.id,
        title: c.title,
        archetype_id: archetypeId,
        color: c.color,
        icon: c.icon,
      });
    }
  }

  return project.id;
}

export function teardownDb(): void {
  closeDatabase();
  seededProjectId = null;
}

export async function startNarreServer(port: number): Promise<void> {
  if (narreProcess) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const serverPath = resolveNarreServerPath();
  if (!serverPath) {
    throw new Error('Could not find narre-server. Run: pnpm --filter @netior/narre-server build');
  }

  narreProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(port),
      MOC_DB_PATH: EVAL_DB_PATH,
      MOC_DATA_DIR: EVAL_DATA_DIR,
      ANTHROPIC_API_KEY: apiKey,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  narreProcess.stdout?.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.log(`  [narre-server] ${line}`);
  });

  narreProcess.stderr?.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.error(`  [narre-server:err] ${line}`);
  });

  await waitForHealth(port);
}

export function stopNarreServer(): void {
  if (narreProcess) {
    narreProcess.kill();
    narreProcess = null;
  }
}

async function waitForHealth(port: number): Promise<void> {
  const start = Date.now();
  const url = `http://localhost:${port}/health`;

  while (Date.now() - start < HEALTH_CHECK_TIMEOUT) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL));
  }

  throw new Error(`narre-server health check timed out after ${HEALTH_CHECK_TIMEOUT}ms`);
}

function resolveNarreServerPath(): string | null {
  const candidates = [
    join(process.cwd(), 'packages/narre-server/dist/index.js'),
    join(process.cwd(), '../narre-server/dist/index.js'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
