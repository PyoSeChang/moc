/**
 * Grid Layout — 행/열 배치
 * 순서대로 N열 그리드에 채워넣기
 */

import type { LayoutNode, LayoutEdge, LayoutResult, LayoutOptions } from './types';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const GAP_X = 40;
const GAP_Y = 40;

export function gridLayout(
  nodes: LayoutNode[],
  _edges: LayoutEdge[],
  options: LayoutOptions,
): LayoutResult {
  if (nodes.length === 0) return {};

  const padding = options.padding ?? 60;
  const availableWidth = options.width - padding * 2;
  const cols = Math.max(1, Math.floor(availableWidth / (NODE_WIDTH + GAP_X)));

  const result: LayoutResult = {};

  nodes.forEach((node, i) => {
    // 저장된 위치가 있으면 그대로 사용
    if (node.x !== undefined && node.y !== undefined) {
      result[node.id] = { x: node.x, y: node.y };
      return;
    }

    const col = i % cols;
    const row = Math.floor(i / cols);

    result[node.id] = {
      x: Math.round(padding + col * (NODE_WIDTH + GAP_X) + NODE_WIDTH / 2),
      y: Math.round(padding + row * (NODE_HEIGHT + GAP_Y) + NODE_HEIGHT / 2),
    };
  });

  return result;
}
