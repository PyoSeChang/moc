import React from 'react';
import { EdgeRouteLine } from '../canvas/EdgeRouteLine';
import type { RenderNode, RenderEdge } from './types';

interface EdgeLayerProps {
  edges: RenderEdge[];
  nodes: RenderNode[];
  zoom: number;
  panX: number;
  panY: number;
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
          if (edge.hidden || edge.route === 'hidden') return null;

          const source = nodePositionMap.get(edge.sourceId);
          const target = nodePositionMap.get(edge.targetId);
          if (!source || !target) return null;

          return (
            <g key={edge.id} style={{ opacity: edge.dimmed ? 0.2 : 1, transition: 'opacity 120ms ease' }}>
              <EdgeRouteLine
                id={edge.id}
                sourceX={source.x}
                sourceY={source.y}
                targetX={target.x}
                targetY={target.y}
                directed={edge.directed}
                label={edge.label}
                color={edge.color}
                lineStyle={edge.lineStyle}
                route={edge.route === 'orthogonal' ? 'orthogonal' : 'straight'}
                routePoints={edge.routePoints}
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
