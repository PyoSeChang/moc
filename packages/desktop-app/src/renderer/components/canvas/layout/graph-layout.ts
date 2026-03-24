/**
 * Graph Layout — 간단한 force-directed 알고리즘
 * 연결된 노드는 가깝게, 안 된 노드는 멀리 배치
 */

import type { LayoutNode, LayoutEdge, LayoutResult, LayoutOptions } from './types';

const DEFAULT_ITERATIONS = 50;
const REPULSION = 5000;
const ATTRACTION = 0.01;
const DAMPING = 0.9;
const MIN_DISTANCE = 1;

interface NodeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
}

/** 영역 제한 바운드. overview에서 나머지 영역을 지정할 때 사용. */
export interface GraphBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function graphLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions,
  bounds?: GraphBounds,
): LayoutResult {
  if (nodes.length === 0) return {};

  const bMinX = bounds?.minX ?? 0;
  const bMinY = bounds?.minY ?? 0;
  const bMaxX = bounds?.maxX ?? options.width;
  const bMaxY = bounds?.maxY ?? options.height;
  const bW = bMaxX - bMinX;
  const bH = bMaxY - bMinY;

  if (nodes.length === 1) {
    return { [nodes[0].id]: { x: bMinX + bW / 2, y: bMinY + bH / 2 } };
  }

  const padding = options.padding ?? 80;

  // 초기 위치: 저장된 위치가 있으면 고정, 없으면 원형 배치
  const state = new Map<string, NodeState>();
  const cx = bMinX + bW / 2;
  const cy = bMinY + bH / 2;
  const radius = Math.min(bW, bH) / 3;

  nodes.forEach((node, i) => {
    if (node.x !== undefined && node.y !== undefined) {
      state.set(node.id, { x: node.x, y: node.y, vx: 0, vy: 0, fixed: true });
    } else {
      const angle = (2 * Math.PI * i) / nodes.length;
      state.set(node.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        fixed: false,
      });
    }
  });

  // 인접 리스트
  const adjacency = new Set<string>();
  for (const edge of edges) {
    adjacency.add(`${edge.source}:${edge.target}`);
    adjacency.add(`${edge.target}:${edge.source}`);
  }

  // 시뮬레이션
  for (let iter = 0; iter < DEFAULT_ITERATIONS; iter++) {
    // 반발력 (모든 노드 쌍)
    const nodeList = Array.from(state.entries());
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const [, a] = nodeList[i];
        const [, b] = nodeList[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE);
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
        if (!b.fixed) { b.vx += fx; b.vy += fy; }
      }
    }

    // 인력 (연결된 노드 쌍)
    for (const edge of edges) {
      const a = state.get(edge.source);
      const b = state.get(edge.target);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const fx = dx * ATTRACTION;
      const fy = dy * ATTRACTION;

      if (!a.fixed) { a.vx += fx; a.vy += fy; }
      if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
    }

    // 위치 업데이트 + 감쇠
    for (const [, n] of state) {
      if (n.fixed) continue;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;

      // 경계 제한 (bounds 또는 캔버스 전체)
      n.x = Math.max(bMinX + padding, Math.min(bMaxX - padding, n.x));
      n.y = Math.max(bMinY + padding, Math.min(bMaxY - padding, n.y));
    }
  }

  const result: LayoutResult = {};
  for (const [id, n] of state) {
    result[id] = { x: Math.round(n.x), y: Math.round(n.y) };
  }
  return result;
}
