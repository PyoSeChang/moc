/**
 * Tree Layout — directed synapse의 방향을 따라 계층 배치
 * 부모(source) → 자식(target) 구조로 위→아래 정렬
 */

import type { LayoutNode, LayoutEdge, LayoutResult, LayoutOptions } from './types';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const LEVEL_GAP = 100;
const SIBLING_GAP = 40;

export function treeLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions,
): LayoutResult {
  if (nodes.length === 0) return {};
  if (nodes.length === 1) {
    return { [nodes[0].id]: { x: options.width / 2, y: options.padding ?? 60 } };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  // 부모 → 자식 매핑 (directed edges만)
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    if (!edge.directed) continue;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;

    const list = children.get(edge.source) ?? [];
    list.push(edge.target);
    children.set(edge.source, list);
    hasParent.add(edge.target);
  }

  // 루트: 부모가 없는 노드
  const roots = nodes.filter((n) => !hasParent.has(n.id)).map((n) => n.id);
  // 루트가 없으면 (순환) 첫 번째 노드를 루트로
  if (roots.length === 0) roots.push(nodes[0].id);

  // BFS로 레벨 할당
  const levels = new Map<string, number>();
  const queue = roots.map((id) => ({ id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    levels.set(id, level);

    for (const child of children.get(id) ?? []) {
      if (!visited.has(child)) {
        queue.push({ id: child, level: level + 1 });
      }
    }
  }

  // 연결 안 된 노드도 최하위 레벨에 배치
  const maxLevel = Math.max(0, ...levels.values());
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1);
    }
  }

  // 레벨별 노드 그룹핑
  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levels) {
    const group = levelGroups.get(level) ?? [];
    group.push(id);
    levelGroups.set(level, group);
  }

  // 위치 계산
  const padding = options.padding ?? 60;
  const result: LayoutResult = {};

  for (const [level, group] of levelGroups) {
    const y = padding + level * (NODE_HEIGHT + LEVEL_GAP);
    const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * SIBLING_GAP;
    const startX = (options.width - totalWidth) / 2 + NODE_WIDTH / 2;

    group.forEach((id, i) => {
      // 저장된 위치가 있으면 그대로 사용
      const node = nodes.find((n) => n.id === id);
      if (node?.x !== undefined && node?.y !== undefined) {
        result[id] = { x: node.x, y: node.y };
      } else {
        result[id] = {
          x: Math.round(startX + i * (NODE_WIDTH + SIBLING_GAP)),
          y: Math.round(y),
        };
      }
    });
  }

  return result;
}
