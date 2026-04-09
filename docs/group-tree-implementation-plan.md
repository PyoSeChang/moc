# Group / Tree 구현 계획

작성일: 2026-04-10

이 문서는 `group` 노드와 `group 내부 hierarchy mode`를 현재 Netior 구조 위에 단계적으로 올리는 계획만 다룬다.
지금 단계에서는 플러그인 시스템을 과설계하지 않고, `network + layout` 분리를 유지한 채 필요한 최소 확장만 넣는다.

---

## 1. 목표

- `box`라는 이름 대신 `group`를 node type으로 사용한다.
- `group` 내부의 포함 관계는 별도 attachment 테이블이 아니라 `edge.system_contract`로 표현한다.
- `tree`는 별도 node type이 아니라 `group`의 내부 layout mode로 처리한다.
- 배치/표현/상태는 layout layer가 해석한다.
- 현재는 hardcoded implementation으로 시작하고, 이후 plugin contract로 정리한다.

---

## 2. 결정 사항

### 2.0 세션에서 이미 합의된 UI / 인터랙션

이 항목들은 세션 대화에서 이미 정리된 내용이며, 구현 계획은 이를 기준으로 따라간다.

#### Group

- `group`는 경계만 있고 배경은 없다.
- `group` 안에는 다른 node가 들어갈 수 있다.
- `group` 안에 `group`도 들어갈 수 있다.
- depth 제한은 두지 않는다.
- cycle만 금지한다.
- edit mode에서 `group` resize가 가능해야 한다.
- `group`는 `expanded / collapsed` 상태를 가진다.
- child를 `group` 안으로 넣는 구조는 edge의 `system_contract`로 표현한다.
- child 배치는 `anchor + local offset` 모델을 사용한다.
- hierarchy는 별도 node type이 아니라 `group`의 내부 layout mode다.
- hierarchy mode에서는 마그네틱 anchor를 사용하고, 미세 조정은 local offset으로 저장한다.

#### Entry Portal

- concept node는 여러 network를 가질 수 있다.
- concept 위에 network를 드롭하면 attach된다.
- concept node 내부에는 attach된 network 목록이 항상 보이는 chip/span 버튼으로 렌더된다.
- browse mode에서만 chip 클릭 네비게이션이 동작한다.
- edit mode에서는 클릭 네비게이션을 막고 편집만 가능하게 둔다.
- concept node context menu에서:
  - 새 network 생성 후 attach
  - 기존 network 연결
  둘 다 가능해야 한다.

### 2.1 타입 체계

- `relation_type`는 user type이다. system 동작을 싣지 않는다.
- `system_contract`는 edge가 가진다.
- `node_type`은 UI 타입만 가진다.

초기안:

- `basic`
- `portal`
- `group`

기존 `box`는 migration에서 `group`으로 치환한다.

### 2.2 구조 vs 배치

- 구조:
  - `network_nodes`
  - `edges`
  - `edges.system_contract`
- 배치/표현:
  - `layouts`
  - `layout_nodes.position_json`
  - `layout_edges.visual_json`
  - `layouts.layout_config_json`

즉:

- 어떤 노드가 어떤 group에 포함되는가 = edge
- group 안에서 어디에 보이는가 = layout
- hierarchy/free 중 어떻게 배치되는가 = layout

### 2.3 plugin 확장성

지금은 plugin interface를 먼저 닫지 않는다.

대신:

- `system_contract`는 열린 `TEXT` 필드로 둔다.
- 코어 기본값은 namespaced string으로 둔다.

예:

- `core:contains`
- `core:entry_portal`

모르는 contract는 renderer에서 일반 edge fallback으로 처리한다.

---

## 3. 데이터 모델 변경

### WP-1A: edges에 system_contract 추가

신규 migration:

```sql
ALTER TABLE edges ADD COLUMN system_contract TEXT;
```

적용 범위:

- `packages/shared/src/types/index.ts`
- `packages/netior-core/src/repositories/network.ts`
- edge IPC / preload / renderer service

