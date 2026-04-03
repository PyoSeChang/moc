# File Entity & Node Metadata

> 캔버스 위의 파일/폴더 노드에 메타데이터를 부여하고,
> 파일/폴더를 Concept과 대등한 1급 엔티티로 승격하는 설계.
> ConceptFile 테이블은 제거한다.

---

## 1. 배경과 동기

현재 캔버스에서 파일/폴더를 노드로 배치할 수 있지만, 경로(file_path, dir_path) 문자열만 저장된다.

문제:
- 특정 디렉토리가 artifact 저장소인지, 캔버스와 1:1 대응 폴더인지 기술할 수 없다.
- Narre(AI agent)가 파일/폴더의 맥락을 알 수 없다.
- PDF TOC 같은 파일 고유 속성을 저장할 공간이 없다.
- ConceptFile(concept ↔ 파일 첨부)은 UI에서 create/delete가 구현되지 않아 사실상 미사용.

---

## 2. 핵심 결정

### File을 1급 엔티티로

Concept처럼 File도 자기 자신의 테이블과 속성을 갖는다. 파일과 디렉토리를 하나의 엔티티로 통합 관리한다.

title, icon, color는 별도 컬럼 불필요 — path에서 파생한다 (파일명, 확장자 기반 아이콘, 디렉토리 패널과 동일한 방식).

### 2레이어 메타데이터

| 레이어 | 위치 | 성격 | 예시 |
|--------|------|------|------|
| 파일 고유 | `files.metadata` | 파일 자체의 속성. 캔버스 무관. | PDF TOC, description, topics |
| 노드 컨텍스트 | `canvas_nodes.metadata` | 이 캔버스에서 이 노드의 역할. 같은 파일이라도 캔버스마다 다름. | "이 캔버스의 참고 교재. 3~5장 관련" |

### ConceptFile 제거

concept_files 테이블과 관련 코드(repository, IPC, preload, service, UI) 전부 삭제. Concept ↔ File 관계는 캔버스 위에서 Edge로 표현한다.

---

## 3. 데이터 모델 변경

### 신규: `files` 테이블

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,             -- 프로젝트 root_dir 기준 상대경로
  type TEXT NOT NULL,             -- 'file' | 'directory'
  metadata TEXT,                  -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, path)
);
```

### 변경: `canvas_nodes` 테이블

```
제거: file_path TEXT
제거: dir_path TEXT
추가: file_id TEXT REFERENCES files(id) ON DELETE CASCADE
추가: metadata TEXT  -- JSON
```

polymorphic 구조: `concept_id | file_path | dir_path` (3종) → `concept_id | file_id` (2종)으로 단순화.

### 제거: `concept_files` 테이블

DROP TABLE. 관련 코드 전부 삭제.

### 전체 구조 (변경 후)

```
Project
 ├── Concept (title, color, icon, archetype_id)
 ├── File (path, type='file'|'directory', metadata)
 ├── Canvas
 │     ├── CanvasNode (concept_id | file_id, metadata)
 │     └── Edge
 └── Type System (Archetype, RelationType, CanvasType)
