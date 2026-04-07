import React from 'react';
import type { RenderNode } from './types';

interface BoxNodeLayerProps {
  nodes: RenderNode[];
  zoom: number;
  panX: number;
  panY: number;
  nodeDragOffset: { id: string; dx: number; dy: number } | null;
}

export const BoxNodeLayer: React.FC<BoxNodeLayerProps> = ({
  nodes,
  zoom,
  panX,
  panY,
  nodeDragOffset,
}) => {
  const boxNodes = nodes.filter((n) => n.isBox);
  if (boxNodes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {boxNodes.map((node) => {
        const w = node.width ?? 300;
        const h = node.height ?? 200;
        const offsetX = nodeDragOffset?.id === node.id ? nodeDragOffset.dx : 0;
        const offsetY = nodeDragOffset?.id === node.id ? nodeDragOffset.dy : 0;
        const screenX = (node.x + offsetX) * zoom + panX - (w * zoom) / 2;
        const screenY = (node.y + offsetY) * zoom + panY - (h * zoom) / 2;

        return (
          <div
            key={node.id}
            className="absolute rounded-lg border-2 border-dashed border-accent/40 bg-accent/5"
            style={{
              left: screenX,
              top: screenY,
              width: w * zoom,
              height: h * zoom,
            }}
          >
            <div
              className="absolute top-1 left-2 text-xs text-accent/60 font-medium truncate"
              style={{ maxWidth: w * zoom - 16, fontSize: Math.max(10, 12 * zoom) }}
            >
              {node.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
