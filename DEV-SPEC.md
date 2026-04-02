# Map of Concepts — 개발 기획서

> Culturium 후속 데스크탑 앱.
> 캔버스 위에 노드로 개념을 정리하고, 인스턴스 데이터는 파일(.md, .pdf 등)로 관리한다.

---

## 1. 전환 동기

Culturium의 세 가지 구조적 문제가 오픈소스화를 막고 있다.

**백엔드 종속** — 데스크탑 앱이지만 백엔드가 필요해지면 self-contained가 아니다.

**SQLite 데이터 격리** — 모든 데이터가 DB에 갇혀 있어서 프로젝트 단위 공유/이식이 안 된다. 소설이든, 개발 프로젝트든, 연구든 — 다른 사람에게 전달하려면 앱이 필수가 된다.

**culture.json 복잡도** — Culturium의 핵심 가치가 "커뮤니티가 Culture를 만들고 공유한다"인데, culture.json의 진입장벽이 너무 높아서 그 가치가 실현될 수 없다.

세 문제 모두 **"오픈소스 생태계를 만들 수 없다"**로 수렴한다.

---

## 2. 핵심 개념

### Map of Concepts

캔버스 위에 개념(Concept)을 노드로 배치하고, 노드 간 연결로 관계를 표현한다. Culturium의 네트워크 에디터와 형태가 유사하지만, 인스턴스 데이터가 DB 행이 아닌 **파일**이라는 점이 근본적으로 다르다.

### 두 개의 저장 레이어

| 레이어 | 위치 | 역할 | 이식성 |
|--------|------|------|--------|
| 메타데이터 | AppData (SQLite) | 프로젝트, 개념, 캔버스, 노드 배치, 엣지 | 앱 종속 |
| 인스턴스 데이터 | 사용자 프로젝트 디렉토리 | .md, .pdf, .png 등 실제 콘텐츠 | 완전 이식 |

**프로젝트 디렉토리는 순수한 사용자 파일만 존재한다.** 앱이 숨김 폴더나 메타데이터를 프로젝트 디렉토리에 쓰지 않는다. 캔버스가 구조를 담당하고, 파일시스템은 순수 저장소다.

### 왜 이 구조인가

- 프로젝트 폴더를 git push하거나 zip으로 보내면 누구나 파일을 열 수 있다 — 앱 없이도
- SQLite는 앱의 "작업 환경"일 뿐이고, 사용자의 데이터 소유권은 파일시스템에 있다
- culture.json 없이도 캔버스 위 노드 + 파일이라는 직관적 구조로 충분하다

### 알려진 제한: 이식성 갭

캔버스 구조가 AppData SQLite에만 존재하므로, 프로젝트 폴더 공유 시 **파일은 전달되지만 캔버스 구조는 전달되지 않는다**. 이것은 알려진 트레이드오프이며, 후순위에서 캔버스 export/import 또는 선택적 메타데이터 내보내기로 해결한다.

---

## 3. 데이터 모델

### 엔티티 관계

```
Project ───1:N──── Canvas ───1:N──── CanvasNode ───N:M──── Edge
   │                                      │
  1:N                                 concept_id FK
   │                                      │
Concept ─────────────────────────────── (참조)
   │
  1:N
   │
ConceptFile (file_path: 프로젝트 root_dir 기준 상대경로)
```

### 테이블 구조

- `projects` — id, name, root_dir, created_at, updated_at
- `concepts` — id, project_id(FK), title, color, icon, created_at, updated_at
- `canvases` — id, project_id(FK), name, viewport_x, viewport_y, viewport_zoom, created_at, updated_at
- `canvas_nodes` — id, canvas_id(FK), concept_id(FK), position_x, position_y, width, height, UNIQUE(canvas_id, concept_id)
- `edges` — id, canvas_id(FK), source_node_id(FK→canvas_nodes), target_node_id(FK→canvas_nodes), created_at
- `concept_files` — id, concept_id(FK), file_path, created_at

### 엔티티 설명

**Project** — 사용자가 지정한 디렉토리에 대한 참조. 이름과 디렉토리 경로(root_dir)를 가진다.

