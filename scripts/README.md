# Scripts

- `node scripts/worktree-debug.mjs list`
  Show debug presets, managed worktrees under `.claude/worktrees`, and any other linked worktrees.
- `node scripts/worktree-debug.mjs create <name>`
  Create a dedicated worktree at `.claude/worktrees/<name>` on branch `worktree-<name>`.
- `node scripts/worktree-debug.mjs create-set debug`
  Create the standard debug split: `desktop-debug`, `renderer-debug`, `service-debug`, `narre-debug`, `terminal-debug`, `integration-debug`.
- `node scripts/worktree-debug.mjs create-set debug --dry-run`
  Print the planned `git worktree add` commands without creating anything.
- `pnpm worktree:list`
  Run the repo-local worktree status view.
- `pnpm worktree:new -- <name>`
  Create one named worktree with repo conventions.
- `pnpm worktree:debug -- --dry-run`
  Preview the default debug worktree set from `package.json`.
- `node scripts/rename-brand.mjs`
  Dry run for renaming the app brand from `moc` to `netior`.
- `node scripts/rename-brand.mjs --apply`
  Apply content replacements only.
- `node scripts/rename-brand.mjs --rename-paths`
  Include path rename candidates in the report.
- `node scripts/rename-brand.mjs --apply --rename-paths`
  Apply both content changes and path renames.
