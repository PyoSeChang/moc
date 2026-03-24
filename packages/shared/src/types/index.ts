// ============================================
// Project
// ============================================

export interface Project {
  id: string;
  name: string;
  root_dir: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  root_dir: string;
}

// ============================================
// Concept
// ============================================

export interface Concept {
  id: string;
  project_id: string;
  title: string;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptCreate {
  project_id: string;
  title: string;
  color?: string;
  icon?: string;
}

export interface ConceptUpdate {
  title?: string;
  color?: string | null;
  icon?: string | null;
}

// ============================================
// Canvas
// ============================================

export interface Canvas {
  id: string;
  project_id: string;
  name: string;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasCreate {
  project_id: string;
  name: string;
}

export interface CanvasUpdate {
  name?: string;
  viewport_x?: number;
  viewport_y?: number;
  viewport_zoom?: number;
}

// ============================================
// CanvasNode
// ============================================

export interface CanvasNode {
  id: string;
  canvas_id: string;
  concept_id: string;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
}

export interface CanvasNodeCreate {
  canvas_id: string;
  concept_id: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
}

export interface CanvasNodeUpdate {
  position_x?: number;
  position_y?: number;
  width?: number | null;
  height?: number | null;
}

// ============================================
// Edge
// ============================================

export interface Edge {
  id: string;
  canvas_id: string;
  source_node_id: string;
  target_node_id: string;
  created_at: string;
}

export interface EdgeCreate {
  canvas_id: string;
  source_node_id: string;
  target_node_id: string;
}

// ============================================
// ConceptFile
// ============================================

export interface ConceptFile {
  id: string;
  concept_id: string;
  file_path: string;
  created_at: string;
}

export interface ConceptFileCreate {
  concept_id: string;
  file_path: string;
}

// ============================================
// IPC
// ============================================

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================
// File System
// ============================================

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}