```

---

## 4. Metadata Schema

### File.metadata (파일 고유)

```jsonc
{
  // 서술적 — agent가 읽고 추론하는 용도
  "description": "자바 디자인 패턴 교재. GoF 23개 패턴을 예제 중심으로 설명.",
  "content_type": "textbook",    // 확장자 너머의 의미적 분류 (자유 텍스트)
  "topics": ["design-patterns", "java", "GoF"],

  // 구조적 — 파싱/분석 결과, UI가 직접 소비
  "pdf_toc": {
    "entries": [
      { "title": "1장 서론", "page": 1, "level": 0 },
      { "title": "1.1 배경", "page": 3, "level": 1 }
    ],
    "page_count": 245,
    "analyzed_at": "2026-04-03T..."
  }
  // 향후 확장: "keywords", "outline", ...
}
```

- `description`: 이 파일이 뭔지. agent가 가장 먼저 읽는 필드.
- `content_type`: 의미적 분류. "lecture-notes", "api-reference", "config", "meeting-log" 등.
- `topics`: 검색/필터용. agent가 관련 파일 찾을 때 활용.
- `pdf_toc`: UI(PDF Viewer)가 직접 렌더링하는 구조적 데이터.

디렉토리 예시:
```jsonc
{
  "description": "프론트엔드 소스코드. React + TypeScript.",
  "content_type": "source-code",
  "topics": ["frontend", "react"]
}
```

### CanvasNode.metadata (노드 컨텍스트)

```jsonc
{
  "description": "이 캔버스에서 다루는 패턴들의 원본 교재. 3~5장이 관련.",
  "relevant_pages": [3, 4, 5]   // file 노드일 때, 이 캔버스 맥락에서 관련 페이지
}
```

- `description`: 이 캔버스에서 이 노드가 왜 여기 있는지. 자연어. agent가 바로 추론에 사용.
- `relevant_pages`: PDF 노드 한정. 이 캔버스 맥락에서 관련되는 페이지.
- role 같은 enum은 넣지 않음. agent는 description에서 역할을 추론.

---

## 5. 편집 UI

### FileMetadataEditor

별도 에디터 탭 (EditorTabType 추가). 두 레이어를 한 곳에서 관리.

```
FileMetadataEditor
├── File.metadata (파일 고유)
│   ├── description        [TextArea]
│   ├── content_type       [Input]
│   ├── topics             [태그 입력]
│   └── pdf_toc            [읽기 전용 표시]
│
├── CanvasNode.metadata (이 캔버스에서의 역할)
│   ├── description        [TextArea]
│   └── relevant_pages     [입력]
│
└── tab context: { file_id, canvas_id }
```

같은 파일이라도 캔버스마다 CanvasNode.metadata가 다르므로, EditorTab에 `file_id + canvas_id`를 넘겨 어떤 캔버스 컨텍스트인지 식별한다.

### 진입 경로

- 캔버스에서 file/dir 노드 **더블클릭** → 기존대로 파일 에디터 (PDF Viewer, MarkdownEditor 등)
- 캔버스에서 file/dir 노드 **우클릭** → 컨텍스트 메뉴 → **"메타데이터 편집"** → FileMetadataEditor 탭 열림

---

## 6. File 엔티티 생명주기

### 생성

캔버스에 파일/폴더를 드래그할 때 자동 생성.

같은 파일이 여러 캔버스에 올라가도 File 레코드는 하나 (`UNIQUE(project_id, path)`), CanvasNode만 여러 개 생성.

### path 검증 (프로젝트 열 때)

프로젝트 열 때 기존 path 검증 로직(root_dir, module_directories.dir_path)에 `files.path` 검증을 통합.

디스크에 해당 경로가 존재하지 않으면 "missing path"로 감지.

### Missing path 처리

앱이 파일시스템 watcher를 사용하지 않으므로, 프로젝트 열 때 "이 path가 디스크에 있냐 없냐"만 판별 가능. 삭제/이동/이름변경 구분 불가.

감지된 missing path에 대해 사용자에게 선택지 제공:

| 케이스 | 설명 | 사용자 선택지 |
|--------|------|--------------|
| 파일/폴더 삭제 | 디스크에서 완전히 사라짐 | 재연결 (다른 경로 지정) / DB에서 삭제 / 무시 |
| 이름 변경 | 경로가 달라짐 (앱은 삭제와 구분 불가) | 재연결 / 삭제 / 무시 |
| 이동 | 다른 위치로 이동 (앱은 삭제와 구분 불가) | 재연결 / 삭제 / 무시 |
| 상위 폴더 변경 | 상위 폴더 이름/위치 변경으로 하위 경로 전부 영향 | 일괄 경로 업데이트 / 개별 처리 |

검증 대상 경로 전체:
- `project.root_dir` — 없으면 경고만 (삭제하면 데이터 전체 소실)
- `module_directories.dir_path` — 없으면 모듈에서 제거 가능
- `files.path` — 없으면 위 선택지 제공

---

## 7. Migration 계획 (009)

1. `files` 테이블 생성
2. 기존 `canvas_nodes`의 `file_path`, `dir_path` 데이터를 `files` 레코드로 마이그레이션
3. `canvas_nodes` 테이블 재생성 (`file_path`, `dir_path` 제거, `file_id`, `metadata` 추가)
4. 기존 canvas_nodes 데이터의 file_path/dir_path → file_id 매핑
5. `concept_files` 테이블 DROP

---

## 8. 코드 변경 범위

7-layer 패턴:

| Layer | 할 일 |
|-------|------|
| **migration** | 009: files 테이블, canvas_nodes 재구성, concept_files 제거 |
| **types** | `File` 타입 신규, `CanvasNode`에 file_id/metadata 반영, `ConceptFile` 타입 제거 |
| **constants** | IPC 채널 추가 (`FILE.*`), `CONCEPT_FILE.*` 채널 제거 |
| **repository** | `FileRepository` 신규, `CanvasNodeRepository` file_id/metadata 지원, `ConceptFileRepository` 제거 |
| **IPC** | file IPC 핸들러 추가, concept-file IPC 제거 |
| **preload** | file API 노출, conceptFile API 제거 |
| **renderer** | FileMetadataEditor 신규, 노드 컨텍스트 메뉴에 "메타데이터 편집" 추가, ConceptEditor에서 ConceptFile 관련 코드 제거, path 검증 UI |

추가:
- **MCP** — File CRUD + metadata 업데이트 도구 (후순위)
- **PDF TOC** — Narre `/index` 커맨드 → File.metadata.pdf_toc 저장 → PDF Viewer TOC 패널 (별도 이슈)

---

## 9. 스코프 구분

### 이번 스코프 (이 worktree)

- files 테이블 + migration
- canvas_nodes 변경 (file_id, metadata)
- concept_files 제거
- FileRepository + IPC + preload
- FileMetadataEditor UI
- 노드 컨텍스트 메뉴 "메타데이터 편집"
- path 검증 통합 + missing path 처리 UI

### 후속 이슈

- MCP 도구 확장 (File CRUD, metadata 업데이트)
- PDF TOC 플로우 (Narre `/index` → 파싱 → 저장 → PDF Viewer TOC 패널)
