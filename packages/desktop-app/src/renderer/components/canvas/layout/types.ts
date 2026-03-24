/** 레이아웃 계산 입출력 타입 */

export interface LayoutNode {
  id: string;
  /** 이미 저장된 위치가 있으면 고정 */
  x?: number;
  y?: number;
  /** 스키마 system_type (config, container, entity 등) */
  systemType?: string;
  /** 스키마 semantic_type (culture 정의) */
  semanticType?: string;
  /** Plugin-specific metadata (e.g., timestamp for timeline) */
  metadata?: Record<string, unknown>;
}

export interface LayoutEdge {
  source: string;
  target: string;
  directed: boolean;
}

export interface LayoutResult {
  [nodeId: string]: { x: number; y: number };
}

export interface LayoutContext {
  mode: 'overview' | 'focus';
  /** focus 모드: 포커스 대상 노드 ID */
  focusNodeId?: string;
  /** focus 모드: 논리적 부모 노드 ID 목록 (항상 위에 배치) */
  parentNodeIds?: string[];
  /** focus 모드: 부모 중 이전 탐색 경로와 일치하는 노드 (수직 위 배치) */
  primaryParentId?: string;
}

export interface LayoutOptions {
  /** 캔버스 가용 영역 */
  width: number;
  height: number;
  /** 노드 간 최소 간격 */
  padding?: number;
  /** 모드별 레이아웃 컨텍스트 */
  context?: LayoutContext;
}
