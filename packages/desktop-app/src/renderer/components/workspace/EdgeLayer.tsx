import React from 'react';
import { EdgeLine } from '../canvas/EdgeLine';
import type { RenderNode, RenderEdge } from './types';

interface EdgeLayerProps {
  edges: RenderEdge[];
  nodes: RenderNode[];
  zoom: number;
  panX: number;
  panY: number;
  dimmedIds?: Set<string>;
  nodeDragOffset: { id: string; dx: number; dy: number } | null;
  onContextMenu?: (type: 'canvas' | 'node' | 'edge', x: number, y: number, targetId?: string) => void;
  onDoubleClick?: (edgeId: string) => void;
}

/**
 * EdgeLayer
 *
 * Renders all edges as SVG with viewport transform.
 * Calculates edge endpoints from node positions (with drag offset).
 */
export const EdgeLayer: React.FC<EdgeLayerProps> = ({
  edges,
  nodes,
  zoom,
  panX,
  panY,
  dimmedIds,
  nodeDragOffset,
  onContextMenu,
  onDoubleClick,
}) => {
  // Build node position map (with drag offset)
  const nodePositionMap = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    if (nodeDragOffset && nodeDragOffset.id === node.id) {
      nodePositionMap.set(node.id, {
        x: node.x + nodeDragOffset.dx / zoom,
        y: node.y + nodeDragOffset.dy / zoom,
      });
    } else {
      nodePositionMap.set(node.id, { x: node.x, y: node.y });
    }
  }

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <g
        transform={`translate(${panX}, ${panY}) scale(${zoom})`}
        style={{ pointerEvents: 'auto' }}
      >
        {edges.map((edge) => {
          const source = nodePositionMap.get(edge.sourceId);
          const target = nodePositionMap.get(edge.targetId);
          if (!source || !target) return null;

          const isDimmed = dimmedIds?.has(edge.id);

          return (
            <g key={edge.id} style={isDimmed ? { opacity: 0.25, transition: 'opacity 0.2s' } : undefined}>
              <EdgeLine
                id={edge.id}
                sourceX={source.x}
                sourceY={source.y}
                targetX={target.x}
                targetY={target.y}
                directed={edge.directed}
                label={edge.label}
                color={edge.color}
                lineStyle={edge.lineStyle}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
