import React from 'react';
import { EdgeRouteLine } from '../canvas/EdgeRouteLine';
import type { RenderNode, RenderEdge, RenderEdgeAnchor, RenderPoint } from './types';

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
  const HIERARCHY_ROOT_TOP_OFFSET = 18;
  const HIERARCHY_ROOT_BOTTOM_OFFSET = 74;

  // Build node position map (with drag offset)
  const nodePositionMap = new Map<string, RenderNode>();
  for (const node of nodes) {
    if (nodeDragOffset && nodeDragOffset.id === node.id) {
      nodePositionMap.set(node.id, {
        ...node,
        x: node.x + nodeDragOffset.dx / zoom,
        y: node.y + nodeDragOffset.dy / zoom,
      });
    } else {
      nodePositionMap.set(node.id, node);
    }
  }

  const resolveAnchorPoint = (node: RenderNode, anchor: RenderEdgeAnchor | undefined): RenderPoint => {
    const width = node.width ?? 160;
    const height = node.height ?? 60;

    switch (anchor) {
      case 'root-top':
        return { x: node.x, y: node.y - height / 2 + HIERARCHY_ROOT_TOP_OFFSET };
      case 'root-bottom':
        return { x: node.x, y: node.y - height / 2 + HIERARCHY_ROOT_BOTTOM_OFFSET };
      case 'top':
        return { x: node.x, y: node.y - height / 2 };
      case 'right':
        return { x: node.x + width / 2, y: node.y };
      case 'bottom':
        return { x: node.x, y: node.y + height / 2 };
      case 'left':
        return { x: node.x - width / 2, y: node.y };
      case 'center':
      default:
        return { x: node.x, y: node.y };
    }
  };

  const buildOrthogonalWaypoints = (
    source: RenderPoint,
    target: RenderPoint,
    axis: 'horizontal' | 'vertical' | undefined,
  ): RenderPoint[] => {
    if (axis === 'vertical') {
      const midY = (source.y + target.y) / 2;
      return [
        { x: source.x, y: midY },
        { x: target.x, y: midY },
      ];
    }

    const midX = (source.x + target.x) / 2;
    return [
      { x: midX, y: source.y },
      { x: midX, y: target.y },
    ];
  };

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

          const sourcePoint = resolveAnchorPoint(source, edge.sourceAnchor);
          const targetPoint = resolveAnchorPoint(target, edge.targetAnchor);
          const routePoints = edge.routePoints
            ?? (edge.route === 'orthogonal'
              ? buildOrthogonalWaypoints(sourcePoint, targetPoint, edge.orthogonalAxis)
              : undefined);
          const trimEndpoints = edge.sourceAnchor == null && edge.targetAnchor == null && !edge.routePoints;

          return (
            <g key={edge.id} style={{ opacity: edge.dimmed ? 0.2 : 1, transition: 'opacity 120ms ease' }}>
              <EdgeRouteLine
                id={edge.id}
                sourceX={sourcePoint.x}
                sourceY={sourcePoint.y}
                targetX={targetPoint.x}
                targetY={targetPoint.y}
                directed={edge.directed}
                label={edge.label}
                color={edge.color}
                lineStyle={edge.lineStyle}
                route={edge.route === 'orthogonal' ? 'orthogonal' : 'straight'}
                routePoints={routePoints}
                trimEndpoints={trimEndpoints}
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
