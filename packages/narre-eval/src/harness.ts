import { spawn, type ChildProcess } from 'child_process';
import { existsSync, unlinkSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import {
  initDatabase,
  closeDatabase,
  createProject,
  createArchetype,
  createRelationType,
  createCanvasType,
  createConcept,
  createModule,
  addModuleDirectory,
} from '@netior/core';
import type { SeedContext } from './types.js';

const APPDATA = process.env.APPDATA || process.env.HOME || '.';
const EVAL_DB_PATH = join(APPDATA, 'netior', 'data', 'netior-eval.db');
const EVAL_DATA_DIR = join(APPDATA, 'netior', 'data', 'eval');
const HEALTH_CHECK_TIMEOUT = 15_000;
const HEALTH_CHECK_INTERVAL = 500;

let narreProcess: ChildProcess | null = null;

export function getEvalDbPath(): string {
  return EVAL_DB_PATH;
}

export interface SetupResult {
  projectId: string;
  tempDir: string;
}

export async function setupScenario(
  scenarioDir: string,
  seedFn: (ctx: SeedContext) => Promise<void>,
): Promise<SetupResult> {
  // Clean slate: delete existing eval DB
  if (existsSync(EVAL_DB_PATH)) {
    unlinkSync(EVAL_DB_PATH);
  }

  mkdirSync(join(APPDATA, 'netior', 'data'), { recursive: true });
  mkdirSync(EVAL_DATA_DIR, { recursive: true });

  // Create temp directory for scenario files
  const tempDir = join(tmpdir(), `narre-eval-${randomUUID().slice(0, 8)}`);
  mkdirSync(tempDir, { recursive: true });

  initDatabase(EVAL_DB_PATH);

  // Build SeedContext
  let projectId: string | null = null;

  const ctx: SeedContext = {
    tempDir,
    scenarioDir,
    createProject(data) {
      const project = createProject({ ...data, root_dir: data.root_dir || tempDir });
      projectId = project.id;
      return project;
    },
    createArchetype(data) {
      return createArchetype(data);
    },
    createRelationType(data) {
      return createRelationType(data);
    },
    createCanvasType(data) {
      return createCanvasType(data);
    },
    createConcept(data) {
      return createConcept(data);
    },
    createModule(data) {
      return createModule(data);
    },
    addModuleDirectory(data) {
      return addModuleDirectory(data);
    },
    async copyFixtures() {
      const fixturesDir = join(scenarioDir, 'fixtures');
      if (!existsSync(fixturesDir)) {
        throw new Error(`fixtures/ directory not found in ${scenarioDir}`);
      }
      cpSync(fixturesDir, tempDir, { recursive: true });
    },
  };

  await seedFn(ctx);

  if (!projectId) {
    throw new Error('seed function must call ctx.createProject()');
  }

  return { projectId, tempDir };
}

export function teardownScenario(tempDir: string): void {
  closeDatabase();
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// ── Narre Server Management ──

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
