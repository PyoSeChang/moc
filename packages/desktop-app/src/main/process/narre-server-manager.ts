import { spawn, type ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

let narreProcess: ChildProcess | null = null;

function resolveNarreServerPath(): string | null {
  const candidates = [
    join(__dirname, '../../../../narre-server/dist/index.js'),
    join(__dirname, '../../../narre-server/dist/index.js'),
    join(process.cwd(), 'packages/narre-server/dist/index.js'),
  ];

  console.log('[narre-server] __dirname:', __dirname);
  console.log('[narre-server] cwd:', process.cwd());
  console.log('[narre-server] Checking paths:');
  for (const p of candidates) {
    const found = existsSync(p);
    console.log(`[narre-server]   ${found ? '✓' : '✗'} ${p}`);
    if (found) return p;
  }

  try {
    const resolved = require.resolve('@netior/narre-server/dist/index.js');
    console.log(`[narre-server]   ✓ require.resolve: ${resolved}`);
    return resolved;
  } catch (err) {
    console.log(`[narre-server]   ✗ require.resolve failed: ${(err as Error).message}`);
    return null;
  }
}

export function startNarreServer(config: {
  apiKey: string;
  dbPath: string;
  dataDir: string;
  port?: number;
}): void {
  if (narreProcess) {
    console.log('[narre-server] Already running, skipping start');
    return;
  }

  const modulePath = resolveNarreServerPath();
  if (!modulePath) {
    console.error('[narre-server] ✗ Could not resolve module path! Run: pnpm --filter @netior/narre-server build');
    return;
  }

  const port = config.port ?? 3100;
  console.log(`[narre-server] Starting: ${modulePath}`);
  console.log(`[narre-server] DB: ${config.dbPath}`);
  console.log(`[narre-server] Data: ${config.dataDir}`);
  console.log(`[narre-server] Port: ${port}`);
  console.log(`[narre-server] API key: ${config.apiKey ? '***set***' : '(empty, will use OAuth)'}`);

  narreProcess = spawn(process.execPath, [modulePath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NETIOR_ELECTRON_PATH: process.execPath,
      ANTHROPIC_API_KEY: config.apiKey,
      MOC_DB_PATH: config.dbPath,
      MOC_DATA_DIR: config.dataDir,
      PORT: String(port),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  console.log(`[narre-server] Spawned PID: ${narreProcess.pid}`);

  narreProcess.stdout?.on('data', (data: Buffer) => {
    console.log('[narre-server:stdout]', data.toString().trim());
  });

  narreProcess.stderr?.on('data', (data: Buffer) => {
    console.error('[narre-server:stderr]', data.toString().trim());
  });

  narreProcess.on('exit', (code, signal) => {
    console.log(`[narre-server] Exited: code=${code}, signal=${signal}`);
    narreProcess = null;
  });

  narreProcess.on('error', (err) => {
    console.error('[narre-server] Spawn error:', err.message);
    narreProcess = null;
  });
}

export function stopNarreServer(): void {
  if (narreProcess) {
    console.log('[narre-server] Stopping...');
    narreProcess.kill();
    narreProcess = null;
  }
}

export function isNarreServerRunning(): boolean {
  return narreProcess !== null;
}
