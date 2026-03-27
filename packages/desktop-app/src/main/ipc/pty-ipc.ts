import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@moc/shared/constants';
import { ptyManager } from '../pty/pty-manager';

export function registerPtyIpc(): void {
  ipcMain.handle(IPC_CHANNELS.PTY_SPAWN, (_event, sessionId: string, cwd: string) => {
    ptyManager.spawn(sessionId, cwd);
    return { success: true, data: null };
  });

  ipcMain.on(IPC_CHANNELS.PTY_INPUT, (_event, sessionId: string, data: string) => {
    ptyManager.write(sessionId, data);
  });

  ipcMain.on(IPC_CHANNELS.PTY_RESIZE, (_event, sessionId: string, cols: number, rows: number) => {
    ptyManager.resize(sessionId, cols, rows);
  });

  ipcMain.handle(IPC_CHANNELS.PTY_KILL, (_event, sessionId: string) => {
    ptyManager.kill(sessionId);
    return { success: true, data: null };
  });
}
