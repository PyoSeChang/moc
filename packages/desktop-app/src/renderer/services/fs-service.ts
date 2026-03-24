import type { FileTreeNode } from '@moc/shared/types';
import { unwrapIpc } from './ipc';

export async function readDir(dirPath: string): Promise<FileTreeNode[]> {
  return unwrapIpc(await window.electron.fs.readDir(dirPath));
}

export async function readFile(filePath: string): Promise<string> {
  return unwrapIpc(await window.electron.fs.readFile(filePath));
}

export async function writeFile(filePath: string, content: string): Promise<boolean> {
  return unwrapIpc(await window.electron.fs.writeFile(filePath, content));
}

export async function openFolderDialog(): Promise<string | null> {
  const result = unwrapIpc(await window.electron.fs.openDialog({ properties: ['openDirectory'] }));
  return result ? (result as string[])[0] : null;
}

export async function openFileDialog(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  const result = unwrapIpc(await window.electron.fs.openDialog({
    properties: ['openFile'],
    filters,
  }));
  return result ? (result as string[])[0] : null;
}

export const fsService = { readDir, readFile, writeFile, openFolderDialog, openFileDialog };
