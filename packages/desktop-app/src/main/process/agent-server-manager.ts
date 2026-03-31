import { spawn, type ChildProcess } from 'child_process';

let agentProcess: ChildProcess | null = null;

export function startAgentServer(config: {
  apiKey: string;
  dbPath: string;
  dataDir: string;
  port?: number;
}): void {
  if (agentProcess) return; // already running

  try {
    const modulePath = require.resolve('@moc/agent-server/dist/index.js');

    agentProcess = spawn('node', [modulePath], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: config.apiKey,
        MOC_DB_PATH: config.dbPath,
        MOC_DATA_DIR: config.dataDir,
        PORT: String(config.port ?? 3100),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    agentProcess.stdout?.on('data', (data: Buffer) => {
      console.log('[agent-server]', data.toString().trim());
    });

    agentProcess.stderr?.on('data', (data: Buffer) => {
      console.error('[agent-server]', data.toString().trim());
    });

    agentProcess.on('exit', (code) => {
      console.log(`[agent-server] exited with code ${code}`);
      agentProcess = null;
    });

    agentProcess.on('error', (err) => {
      console.error('[agent-server] spawn error:', err.message);
      agentProcess = null;
    });
  } catch (err) {
    console.error('[agent-server] Failed to resolve module:', (err as Error).message);
  }
}

export function stopAgentServer(): void {
  if (agentProcess) {
    agentProcess.kill();
    agentProcess = null;
  }
}

export function isAgentServerRunning(): boolean {
  return agentProcess !== null;
}
