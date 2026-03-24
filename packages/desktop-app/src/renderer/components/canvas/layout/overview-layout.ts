/**
 * Overview Layout — 영역 기반 배치
 *
 * ┌──────────────────────────────────────────┐
 * │     [config1] [config2] [config3]        │  상단: config (수평 순차)
 * ├──────────────────────────────────────────┤
 * │ [grp1]          [grp2]                   │
 * │ [grp1-1] [grp1-2]         [entity1]      │  container: 트리 배치
 * │ [grp1-1-1]                [entity2]      │  나머지: force-directed
 * └──────────────────────────────────────────┘
 */

import type { LayoutNode, LayoutEdge, LayoutResult, LayoutOptions } from './types';
import { graphLayout } from './graph-layout';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const GAP = 40;

export function overviewLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions,
): LayoutResult {
  if (nodes.length === 0) return {};

  const padding = options.padding ?? 80;
  const result: LayoutResult = {};

  // --- 1. 노드 분류 ---
  const configNodes: LayoutNode[] = [];
  const groupNodes: LayoutNode[] = [];
  const restNodes: LayoutNode[] = [];

  for (const node of nodes) {
    if (node.systemType === 'config') {
      configNodes.push(node);
    } else if (node.systemType === 'container') {
      groupNodes.push(node);
    } else {
      restNodes.push(node);
    }
  }

  // --- 2. Config 영역 (상단, 수평 중앙 정렬) ---
  const configAreaHeight = configNodes.length > 0 ? NODE_HEIGHT + GAP : 0;

  for (let i = 0; i < configNodes.length; i++) {
    const node = configNodes[i];
    if (node.x !== undefined && node.y !== undefined) {
      result[node.id] = { x: node.x, y: node.y };
      continue;
    }
    const totalWidth = configNodes.length * NODE_WIDTH + (configNodes.length - 1) * GAP;
    const startX = (options.width - totalWidth) / 2 + NODE_WIDTH / 2;
    result[node.id] = {
      x: Math.round(startX + i * (NODE_WIDTH + GAP)),
      y: Math.round(padding + NODE_HEIGHT / 2),
    };
  }

  // --- 3. container 영역 (트리 배치) ---
  const groupAreaTop = padding + configAreaHeight;
  let groupAreaWidth = 0;
  let groupAreaBottom = groupAreaTop;

  if (groupNodes.length > 0) {
    const groupIds = new Set(groupNodes.map((n) => n.id));

    // container 간 edge로 부모-자식 관계 구축
    const childrenMap = new Map<string, string[]>(); // parentId → childIds
    const childSet = new Set<string>(); // 자식인 노드 ID

    for (const edge of edges) {
      if (groupIds.has(edge.source) && groupIds.has(edge.target) && edge.directed) {
        const children = childrenMap.get(edge.source) ?? [];
        children.push(edge.target);
        childrenMap.set(edge.source, children);
        childSet.add(edge.target);
      }
    }

    // 루트 노드: 다른 container의 자식이 아닌 것
    const roots = groupNodes.filter((n) => !childSet.has(n.id));

    // BFS 트리 배치: 각 depth를 한 행으로, 같은 부모의 자식은 수평 나열
    // 각 노드의 서브트리 폭을 먼저 계산
    const subtreeWidth = new Map<string, number>();

    function calcWidth(id: string): number {
      const children = childrenMap.get(id);
      if (!children || children.length === 0) {
        subtreeWidth.set(id, NODE_WIDTH);
        return NODE_WIDTH;
      }
      const w = children.reduce((sum, cid) => sum + calcWidth(cid), 0)
        + (children.length - 1) * GAP;
      subtreeWidth.set(id, w);
      return w;
    }

    // 루트들의 전체 폭 계산
    for (const root of roots) {
      calcWidth(root.id);
    }
    const totalRootWidth = roots.reduce((sum, r) => sum + (subtreeWidth.get(r.id) ?? NODE_WIDTH), 0)
      + (roots.length > 1 ? (roots.length - 1) * GAP * 2 : 0);

    // 재귀 배치
    function placeNode(id: string, cx: number, y: number): void {
      const node = groupNodes.find((n) => n.id === id);
      if (!node) return;

      if (node.x !== undefined && node.y !== undefined) {
        result[id] = { x: node.x, y: node.y };
      } else {
        result[id] = { x: Math.round(cx), y: Math.round(y) };
      }
      groupAreaBottom = Math.max(groupAreaBottom, y + NODE_HEIGHT / 2 + GAP);

      const children = childrenMap.get(id);
      if (!children || children.length === 0) return;

      const childY = y + NODE_HEIGHT + GAP;
      const totalChildWidth = children.reduce((sum, cid) => sum + (subtreeWidth.get(cid) ?? NODE_WIDTH), 0)
        + (children.length - 1) * GAP;
      let childX = cx - totalChildWidth / 2;

      for (const cid of children) {
        const w = subtreeWidth.get(cid) ?? NODE_WIDTH;
        placeNode(cid, childX + w / 2, childY);
        childX += w + GAP;
      }
    }

    // 루트 노드들을 좌측 상단부터 수평 배치
    const startX = padding + totalRootWidth / 2;
    let rootX = padding;
    for (const root of roots) {
      const w = subtreeWidth.get(root.id) ?? NODE_WIDTH;
      placeNode(root.id, rootX + w / 2, groupAreaTop + NODE_HEIGHT / 2);
      rootX += w + GAP * 2;
    }

    groupAreaWidth = totalRootWidth + GAP;
  }

  // --- 4. 나머지 영역 (force-directed) ---
  if (restNodes.length > 0) {
    const restIds = new Set(restNodes.map((n) => n.id));
    const restEdges = edges.filter(
      (e) => restIds.has(e.source) && restIds.has(e.target),
    );

    // container 트리가 차지하는 영역 오른쪽 또는 아래에 배치
    const restMinX = padding + groupAreaWidth;
    const restMinY = groupAreaTop;

    const restPositions = graphLayout(restNodes, restEdges, options, {
      minX: restMinX,
      minY: restMinY,
      maxX: options.width,
      maxY: options.height,
    });

    for (const [id, pos] of Object.entries(restPositions)) {
      result[id] = pos;
    }
  }

  return result;
}
