import { listModules, listModuleDirectories, getProjectById } from '@netior/core';
import { resolve } from 'path';

export function getAllowedPaths(projectId: string): string[] {
  const modules = listModules(projectId);
  return modules.flatMap(m =>
    listModuleDirectories(m.id).map(d => resolve(d.dir_path))
  );
}

export function isPathAllowed(targetPath: string, allowedPaths: string[]): boolean {
  const resolved = resolve(targetPath);
  return allowedPaths.some(allowed =>
    resolved === allowed || resolved.startsWith(allowed + '/') || resolved.startsWith(allowed + '\\')
  );
}

/**
 * Returns allowed paths array on success, or error message string on failure.
 * Validates against registered module directories.
 */
export function validatePath(projectId: string, targetPath: string): string[] | string {
  const allowed = getAllowedPaths(projectId);
  if (allowed.length === 0) return 'No module directories registered for this project';
  if (!isPathAllowed(targetPath, allowed)) return 'Path is outside registered module directories';
  return allowed;
}

/**
 * Validates that a path is under the project's root directory.
 * Use this for file-entity-based operations where the file may not be under a module directory.
 * Returns null on success, or error message string on failure.
 */
export function validateProjectRootPath(projectId: string, targetPath: string): string | null {
  const project = getProjectById(projectId);
  if (!project) return `Project not found: ${projectId}`;
  const rootDir = resolve(project.root_dir);
  const resolved = resolve(targetPath);
  if (resolved === rootDir || resolved.startsWith(rootDir + '/') || resolved.startsWith(rootDir + '\\')) {
    return null;
  }
  return 'Path is outside the project root directory';
}
