import { ipcMain, dialog } from 'electron';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import type { IpcResult, FileTreeNode } from '@moc/shared/types';

async function buildFileTree(dirPath: string, relativeTo: string): Promise<FileTreeNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  for (const entry of entries) {
    // Skip hidden files/dirs
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(dirPath, entry.name);
    const relativePath = fullPath.slice(relativeTo.length + 1).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, relativeTo);
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        extension: extname(entry.name).slice(1).toLowerCase() || undefined,
      });
    }
  }

  // Directories first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function registerFsIpc(): void {
  ipcMain.handle('fs:readDir', async (_e, dirPath: string): Promise<IpcResult<unknown>> => {
    try {
      const tree = await buildFileTree(dirPath, dirPath);
      return { success: true, data: tree };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:readFile', async (_e, filePath: string): Promise<IpcResult<unknown>> => {
    try {
      const content = await readFile(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:writeFile', async (_e, filePath: string, content: string): Promise<IpcResult<unknown>> => {
    try {
      await writeFile(filePath, content, 'utf-8');
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:openDialog', async (_e, options?: Record<string, unknown>): Promise<IpcResult<unknown>> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: (options?.properties as string[]) ?? ['openDirectory'],
        title: options?.title as string,
        filters: options?.filters as Electron.FileFilter[],
      });
      if (result.canceled) return { success: true, data: null };
      return { success: true, data: result.filePaths };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
