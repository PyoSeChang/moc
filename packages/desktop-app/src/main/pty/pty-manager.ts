import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@moc/shared/constants';

class PtyManager {
  private registry = new Map<string, IPty>();
  private mainWindow: BrowserWindow | null = null;

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  spawn(sessionId: string, cwd: string): void {
    if (this.registry.has(sessionId)) return;

    const shell = process.env.COMSPEC || 'cmd.exe';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd,
      env: { ...process.env } as Record<string, string>,
      useConpty: true,
    });

    ptyProcess.onData((data) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(IPC_CHANNELS.PTY_OUTPUT, { sessionId, data });
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      this.registry.delete(sessionId);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(IPC_CHANNELS.PTY_EXIT, { sessionId, exitCode });
      }
    });

    this.registry.set(sessionId, ptyProcess);
  }

  write(sessionId: string, data: string): void {
    this.registry.get(sessionId)?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.registry.get(sessionId)?.resize(cols, rows);
  }

  kill(sessionId: string): void {
    const p = this.registry.get(sessionId);
    if (p) {
      p.kill();
      this.registry.delete(sessionId);
    }
  }

  killAll(): void {
    for (const [, p] of this.registry) {
      p.kill();
    }
    this.registry.clear();
  }
}

export const ptyManager = new PtyManager();
