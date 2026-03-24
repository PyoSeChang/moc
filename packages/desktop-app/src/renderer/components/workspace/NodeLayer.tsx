import React from 'react';
import type { RenderNode } from './types';
import type { CanvasMode } from '../../stores/ui-store';
import { NodeCardDefault } from '../canvas/node-components/NodeCardDefault';

interface NodeLayerProps {
  nodes: RenderNode[];
  selectedIds: Set<string>;
  highlightedIds?: Set<string>;
  mode: CanvasMode;
  zoom: number;
  panX: number;
  panY: number;
  nodeDragOffset: { id: string; dx: number; dy: number } | null;
  onNodeClick: (id: string, event: React.MouseEvent) => void;
  onNodeDoubleClick: (id: string) => void;
  onNodeDragStart: (nodeId: string, startX: number, startY: number) => void;
  onContextMenu?: (type: 'canvas' | 'node' | 'edge', x: number, y: number, targetId?: string) => void;
}

export const NodeLayer: React.FC<NodeLayerProps> = ({
  nodes,
  selectedIds,
  highlightedIds,
  mode,
  zoom,
  panX,
  panY,
  nodeDragOffset,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragStart,
  onContextMenu,
}) => {
  const getNodeTransform = (node: RenderNode) => {
    let x = node.x;
    let y = node.y;

    if (nodeDragOffset && nodeDragOffset.id === node.id) {
      x += nodeDragOffset.dx / zoom;
      y += nodeDragOffset.dy / zoom;
    }

    return { x, y };
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0',
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
      }}
    >
      {nodes.map((node) => {
        const t = getNodeTransform(node);

        return (
          <NodeCardDefault
            key={node.id}
            id={node.id}
            x={t.x}
            y={t.y}
            label={node.label}
            icon={node.icon}
            semanticType={node.semanticType}
            semanticTypeLabel={node.semanticTypeLabel}
            selected={selectedIds.has(node.id)}
            highlighted={highlightedIds?.has(node.id)}
            mode={mode}
            shape="rectangle"
            width={node.width}
            height={node.height}
            onClick={onNodeClick}
            onDoubleClick={onNodeDoubleClick}
            onDragStart={onNodeDragStart}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  );
};
