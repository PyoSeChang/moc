// ============================================
// IPC Channels
// ============================================

export const IPC_CHANNELS = {
  // Project
  PROJECT_CREATE: 'project:create',
  PROJECT_LIST: 'project:list',
  PROJECT_DELETE: 'project:delete',

  // Concept
  CONCEPT_CREATE: 'concept:create',
  CONCEPT_GET_BY_PROJECT: 'concept:getByProject',
  CONCEPT_UPDATE: 'concept:update',
  CONCEPT_DELETE: 'concept:delete',
  CONCEPT_SEARCH: 'concept:search',

  // Canvas
  CANVAS_CREATE: 'canvas:create',
  CANVAS_LIST: 'canvas:list',
  CANVAS_UPDATE: 'canvas:update',
  CANVAS_DELETE: 'canvas:delete',
  CANVAS_GET_FULL: 'canvas:getFull',

  // Canvas Node
  CANVAS_NODE_ADD: 'canvasNode:add',
  CANVAS_NODE_UPDATE: 'canvasNode:update',
  CANVAS_NODE_REMOVE: 'canvasNode:remove',

  // Edge
  EDGE_CREATE: 'edge:create',
  EDGE_DELETE: 'edge:delete',

  // Concept File
  CONCEPT_FILE_CREATE: 'conceptFile:create',
  CONCEPT_FILE_GET_BY_CONCEPT: 'conceptFile:getByConcept',
  CONCEPT_FILE_DELETE: 'conceptFile:delete',

  // File System
  FS_READ_DIR: 'fs:readDir',
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_OPEN_DIALOG: 'fs:openDialog',
  FS_DIR_CHANGED: 'fs:dirChanged',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
} as const;

// ============================================
// Defaults
// ============================================

export const DEFAULTS = {
  CANVAS_ZOOM: 1.0,
  CANVAS_PAN_X: 0,
  CANVAS_PAN_Y: 0,
  WINDOW_WIDTH: 1200,
  WINDOW_HEIGHT: 800,
} as const;