타입:

```ts
interface Edge {
  ...
  relation_type_id: string | null;
  system_contract: string | null;
  description: string | null;
}

interface EdgeCreate {
  ...
  relation_type_id?: string;
  system_contract?: string;
}

interface EdgeUpdate {
  relation_type_id?: string | null;
  system_contract?: string | null;
}
```

### WP-1B: node_type에서 box -> group 치환

- shared type 변경
- concept editor 옵션 변경
- 기존 데이터 migration

예:

```sql
UPDATE network_nodes SET node_type = 'group' WHERE node_type = 'box';
```

### WP-1C: layout position JSON 확장

스키마는 그대로 두고 `position_json` payload만 확장한다.

초기안:

```json
{
  "x": 420,
  "y": 180,
  "width": 320,
  "height": 220,
  "localX": 24,
  "localY": 18,
  "collapsed": false,
  "groupLayoutMode": "free"
}
```

원칙:

- `x`, `y`는 현재 renderer 호환을 위해 유지
- group child는 `localX`, `localY`를 추가로 가진다
- group 자체 상태(`collapsed`, `groupLayoutMode`)도 우선 같은 JSON 안에 둔다

이 단계에서는 별도 `state_json` 컬럼은 만들지 않는다.

### WP-1D: layout_config_json 역할

네트워크/레이아웃 전체 정책은 `layout_config_json`이 맡는다.

초기안:

```json
{
  "group": {
    "padding": 24,
    "snapRadius": 28,
    "hierarchyLevelGap": 72,
    "hierarchySiblingGap": 28
  }
}
```

---

## 4. renderer 기본 방향

현재 구조:

- node = 카드 하나
- edge = 중심점 ↔ 중심점 직선

이 구조를 완전히 갈아엎지 않고, 먼저 해석 레이어 하나를 끼운다.

### WP-2A: edge presentation resolver 도입

신규 helper:

```ts
resolveEdgePresentation(edge, sourceNode, targetNode, layoutState)
```

반환 예:

```ts
{
  hidden: boolean;
  route: "straight" | "orthogonal";
  points?: Array<{ x: number; y: number }>;
}
```

초기 동작:

- 일반 edge: `straight`
- `core:contains`: `hidden`
- `core:entry_portal`: `hidden`

이 단계에서는 plugin registry로 올리지 않는다.

### WP-2B: node presentation resolver 도입

신규 helper:

```ts
resolveNodePresentation(node, layoutState, edges)
```

역할:

- group child absolute position 계산
- group bounds 계산
- concept 내부 entry chip 목록 계산
- collapsed 여부 반영

초기에는 `NetworkWorkspace.tsx` 내부 helper로 구현한다.

---

## 5. Group MVP

### WP-3A: group 렌더링

동작:

- 배경 없음
- 경계만 렌더
- edit mode에서 resize 가능
- group 안에 group 포함 가능
- nested depth 제한 없음
- cycle만 금지

시각:

- border only
- 기존 card fill 제거
- label은 상단 좌측 고정

### WP-3B: 포함 관계 생성

초기 UX:

- node를 group 안에 drop하면 `core:contains` edge 생성 또는 갱신
- drop 시 확정
- hierarchy mode에서는 마그네틱 anchor preview를 제공한다
- free mode에서는 drop 위치 기준 자유 배치로 확정한다

포함 판정:

- 우선 `node center`가 group bounds 안에 있으면 포함으로 처리

### WP-3C: 자식 좌표

포함된 순간:

- child absolute position과 parent group frame으로부터 `localX`, `localY` 계산
- 저장은 layout position JSON에 반영

렌더 시:

- `group absolute position + localX/localY`로 child absolute position 계산

### WP-3D: 그룹 이동/리사이즈

- group 이동 시 자식은 같이 움직인다
- 이는 child가 local 좌표를 가지므로 자동 성립한다
- 리사이즈는 우선 bounds만 바꾼다
- 초기 버전에서는 자식 좌표 비례 스케일 없음

