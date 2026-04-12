import { ipcMain, dialog, shell, clipboard, BrowserWindow } from 'electron';
import { readdir, readFile, writeFile, stat, rename, rm, mkdir, copyFile, cp } from 'fs/promises';
import { join, resolve, extname, basename, dirname } from 'path';
import { existsSync, watch, type FSWatcher } from 'fs';
import type { IpcResult, FileTreeNode } from '@netior/shared/types';
import { getRuntimeUndoTrashDir } from '../runtime/runtime-paths';

function normalizeFsPath(targetPath: string): string {
  return resolve(targetPath).replace(/\\/g, '/').toLowerCase();
}

function isSameOrNestedPath(sourcePath: string, destPath: string): boolean {
  const source = normalizeFsPath(sourcePath);
  const dest = normalizeFsPath(destPath);
  return dest === source || dest.startsWith(`${source}/`);
}

function getUndoTrashDir(): string {
  return getRuntimeUndoTrashDir();
}

async function buildFileTree(dirPath: string): Promise<FileTreeNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = await buildFileTree(join(dirPath, entry.name));
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file',
        extension: extname(entry.name).slice(1).toLowerCase() || undefined,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function buildShallowTree(dirPath: string, maxDepth: number, currentDepth = 0): Promise<FileTreeNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (currentDepth < maxDepth) {
        const children = await buildShallowTree(join(dirPath, entry.name), maxDepth, currentDepth + 1);
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      } else {
        // Check if directory has any entries
        try {
          const subEntries = await readdir(join(dirPath, entry.name));
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            hasChildren: subEntries.length > 0,
          });
        } catch {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            hasChildren: false,
          });
        }
      }
    } else {
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file',
        extension: extname(entry.name).slice(1).toLowerCase() || undefined,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Directory Watcher ────────────────────────────────────────────

const activeWatchers: FSWatcher[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function clearWatchers(): void {
  for (const w of activeWatchers) w.close();
  activeWatchers.length = 0;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function notifyRenderers(): void {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('fs:dirChanged');
    }
  }, 500);
}

function watchDirs(dirs: string[]): void {
  clearWatchers();
  for (const dir of dirs) {
    try {
      const watcher = watch(dir, { recursive: true }, () => notifyRenderers());
      activeWatchers.push(watcher);
    } catch {
      // Directory may not exist or be inaccessible — skip silently
    }
  }
}