**Concept** — 프로젝트에 종속된 개념. 제목, 색상 등 메타데이터를 가진다. 여러 캔버스에서 재사용 가능. 크로스 프로젝트 재사용은 후순위.

**Canvas** — 프로젝트에 속한다. 프로젝트당 여러 개 생성 가능. 뷰포트 상태(pan/zoom)를 저장한다.

**CanvasNode** — 캔버스 위에 배치된 개념. 위치와 크기를 가진다. 하나의 캔버스에 같은 개념은 한 번만 등장한다.

**Edge** — 캔버스 종속 연결. 타입 구분 없이 단순 연결. 캔버스 A에서 두 개념을 연결해도 캔버스 B에는 영향 없다.

**ConceptFile** — 개념과 파일의 연결. 파일 경로는 프로젝트 root_dir 기준 상대 경로. 개념이 프로젝트 종속이므로 별도 project_id 불필요.

### 핵심 설계 결정

- **MVP에서 Concept은 프로젝트 종속** — `project_id` FK 있음. 크로스 프로젝트 재사용은 후순위.
- **Edge는 캔버스 종속** — 같은 두 개념이라도 캔버스마다 다른 연결을 가질 수 있다. 각 캔버스는 독립적인 "관점"이다.
- **ConceptFile의 file_path는 상대경로** — 프로젝트 root_dir 기준. 이식성 보장.
- **UI 컴포넌트는 desktop-app 내부** — shared 패키지는 순수 타입/상수만.

---

## 4. 아키텍처

### 기술 스택

Culturium과 동일. 변경 없음.

- Electron + electron-vite
- React + TypeScript
- Zustand
- better-sqlite3
- Tailwind CSS + semantic tokens
- pnpm workspaces + turborepo

### 모노레포 구조

```
packages/
├── shared/           타입, 상수 공유 (desktop-app ↔ narre-server)
├── desktop-app/      Electron 데스크탑 앱
└── narre-server/     MCP/Agent 서버 (MVP 이후)
```

narre-server가 향후 추가될 것이기 때문에 모노레포로 시작한다. shared 패키지를 통해 타입을 공유한다.

### Electron 레이어 구조

Culturium과 동일한 3레이어 (main → preload → renderer). IPC 패턴도 동일 (`IpcResult<T>`).

**Culturium 대비 추가되는 것:**
- **File Service** (main process) — 프로젝트 디렉토리 파일 읽기/쓰기/감시. Culturium에서는 모든 데이터가 SQLite였으므로 불필요했던 레이어.

**Culturium 대비 제거되는 것:**
- Culture 로딩/검증 레이어
- Schema/Synapse 서비스
- Relation store (글로벌 관계 그래프)

### 캔버스 엔진

Culturium 캔버스 엔진을 기반으로 하되, Schema/Synapse/Culture 의존성을 제거하고 경량화한다.

**계승:**
- Pan/Zoom, 노드 렌더링, 엣지 렌더링, 드래그 & 드롭, 다중 선택, 배경 그리드, 뷰포트 상태 저장

**제거:**
- Lobe 시스템 → 다중 캔버스로 대체
- system_type 기반 노드/엣지 렌더링 분기 → 단일 타입
- Culture 기반 레이아웃 모드 (timeline 등) → MVP에서 자유 배치만

### 에디터 시스템

Culturium의 culture 기반 에디터 선택(editor 필드) → **확장자 기반 에디터 선택**으로 전환.

**MVP 에디터:**
- 마크다운 에디터 (.md) — 편집 + 미리보기
- 텍스트 에디터 (.txt, .json, .yaml 등) — 코드 편집
- 이미지 뷰어 (.png, .jpg 등) — 읽기 전용
- PDF 뷰어 (.pdf) — 읽기 전용
- 미지원 확장자 → "외부 앱으로 열기" 폴백

에디터 독(dock)은 Culturium 구조를 계승한다: 캔버스 옆에 도킹되는 탭 기반 패널.

---

## 5. MVP 기능 범위

### 포함

