---
name: release
description: >
  Release a package: bump version, create changelog, update versions.md, commit, and tag.
  TRIGGER when: user says '/release', 'release {pkg}', 'bump {pkg}', '버전 올려', '릴리스', or asks to release/version-bump a specific package.
  DO NOT TRIGGER when: user just asks about current versions, reads changelog, or discusses version strategy.
---

# Release

Per-package release workflow for Netior monorepo.

## Package Map

| short | directory | package.json name |
|-------|-----------|-------------------|
| shared | packages/shared | @netior/shared |
| core | packages/netior-core | @netior/core |
| mcp | packages/netior-mcp | @netior/mcp |
| narre-server | packages/narre-server | @netior/narre-server |
| desktop-app | packages/desktop-app | @netior/desktop-app |
| narre-eval | packages/narre-eval | @netior/narre-eval |

## Workflow

### 1. Parse Input

Extract from user request:
- **package**: short name (see map above). If ambiguous, ask.
- **bump type**: `patch` / `minor` / `major`. If not specified, ask.

### 2. Pre-check

- `git status` must be clean (no uncommitted changes). If dirty, warn and stop.
- Read `packages/{directory}/package.json` to get current version.
- Calculate new version from bump type.
- Confirm with user: "{short} {current} -> {new}, proceed?"

### 3. Version Bump

Update `version` field in `packages/{directory}/package.json`.

### 4. Classify Release Impact

Before writing the changelog, classify this release:

#### 4a. Impact

Determine the scope of this release:

- `local` — changes stay within this package. No other package is affected.
- `cross-package` — changes may affect other packages or shared contracts.
- `breaking` — consumers must update their code to adapt.

#### 4b. Contracts

Identify which contracts changed (omit if none):

- `api` — HTTP endpoint shape, request/response format
- `ipc` — Electron IPC channel payload
- `schema` — DB schema or migration
- `storage` — file format, directory layout
- `prompt` — system prompt metadata shape
- `tooling` — CLI interface, MCP tool shape

#### 4c. Affects

List packages or subsystems affected by this release (omit for `impact: local`):

- `shared`, `core`, `mcp`, `narre-server`, `desktop-app`, `narre-eval`

#### 4d. Followup (optional)

If `impact` is `cross-package` or `breaking`, note recommended follow-up actions:

- migration check
- smoke test rerun
- eval suite rerun

### 5. Create Changelog

Create `changelog/{short}/v{new-version}.md` with this exact format:

```markdown
---
package: "{short}"
version: "{new-version}"
date: {YYYY-MM-DD}
type: {patch|minor|major}
summary: "{한줄 한국어 요약}"
impact: {local|cross-package|breaking}
contracts: [{comma-separated list, e.g. ipc, prompt}]
affects: [{comma-separated list, e.g. narre-server, narre-eval}]
followup: [{comma-separated list, optional}]
---

## Breaking Changes
- ...

## Features
- ...

## Fixes
- ...

## Internal
- ...

## Cross-Package Impact
- ... (include this section only when impact is cross-package or breaking)
```

To populate content:
1. Find the previous version tag: `git tag --list '{short}@*' --sort=-v:refname | head -1`
2. If tag exists: `git log {tag}..HEAD --oneline -- packages/{directory}/`
3. If no tag: `git log --oneline -- packages/{directory}/` (compare against previous changelog)
4. Categorize commits into sections. Omit empty sections.
5. Write a concise Korean `summary` capturing the key change.

Frontmatter rules:
- `impact` defaults to `local` if unclear.
- `contracts` and `affects` may be empty `[]` for local changes.
- `followup` is optional; omit the field entirely if not needed.
- Omit empty body sections (e.g., no Breaking Changes section if none exist).

### 6. Update versions.md

Read `.claude/rules/versions.md`, update the yaml block for this package:
- Set `version` to new version
- Set `type` to bump type
- Set `summary` to the changelog's `summary` value
- Set `impact` to the changelog's `impact` value
- Set `contracts` to the changelog's `contracts` value

### 7. Commit and Tag

```bash
git add packages/{directory}/package.json changelog/{short}/v{new-version}.md .claude/rules/versions.md
git commit -m "Release {short}@{new-version}"
git tag {short}@{new-version}
```

Tag format: `{short}@{version}` (e.g., `shared@0.2.0`)

### 8. Summary

Print:
- Package: {short}
- Version: {current} -> {new}
- Impact: {impact}
- Changelog: changelog/{short}/v{new-version}.md
- Tag: {short}@{new-version}

Do NOT push. User decides when to push.