export function registerFsIpc(): void {
  ipcMain.handle('fs:readDir', async (_e, dirPath: string): Promise<IpcResult<unknown>> => {
    try {
      const tree = await buildFileTree(dirPath);
      return { success: true, data: tree };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:readDirShallow', async (_e, dirPath: string, depth?: number): Promise<IpcResult<unknown>> => {
    try {
      const tree = await buildShallowTree(dirPath, depth ?? 2);
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

  ipcMain.handle('fs:readBinaryFile', async (_e, filePath: string): Promise<IpcResult<unknown>> => {
    try {
      const buffer = await readFile(filePath);
      // Return as Uint8Array so Electron can serialize it via structured clone
      return { success: true, data: new Uint8Array(buffer) };
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
        properties: (options?.properties as Electron.OpenDialogOptions['properties']) ?? ['openDirectory'],
        title: options?.title as string,
        filters: options?.filters as Electron.FileFilter[],
      });
      if (result.canceled) return { success: true, data: null };
      return { success: true, data: result.filePaths };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:rename', async (_e, oldPath: string, newPath: string): Promise<IpcResult<unknown>> => {
    try {
      if (oldPath !== newPath && existsSync(newPath)) {
        return { success: false, error: 'Already exists' };
      }
      await rename(oldPath, newPath);
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:delete', async (_e, targetPath: string): Promise<IpcResult<unknown>> => {
    try {
      await shell.trashItem(resolve(targetPath));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:createFile', async (_e, filePath: string): Promise<IpcResult<unknown>> => {
    try {
      if (existsSync(filePath)) {
        return { success: false, error: 'File already exists' };
      }
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, '', 'utf-8');
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:createDir', async (_e, dirPath: string): Promise<IpcResult<unknown>> => {
    try {
      if (existsSync(dirPath)) {
        return { success: false, error: 'Directory already exists' };
      }
      await mkdir(dirPath, { recursive: true });
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:copy', async (_e, src: string, dest: string): Promise<IpcResult<unknown>> => {
    try {
      if (normalizeFsPath(src) === normalizeFsPath(dest)) {
        return { success: false, error: 'Already exists' };
      }
      if (existsSync(dest)) {
        return { success: false, error: 'Already exists' };
      }
      const srcStat = await stat(src);
      if (srcStat.isDirectory() && isSameOrNestedPath(src, dest)) {
        return { success: false, error: 'Cannot copy a folder into itself' };
      }
      if (srcStat.isDirectory()) {
        await cp(src, dest, { recursive: true });
      } else {
        await mkdir(dirname(dest), { recursive: true });
        await copyFile(src, dest);
      }
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:move', async (_e, src: string, dest: string): Promise<IpcResult<unknown>> => {
    try {
      if (normalizeFsPath(src) === normalizeFsPath(dest)) {
        return { success: false, error: 'Already exists' };
      }
      if (existsSync(dest)) {
        return { success: false, error: 'Already exists' };
      }
      const srcStat = await stat(src);
      if (srcStat.isDirectory() && isSameOrNestedPath(src, dest)) {
        return { success: false, error: 'Cannot move a folder into itself' };
      }
      await mkdir(dirname(dest), { recursive: true });
      await rename(src, dest);
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:showInExplorer', async (_e, targetPath: string): Promise<IpcResult<unknown>> => {
    try {
      shell.showItemInFolder(targetPath);
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:exists', async (_e, targetPath: string): Promise<IpcResult<unknown>> => {
    return { success: true, data: existsSync(targetPath) };
  });

  ipcMain.handle('fs:watchDirs', (_e, dirs: string[]): IpcResult<unknown> => {
    watchDirs(dirs);
    return { success: true, data: true };
  });

  ipcMain.handle('fs:unwatchDirs', (): IpcResult<unknown> => {
    clearWatchers();
    return { success: true, data: true };
  });

  // Check if system clipboard contains files
  ipcMain.handle('fs:hasClipboardFiles', (): IpcResult<boolean> => {
    const buf = clipboard.readBuffer('FileNameW');
    const hasFiles = buf.length > 0;
    return { success: true, data: hasFiles };
  });

  ipcMain.handle('fs:stashDelete', async (_e, targetPath: string): Promise<IpcResult<unknown>> => {
    try {
      const normalizedTargetPath = resolve(targetPath);
      if (!existsSync(normalizedTargetPath)) {
        return { success: false, error: 'Target does not exist' };
      }
      const targetStat = await stat(normalizedTargetPath);
      const trashDir = getUndoTrashDir();
      await mkdir(trashDir, { recursive: true });
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${basename(normalizedTargetPath)}`;
      const stashPath = join(trashDir, uniqueName);
      await rename(normalizedTargetPath, stashPath);
      return {
        success: true,
        data: {
          originalPath: normalizedTargetPath.replace(/\\/g, '/'),
          stashPath: stashPath.replace(/\\/g, '/'),
          isDirectory: targetStat.isDirectory(),
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:restoreDeleted', async (_e, stashPath: string, originalPath: string): Promise<IpcResult<unknown>> => {
    try {
      const resolvedStashPath = resolve(stashPath);
      const resolvedOriginalPath = resolve(originalPath);
      if (!existsSync(resolvedStashPath)) {
        return { success: false, error: 'Stashed item no longer exists' };
      }
      if (existsSync(resolvedOriginalPath)) {
        return { success: false, error: 'Already exists' };
      }
      await mkdir(dirname(resolvedOriginalPath), { recursive: true });
      await rename(resolvedStashPath, resolvedOriginalPath);
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('fs:hasClipboardImage', (): IpcResult<boolean> => {
    const image = clipboard.readImage();
    return { success: true, data: !image.isEmpty() };
  });

  // Read file paths from system clipboard (Windows: FileNameW format)
  ipcMain.handle('fs:readClipboardFiles', (): IpcResult<string[]> => {
    try {
      const buf = clipboard.readBuffer('FileNameW');
      if (buf.length === 0) return { success: true, data: [] };
      // FileNameW is null-terminated UTF-16LE
      const raw = buf.toString('utf16le');
      const filePaths = raw
        .split('\0')
        .filter(Boolean)
        .filter((filePath) => existsSync(filePath));
      return { success: true, data: filePaths };
    } catch {
      return { success: true, data: [] };
    }
  });

  ipcMain.handle('fs:saveClipboardImage', async (_e, filePath: string): Promise<IpcResult<unknown>> => {
    try {
      const image = clipboard.readImage();
      if (image.isEmpty()) {
        return { success: false, error: 'Clipboard does not contain an image' };
      }
      if (existsSync(filePath)) {
        return { success: false, error: 'Already exists' };
      }
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, image.toPNG());
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