### WP-3E: collapse / expand

- group은 expanded / collapsed 상태를 가진다
- collapsed 상태에서는 child를 직접 렌더하지 않는다
- collapsed card에는 요약 정보만 남긴다
- collapsed / expanded 상태 저장은 우선 layout JSON 안에서 처리한다

---

## 6. Group Hierarchy Mode

`tree`는 별도 node type이 아니라 `groupLayoutMode = 'hierarchy'`로 처리한다.

### WP-4A: hierarchy mode 저장

group node의 `position_json`에 저장:

```json
{
  "groupLayoutMode": "hierarchy"
}
```

### WP-4B: hierarchy 배치

입력:

- 동일 group 내부 child 집합
- child 간 `core:contains` edge 또는 일반 directed edge

초기 규칙:

- direct child만 hierarchy 대상
- level-based vertical layout
- sibling horizontal spacing 적용

### WP-4C: 마그네틱 + 미세조정

hierarchy mode에서 node drop 시:

- 가장 가까운 hierarchy anchor를 계산
- anchor에 snap
- 사용자가 약간 벗어나게 두면 `local offset`으로 저장

즉:

- 자동 배치
- 수동 미세조정

둘 다 `anchor + local offset` 모델로 처리한다.

---

## 7. Entry Portal

### WP-5A: 구조

concept -> network 연결은 hidden child node를 만들지 않고 edge로 표현한다.

예:

- source: concept node
- target: network object node 또는 network object를 대표하는 연결 대상
- `system_contract = 'core:entry_portal'`

초기 구현에서는 현재 edge 모델을 유지하면서, concept node가 가진 outgoing `core:entry_portal` edge를 읽어 chip 목록을 만든다.

### WP-5B: 렌더

concept node 내부에 항상 보이는 chip/button 목록을 둔다.

동작:

- browse mode: 클릭 시 navigate
- edit mode: 클릭 네비게이션 비활성, 편집 UX만 유지

### WP-5C: 생성 UX

- object/network를 concept 위로 drop하면 attach
- concept node context menu에서:
  - 새 network 생성 후 attach
  - 기존 network 연결

---

## 8. Edge 표현 확장

### WP-6A: 직선 edge에서 route 기반으로 전환

현재:

- center-to-center line

변경:

- route 계산 helper를 통해 렌더

초기 route 종류:

- `straight`
- `orthogonal`
- `hidden`

### WP-6B: hierarchy에서 orthogonal route 도입

tree/hierarchy 표현 시:

- 상하 anchor 기준
- 수직-수평 꺾인 edge

이 단계에서는 route는 계산만 하고 DB에 저장하지 않는다.
필요 시 이후 `layout_edges.visual_json` 확장으로 승격한다.

---

## 9. 구현 순서

### Phase 1 — 구조 기반

1. `edges.system_contract` 추가
2. `box -> group` 치환
3. edge CRUD/IPC/type 전체 연결
4. contract edge hidden fallback

완료 기준:

- migration 적용 후 기존 데이터가 깨지지 않는다
- 기존 `box` node는 모두 `group`으로 치환된다
- edge create/get/update 경로에서 `system_contract`를 round-trip 할 수 있다
- `system_contract = null`인 기존 edge는 동작과 렌더가 바뀌지 않는다
- unknown `system_contract`는 일반 edge fallback으로 처리된다
- `core:contains`, `core:entry_portal` edge는 일단 숨김 처리까지 연결된다
- shared type / repository / IPC / preload / renderer service 경로가 모두 연결된다
- 기존 edge editor, relation type editor, network open 경로가 회귀하지 않는다

### Phase 2 — group MVP

1. group 시각 변경
2. resize handles
3. drop-to-contain
4. local coordinate 저장/복원

완료 기준:

