/**
 * Focus Layout — 포커스 노드 중심 배치
 *
 *  [parent2] [primary] [parent3]   논리적 부모 (primary=수직 위, 나머지=대각선)
 *                │
 *           ★[focused]★            중앙 약간 상단
 *            /    \
 *       [conn1] [conn2]            semantic 연결 노드
 */

import type { LayoutNode, LayoutEdge, LayoutResult, LayoutOptions } from './types';

const NODE_HEIGHT = 60;
const LEVEL_GAP = 100;
const PARENT_SPREAD = 160;
const SPREAD_RADIUS = 200;

export function focusLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions,
): LayoutResult {
  if (nodes.length === 0) return {};

  const ctx = options.context;
  if (!ctx?.focusNodeId) return {};

  const result: LayoutResult = {};
  const focusId = ctx.focusNodeId;
  const parentIds = new Set(ctx.parentNodeIds ?? []);
  const primaryParentId = ctx.primaryParentId;

  // 포커스 노드 찾기
  const focusNode = nodes.find((n) => n.id === focusId);
  if (!focusNode) return {};

  // --- 1. 포커스 노드 위치: 중앙 약간 상단 ---
  const focusX = focusNode.x ?? options.width / 2;
  const focusY = focusNode.y ?? options.height * 0.22;
  result[focusId] = { x: Math.round(focusX), y: Math.round(focusY) };

  // --- 2. 부모 노드: 포커스 위에 배치 ---
  const parentY = focusY - NODE_HEIGHT - LEVEL_GAP;
  const parentList = nodes.filter((n) => parentIds.has(n.id));

  if (parentList.length > 0) {
    // primary parent → 수직 위 (center), 나머지 → 양쪽으로 spread
    const nonPrimary = parentList.filter((n) => n.id !== primaryParentId);
    const primary = parentList.find((n) => n.id === primaryParentId);

    // primary parent 배치
    if (primary) {
      if (primary.x !== undefined && primary.y !== undefined) {
        result[primary.id] = { x: primary.x, y: primary.y };
      } else {
        result[primary.id] = { x: Math.round(focusX), y: Math.round(parentY) };
      }
    }

    // 나머지 부모: primary 양쪽에 대각선 배치
    if (nonPrimary.length > 0) {
      const centerX = primary ? focusX : focusX;
      for (let i = 0; i < nonPrimary.length; i++) {
        const node = nonPrimary[i];
        if (node.x !== undefined && node.y !== undefined) {
          result[node.id] = { x: node.x, y: node.y };
          continue;
        }
        // 좌우 교대 배치: -1, +1, -2, +2, ...
        const side = i % 2 === 0 ? -(Math.floor(i / 2) + 1) : Math.floor(i / 2) + 1;
        result[node.id] = {
          x: Math.round(centerX + side * PARENT_SPREAD),
          y: Math.round(parentY),
        };
      }
    }

    // primary 없이 부모만 있는 경우: 첫 번째를 수직 위, 나머지 양쪽
    if (!primary && parentList.length > 0) {
      const first = parentList[0];
      if (first.x === undefined || first.y === undefined) {
        result[first.id] = { x: Math.round(focusX), y: Math.round(parentY) };
      }
    }
  }

  // --- 3. 연결 노드: 포커스 아래 반원형 배치 ---
  const connectedIds: string[] = [];
  for (const edge of edges) {
    if (edge.source === focusId && !parentIds.has(edge.target)) {
      connectedIds.push(edge.target);
    } else if (edge.target === focusId && !parentIds.has(edge.source)) {
      connectedIds.push(edge.source);
    }
  }

  // 중복 제거 + 존재하는 노드만 + 부모/포커스 제외
  const nodeIds = new Set(nodes.map((n) => n.id));
  const uniqueConnected = [...new Set(connectedIds)].filter(
    (id) => id !== focusId && !parentIds.has(id) && nodeIds.has(id),
  );

  const count = uniqueConnected.length;
  if (count > 0) {
    const startAngle = Math.PI / 6;
    const endAngle = (5 * Math.PI) / 6;
    const angleStep = count > 1 ? (endAngle - startAngle) / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const id = uniqueConnected[i];
      const node = nodes.find((n) => n.id === id);
      if (node?.x !== undefined && node?.y !== undefined) {
        result[id] = { x: node.x, y: node.y };
        continue;
      }

      const angle = count === 1 ? Math.PI / 2 : startAngle + angleStep * i;
      result[id] = {
        x: Math.round(focusX + SPREAD_RADIUS * Math.cos(angle)),
        y: Math.round(focusY + SPREAD_RADIUS * Math.sin(angle)),
      };
    }
  }

  // --- 4. 연결 안 된 나머지 노드 ---
  for (const node of nodes) {
    if (result[node.id]) continue;
    if (node.x !== undefined && node.y !== undefined) {
      result[node.id] = { x: node.x, y: node.y };
    } else {
      result[node.id] = {
        x: Math.round(options.width / 2),
        y: Math.round(options.height * 0.8),
      };
    }
  }

  return result;
}
