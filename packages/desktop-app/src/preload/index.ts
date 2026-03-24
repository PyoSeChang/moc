import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  project: {
    create: (data: { name: string; root_dir: string }) =>
      ipcRenderer.invoke('project:create', data),
    list: () => ipcRenderer.invoke('project:list'),
    delete: (id: string) => ipcRenderer.invoke('project:delete', id),
  },
  concept: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('concept:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('concept:getByProject', projectId),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('concept:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('concept:delete', id),
  },
  canvas: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('canvas:create', data),
    list: (projectId: string) => ipcRenderer.invoke('canvas:list', projectId),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('canvas:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('canvas:delete', id),
    getFull: (canvasId: string) => ipcRenderer.invoke('canvas:getFull', canvasId),
  },
  canvasNode: {
    add: (data: Record<string, unknown>) => ipcRenderer.invoke('canvasNode:add', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('canvasNode:update', id, data),
    remove: (id: string) => ipcRenderer.invoke('canvasNode:remove', id),
  },
  edge: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('edge:create', data),
    delete: (id: string) => ipcRenderer.invoke('edge:delete', id),
  },
  conceptFile: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('conceptFile:create', data),
    getByConcept: (conceptId: string) => ipcRenderer.invoke('conceptFile:getByConcept', conceptId),
    delete: (id: string) => ipcRenderer.invoke('conceptFile:delete', id),
  },
  fs: {
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:writeFile', filePath, content),
    openDialog: (options?: Record<string, unknown>) =>
      ipcRenderer.invoke('fs:openDialog', options),
  },
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

export type ElectronAPI = typeof electronAPI;