| 영역 | 기능 |
|------|------|
| 프로젝트 | 디렉토리 선택으로 생성, 열기/닫기, 참조 삭제 |
| 캔버스 | 다중 캔버스 생성/삭제/이름변경, Pan/Zoom, 뷰포트 저장 |
| 개념 노드 | 캔버스에서 생성, 제목/색상 편집, 드래그 이동, 삭제, 다른 캔버스에 추가 |
| 엣지 | 노드 간 연결 생성/삭제 (단순 연결) |
| 파일 | 프로젝트 디렉토리 트리 표시, 파일 ↔ 개념 연결/해제, 외부 변경 감지 |
| 에디터 | 확장자 기반 자동 선택, 마크다운/텍스트/이미지/PDF, 탭 다중 편집 |
| 검색 | 개념 제목 검색 |

### 미포함 (후순위)

| 기능 | 비고 |
|------|------|
| MCP 서버 | narre-server 패키지. Agent가 SQLite 메타데이터 참조 |
| Agent 인터랙션 | Claude Artifacts 방식으로 스키마 선언 대체 |
| 캔버스 export/import | 이식성 갭 해결 |
| 자동 레이아웃 | 트리, 타임라인 등 |
| 태그/필터 | |
| 엣지 타입/라벨 | |
| 버전 히스토리 | |
| 협업 | |

---

## 6. Culturium 마이그레이션

### 가져오는 것

| 대상 | 작업 |
|------|------|
| 캔버스 엔진 (Canvas, NodeCard, Background 등) | Schema/Synapse 의존성 제거, 경량화 |
| 공유 UI 컴포넌트 (Button, Input, Modal 등) | 그대로 이식 |
| 테마 시스템 (globals.css, tailwind.config, semantic tokens) | 그대로 이식 |
| IPC 패턴 (IpcResult, preload bridge 구조) | 패턴 유지, 채널 재정의 |
| Zustand store 패턴 | 패턴 유지, 스토어 재작성 |
| electron-vite 설정 | 그대로 이식, path alias 조정 |
| i18n 시스템 | 그대로 이식, 키 재정의 |

### 버리는 것

| 대상 | 이유 |
|------|------|
| Culture 시스템 (culture/, Zod schemas, culture store) | 제거. 향후 Agent가 대체 |
| Schema/Synapse DB 모델 + repositories | Concept/Edge 모델로 교체 |
| 에디터 시스템 (dynamic-form, static-form, text) | 확장자 기반으로 교체 |
| Lobe 시스템 | 다중 캔버스로 교체 |
| Relation store | 단순 edge 쿼리로 충분 |
| Sub-schema 시스템 | 불필요 |
| Backend (packages/backend, packages/web) | 불필요 |

---

## 7. 개발 순서

### Phase 1: 프로젝트 골격

새 레포 생성. 모노레포 설정(pnpm + turbo). electron-vite 설정. shared 패키지 초기화. SQLite 연결 + 마이그레이션 시스템 구축.

→ 앱이 빈 화면으로 실행되는 상태

### Phase 2: 데이터 레이어

SQLite 스키마 생성. Repository 구현. IPC 핸들러. Preload bridge.

→ Renderer에서 CRUD 호출이 가능한 상태

### Phase 3: 기본 UI 셸

테마 시스템 이식. 사이드바 (프로젝트/캔버스 목록). 빈 캔버스 영역. 에디터 독 프레임.

→ 레이아웃이 잡힌 상태

### Phase 4: 캔버스 엔진

Culturium 캔버스 코드 이식 + 경량화. 개념 노드 렌더링. Pan/Zoom. 노드 드래그. 엣지 렌더링 + 생성/삭제.

→ 캔버스에서 개념 정리가 가능한 상태

### Phase 5: 파일 시스템

File service 구현. 파일 트리 사이드바. 파일 ↔ 개념 연결. 파일 변경 감시.

→ 프로젝트 디렉토리 파일을 앱에서 탐색하고 개념에 연결하는 상태

### Phase 6: 에디터

마크다운 에디터. 텍스트 에디터. 이미지/PDF 뷰어. 탭 시스템. 확장자 기반 에디터 자동 선택.

→ 파일을 앱 내에서 편집할 수 있는 상태 = **MVP 완성**

### Phase 7: 폴리싱

검색. 크로스 캔버스 개념 재사용 UI. 단축키. 버그 수정. 성능 최적화.
