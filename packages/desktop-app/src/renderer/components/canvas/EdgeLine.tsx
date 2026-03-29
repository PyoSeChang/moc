import React, { useState, useCallback } from 'react';

export interface EdgeLineProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  directed: boolean;
  label: string;
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  onContextMenu?: (type: 'canvas' | 'node' | 'edge', x: number, y: number, targetId?: string) => void;
  onDoubleClick?: (edgeId: string) => void;
}

const ARROW_SIZE = 8;

export const EdgeLine: React.FC<EdgeLineProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  directed,
  label,
  color,
  lineStyle,
  onContextMenu,
  onDoubleClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(id);
    },
    [id, onDoubleClick],
  );
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.('edge', e.clientX, e.clientY, id);
    },
    [id, onContextMenu],
  );

  // 직선 경로
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) return null;

  // 노드 반경만큼 줄여서 노드 경계에서 시작/끝
  const nodeRadius = 30;
  const ratio = nodeRadius / dist;
  const sx = sourceX + dx * ratio;
  const sy = sourceY + dy * ratio;
  const tx = targetX - dx * ratio;
  const ty = targetY - dy * ratio;

  // 화살표 방향 계산
  const angle = Math.atan2(ty - sy, tx - sx);

  const defaultColor = color || 'var(--edge-default)';
  const lineStroke = hovered ? 'var(--edge-hover)' : defaultColor;
  const lineWidth = hovered ? 2 : 1.5;
  const arrowFill = hovered ? 'var(--edge-hover)' : defaultColor;
  const dashArray = lineStyle === 'dashed' ? '8,4' : lineStyle === 'dotted' ? '2,2' : undefined;

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      {/* 히트 영역 (투명, 넓은 클릭 영역) */}
      <line
        x1={sx}
        y1={sy}
        x2={tx}
        y2={ty}
        stroke="transparent"
        strokeWidth={12}
      />
      {/* 실제 선 */}
      <line
        x1={sx}
        y1={sy}
        x2={tx}
        y2={ty}
        stroke={lineStroke}
        strokeWidth={lineWidth}
        strokeDasharray={dashArray}
      />
      {/* 화살표 (directed일 때만) */}
      {directed && (
        <polygon
          points={`0,${-ARROW_SIZE / 2} ${ARROW_SIZE},0 0,${ARROW_SIZE / 2}`}
          transform={`translate(${tx}, ${ty}) rotate(${(angle * 180) / Math.PI})`}
          fill={arrowFill}
        />
      )}
      {/* 라벨 (hover 시) */}
      {hovered && label && (
        <text
          x={(sx + tx) / 2}
          y={(sy + ty) / 2 - 8}
          textAnchor="middle"
          style={{ fontSize: 11, fill: 'var(--text-secondary)', pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
};
