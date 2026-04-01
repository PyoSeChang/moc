# Narre Eval Scenarios

## Scenario Format

Each scenario defines: seed data, user turns, expected DB state, and qualitative rubrics.

---

## 01: Init Project (빈 프로젝트 타입 세팅)

**Seed**: empty project (no archetypes, relation types, canvas types)

```json
{
  "project": { "name": "조선시대", "root_dir": "C:/tmp/eval-project" }
}
```

**Turns**:
1. User: "역사 프로젝트야. 인물, 사건, 장소 아크타입이 필요해. 만들어줘."

**Expected DB**:
- `list_archetypes`: 3개 이상, names include 인물, 사건, 장소
- 각 archetype에 icon, color가 설정되어 있으면 가산점

**Expected Response**:
- 인물, 사건, 장소 모두 언급
- 에러 없음

**Qualitative Rubrics**:
1. 사용자가 요청한 3개 아크타입을 정확히 생성했는가 (1-5)
2. 생성 결과를 명확히 보고했는가 (1-5)

---

## 02: Type Update (아크타입 이름 변경)

**Seed**: project with 3 archetypes

```json
{
  "project": { "name": "조선시대", "root_dir": "C:/tmp/eval-project" },
  "archetypes": [
    { "name": "인물", "icon": "user", "color": "#4A90D9" },
    { "name": "사건", "icon": "calendar", "color": "#E74C3C" },
    { "name": "장소", "icon": "map-pin", "color": "#2ECC71" }
  ]
}
```

**Turns**:
1. User: "사건 아크타입을 문헌으로 이름 바꿔줘"

**Expected DB**:
- `list_archetypes`: 문헌 exists, 사건 absent
- 문헌의 icon, color가 기존 사건 값 유지 (icon=calendar, color=#E74C3C)

**Expected Response**:
- 문헌 언급
- 에러 없음

**Qualitative Rubrics**:
1. 기존 아크타입의 이름만 변경하고 다른 속성은 유지했는가 (1-5)
2. 변경 결과를 명확히 보고했는가 (1-5)

---

## 03: Cascade Delete (종속 삭제 경고)

**Seed**: project with archetype + linked concept

```json
{
  "project": { "name": "조선시대", "root_dir": "C:/tmp/eval-project" },
  "archetypes": [
    { "name": "인물", "icon": "user", "color": "#4A90D9" }
  ],
  "concepts": [
    { "title": "세종대왕", "archetype_name": "인물" }
  ]
}
```

**Turns**:
1. User: "인물 아크타입 삭제해줘"
2. (Narre가 경고하면) User: "응, 삭제해"

**Expected DB**:
- `list_archetypes`: 인물 absent
- `list_concepts`: 세종대왕 still exists (archetype_id nulled)

**Expected Response**:
- 에러 없음

**Qualitative Rubrics**:
1. 종속 데이터(세종대왕 개념)가 있음을 경고했는가 (1-5)
2. 삭제 확인을 구한 후 실행했는가 (1-5)

---

## Adding New Scenarios

Follow this format:
1. **Seed** — JSON for harness setup
2. **Turns** — sequential user messages (respond dynamically to Narre's questions)
3. **Expected DB** — what to verify with moc-mcp tools after conversation
4. **Expected Response** — keywords, error checks
5. **Qualitative Rubrics** — 1-5 scale criteria for conversation quality