- `group`는 border-only로 렌더되고 배경 fill이 없다
- edit mode에서 `group` resize handle이 보이고 크기 변경이 저장/복원된다
- node를 group 안에 drop하면 `core:contains` edge가 생성 또는 갱신된다
- 포함된 child는 다시 network를 열어도 동일 group 내부 위치로 복원된다
- 포함된 child를 group 밖으로 빼면 detach 규칙이 동작한다
- group 이동 시 child가 함께 이동한다
- nested group이 동작한다
- nested group 안의 child도 위치 복원이 된다
- selection, drag, context menu가 group / child 조합에서 깨지지 않는다

### Phase 3 — hierarchy mode

1. `groupLayoutMode` UI 추가
2. hierarchy anchor 계산
3. orthogonal edge route
4. anchor + offset 저장

완료 기준:

- group별로 `free` / `hierarchy` mode 전환이 가능하다
- hierarchy mode 진입 시 동일 group 내 child가 자동 정렬된다
- hierarchy mode에서 hierarchy anchor preview가 보인다
- drop 시 가장 가까운 anchor로 snap 된다
- snap 이후 local offset 저장으로 미세조정이 가능하다
- hierarchy mode 상태가 저장/복원된다
- hierarchy mode에서 edge route가 orthogonal로 보인다
- 같은 group 안의 일반 free child와 hierarchy child가 혼재해도 렌더가 무너지지 않는다
- hierarchy 계산이 nested group 경계 밖 child를 잘못 끌어오지 않는다

### Phase 4 — entry portal

1. `core:entry_portal` edge 저장
2. concept chip 렌더
3. browse mode navigation
4. attach UX

완료 기준:

- concept node 내부에 attach된 network chip 목록이 항상 보인다
- concept 하나에 여러 network가 attach되어도 chip 목록으로 표현된다
- browse mode에서 chip 클릭 시 해당 network로 이동한다
- edit mode에서는 chip 클릭 네비게이션이 비활성화된다
- concept 위로 network/object drop 시 attach가 생성된다
- context menu에서 새 network 생성 후 attach가 가능하다
- context menu에서 기존 network 연결이 가능하다
- `core:entry_portal` edge는 일반 선으로 보이지 않는다
- network를 다시 열어도 attach된 chip 목록이 복원된다

### Phase 5 — collapse / polish

1. group collapse/expand
2. collapsed summary 표현
3. child/edge visibility 정리
4. selection/hit-test 보정

완료 기준:

- group collapse / expand 상태가 저장/복원된다
- collapsed group은 child를 직접 렌더하지 않고 summary만 보여준다
- collapsed 상태에서 child 관련 contract edge가 화면을 오염시키지 않는다
- expanded / collapsed 전환 시 레이아웃 점프가 과도하지 않다
- collapsed group 선택, drag, resize, context menu가 모두 동작한다
- nested group이 일부 collapsed여도 hit-test가 깨지지 않는다
- selection box가 collapsed / expanded / nested 조합에서 안정적으로 동작한다
- edge hit-test와 node hit-test 우선순위가 깨지지 않는다
- 전체 흐름에서 browse / edit mode 차이가 일관되게 유지된다

---

## 10. 초기 hardcode 범위

이번 구현에서는 아래를 허용한다.

- `NetworkWorkspace.tsx` 내부 helper 추가
- `EdgeLayer` route 분기 하드코딩
- `group` / `entry_portal` contract key 코어 문자열 하드코딩

이번 구현에서 하지 않는 것:

- 완성된 plugin registry
- contract registry 표준화
- port/anchor 범용 시스템
- algorithm node 전용 표현 모델

이것들은 group/tree가 실제로 돌아간 뒤 다음 단계에서 정리한다.

---

## 11. 후속 정리 포인트

group/tree 구현이 안정화되면 그때 아래를 일반화한다.

- edge presentation resolver → plugin hook
- node presentation resolver → plugin hook
- contract key registry
- edge route persistence
- node geometry / port / slot 시스템

즉 현재 계획은:

- **지금 돌아가게 만든다**
- **이후 실제 사용 패턴이 나온 뒤 일반화한다**
