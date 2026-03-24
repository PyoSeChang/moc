/**
 * Node Component Types
 *
 * Unified interface for all node rendering components (Level 1/2/3)
 */

export type NodeShape = 'circle' | 'gear' | 'stadium' | 'portrait' | 'dashed' | 'wide' | 'rectangle' | 'square';
import type { CanvasMode } from '../../../stores/ui-store';

/** Props for shape-specific internal layout components */
export interface ShapeLayoutProps {
  label: string;
  icon: string;
  semanticTypeLabel: string;
  systemType?: string;
  updatedAt?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/** Shape layout component type */
export type ShapeLayout = React.ComponentType<ShapeLayoutProps>;

/** Base props for all node components */
export interface NodeComponentProps {
  // Identity
  id: string;
  semanticType: string;
  semanticTypeLabel: string;
  systemType?: string;

  // Position & Size
  x: number;
  y: number;
  width?: number;
  height?: number;

  // Display
  label: string;
  updatedAt?: string;
  icon: string;
  selected: boolean;
  highlighted?: boolean;
  mode?: CanvasMode;

  // Appearance (Level 1: Shape)
  shape?: NodeShape;

  // Extended data (Level 2/3: Custom components)
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;

  // Span resize (timeline mode)
  spanInfo?: { startValue: number; endValue: number };
  onSpanResizeStart?: (nodeId: string, edge: 'start' | 'end', startX: number, startValue: number) => void;

  // Callbacks
  onClick: (id: string, event: React.MouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, startX: number, startY: number) => void;
  onContextMenu?: (type: 'canvas' | 'node' | 'edge', x: number, y: number, targetId?: string) => void;
}

/** Node component type */
export type NodeComponent = React.ComponentType<NodeComponentProps>;
