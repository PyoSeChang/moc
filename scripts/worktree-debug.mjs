#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PRESETS = {
  'desktop-debug': {
    description: 'Electron main/preload/window bootstrap debugging.',
    focus: [
      'packages/desktop-app/src/main',
      'packages/desktop-app/src/preload',
    ],
    verify: [
      'pnpm dev:desktop',
    ],
  },
  'renderer-debug': {
    description: 'Renderer, workspace, and UI interaction debugging.',
    focus: [
      'packages/desktop-app/src/renderer',
    ],
    verify: [
      'pnpm dev:desktop',
    ],
  },
  'service-debug': {
    description: 'netior-service, IPC, and core repository debugging.',
    focus: [
      'packages/netior-service',
      'packages/netior-core',
      'packages/desktop-app/src/main/ipc',
    ],
    verify: [
      'pnpm --filter @netior/core test',
      'pnpm dev:desktop',
    ],
  },
  'narre-debug': {
    description: 'Narre runtime, provider, and bridge debugging.',
    focus: [
      'packages/narre-server',
      'packages/desktop-app/src/main/process',
      'packages/desktop-app/src/renderer/components/narre',
    ],
    verify: [
      'pnpm --filter @netior/narre-server build',
      'pnpm dev:desktop',
    ],
  },
  'terminal-debug': {
    description: 'Terminal and agent runtime debugging.',
    focus: [
      'packages/desktop-app/src/main/terminal',
      'packages/desktop-app/src/main/agent-runtime',
      'packages/desktop-app/src/renderer/components/terminal',
    ],
    verify: [
      'pnpm dev:desktop',
    ],
  },
  'integration-debug': {
    description: 'Cross-process startup and smoke debugging.',
    focus: [
      'packages/desktop-app/src/main/process',
      'packages/netior-service',
      'packages/narre-server',
    ],
    verify: [
      'pnpm dev:desktop',
      'pnpm test',
    ],
  },
};

const SETS = {
  debug: [
    'desktop-debug',
    'renderer-debug',
    'service-debug',
    'narre-debug',
    'terminal-debug',
    'integration-debug',
  ],
};

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function runGit(args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    fail(result.error.message);
  }

  const status = result.status ?? 1;
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();

  if (status !== 0 && !allowFailure) {
    fail(stderr || `git ${args.join(' ')} failed with exit code ${status}`);
  }

  return { status, stdout, stderr };
}

function parseArgs(argv) {
  const options = {
    base: 'HEAD',
    dryRun: false,
    help: false,
    branch: null,
    path: null,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--base') {
      index += 1;
      if (index >= argv.length) fail('--base requires a ref');
      options.base = argv[index];
      continue;
    }
    if (arg === '--branch') {
      index += 1;
      if (index >= argv.length) fail('--branch requires a value');
      options.branch = argv[index];
      continue;
    }
    if (arg === '--path') {
      index += 1;
      if (index >= argv.length) fail('--path requires a value');
      options.path = argv[index];
      continue;
    }
    positionals.push(arg);
  }

  return { options, positionals };
}

function resolveRepoContext() {
  const commonDirRaw = runGit(['rev-parse', '--git-common-dir'], process.cwd()).stdout;
  const commonDir = path.resolve(process.cwd(), commonDirRaw);
  const repoRoot = path.dirname(commonDir);
  const head = runGit(['rev-parse', '--short', 'HEAD'], repoRoot).stdout;
  const branch = runGit(['branch', '--show-current'], repoRoot).stdout || '(detached HEAD)';
  const worktreeRoot = path.join(repoRoot, '.claude', 'worktrees');

  return { commonDir, repoRoot, head, branch, worktreeRoot };
}

function slugify(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[\\/\s]+/g, '-')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '');

  if (!slug) {
    fail(`"${value}" does not produce a usable worktree name. Use ASCII letters, numbers, "-", "_" or ".".`);
  }

  return slug;
}

function normalizePath(targetPath) {
  return path.resolve(targetPath).replace(/\\/g, '/').toLowerCase();
}

function isInside(parentPath, childPath) {
  const parent = normalizePath(parentPath);
  const child = normalizePath(childPath);
  return child === parent || child.startsWith(`${parent}/`);
}

function relativeToRepo(repoRoot, targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  return relative && !relative.startsWith('..') ? relative.replace(/\\/g, '/') : targetPath;
}

function getWorktrees(repoRoot) {
  const output = runGit(['worktree', 'list', '--porcelain'], repoRoot).stdout;
  if (!output) return [];

  const worktrees = [];
  let current = null;

  for (const line of output.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('worktree ')) {
      if (current) worktrees.push(current);
      current = {
        path: line.slice('worktree '.length),
        head: '',
        branch: null,
        detached: false,
        prunable: false,
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
      continue;
    }
    if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
      continue;
    }
    if (line === 'detached') {
      current.detached = true;
      continue;
    }
    if (line.startsWith('prunable')) {
      current.prunable = true;
    }
  }

  if (current) worktrees.push(current);
  return worktrees;
}

function branchExists(repoRoot, branchName) {
  return runGit(
    ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`],
    repoRoot,
    { allowFailure: true },
  ).status === 0;
}

function describeSpec(ctx, name, options = {}) {
  const slug = slugify(name);
  const preset = PRESETS[slug] ?? null;
  const branch = options.branch ?? `worktree-${slug}`;
  const targetPath = options.path
    ? path.resolve(options.path)
    : path.join(ctx.worktreeRoot, slug);

  return {
    name: slug,
    branch,
    targetPath,
    description: preset?.description ?? 'Custom debugging worktree.',
    focus: preset?.focus ?? [],
    verify: preset?.verify ?? [],
    preset: preset ? slug : null,
  };
}

function printHeader(ctx, baseRef) {
  console.log(`Repo root     : ${ctx.repoRoot}`);
  console.log(`Common git dir: ${ctx.commonDir}`);
  console.log(`Current ref   : ${ctx.branch} @ ${ctx.head}`);
  console.log(`Base ref      : ${baseRef}`);
  console.log(`Worktree root : ${ctx.worktreeRoot}`);
  console.log('');
}

function printSpec(ctx, spec, state = null) {
  const statusLabel = state ? ` [${state}]` : '';
  console.log(`- ${spec.name}${statusLabel}`);
  console.log(`  branch : ${spec.branch}`);
  console.log(`  path   : ${relativeToRepo(ctx.repoRoot, spec.targetPath)}`);
  console.log(`  scope  : ${spec.description}`);
  if (spec.focus.length > 0) {
    console.log(`  focus  : ${spec.focus.join(', ')}`);
  }
  if (spec.verify.length > 0) {
    console.log(`  verify : ${spec.verify.join(' ; ')}`);
  }
}

function printUsage() {
  console.log('Usage: node scripts/worktree-debug.mjs <command> [args] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list');
  console.log('  create <name> [more names...] [--base <ref>] [--dry-run]');
  console.log('  create-set <set-name> [--base <ref>] [--dry-run]');
  console.log('  help');
  console.log('');
  console.log('Set names:');
  for (const [setName, names] of Object.entries(SETS)) {
    console.log(`  ${setName}: ${names.join(', ')}`);
  }
}

function createWorktree(ctx, spec, baseRef, dryRun) {
  const existingWorktrees = getWorktrees(ctx.repoRoot);
  const pathTaken = existingWorktrees.some((entry) => normalizePath(entry.path) === normalizePath(spec.targetPath));
  if (pathTaken) {
    console.log(`Skipping ${spec.name}: worktree path already exists.`);
    return false;
  }

  if (existsSync(spec.targetPath)) {
    console.log(`Skipping ${spec.name}: path already exists on disk.`);
    return false;
  }

  if (branchExists(ctx.repoRoot, spec.branch)) {
    console.log(`Skipping ${spec.name}: branch ${spec.branch} already exists.`);
    return false;
  }

  mkdirSync(path.dirname(spec.targetPath), { recursive: true });
  const command = ['worktree', 'add', '-b', spec.branch, spec.targetPath, baseRef];

  if (dryRun) {
    console.log(`DRY RUN git ${command.join(' ')}`);
    return true;
  }

  const result = runGit(command, ctx.repoRoot, { allowFailure: true });
  if (result.stdout) process.stdout.write(`${result.stdout}\n`);
  if (result.stderr) process.stderr.write(`${result.stderr}\n`);
  if (result.status !== 0) {
    fail(`failed to create ${spec.name}`);
  }

  return true;
}

function commandList(ctx, baseRef) {
  printHeader(ctx, baseRef);

  const worktrees = getWorktrees(ctx.repoRoot);
  const mainCheckout = worktrees.find((entry) => normalizePath(entry.path) === normalizePath(ctx.repoRoot)) ?? null;
  const managed = worktrees.filter((entry) => isInside(ctx.worktreeRoot, entry.path));
  const external = worktrees.filter(
    (entry) =>
      !isInside(ctx.worktreeRoot, entry.path)
      && normalizePath(entry.path) !== normalizePath(ctx.repoRoot),
  );

  console.log('Debug presets');
  for (const presetName of SETS.debug) {
    const spec = describeSpec(ctx, presetName);
    const existing = managed.find((entry) => normalizePath(entry.path) === normalizePath(spec.targetPath));
    printSpec(ctx, spec, existing ? 'present' : 'missing');
  }
  console.log('');

  console.log('Managed worktrees');
  if (managed.length === 0) {
    console.log('- none');
  } else {
    for (const entry of managed) {
      const branch = entry.branch ?? '(detached HEAD)';
      const status = entry.prunable ? ' prunable' : '';
      console.log(`- ${relativeToRepo(ctx.repoRoot, entry.path)} -> ${branch}${status}`);
    }
  }
  console.log('');

  console.log('Main checkout');
  if (!mainCheckout) {
    console.log(`- ${ctx.repoRoot} -> ${ctx.branch}`);
  } else {
    const branch = mainCheckout.branch ?? '(detached HEAD)';
    const status = mainCheckout.prunable ? ' prunable' : '';
    console.log(`- ${mainCheckout.path} -> ${branch}${status}`);
  }
  console.log('');

  console.log('Other linked worktrees');
  if (external.length === 0) {
    console.log('- none');
  } else {
    for (const entry of external) {
      const branch = entry.branch ?? '(detached HEAD)';
      const status = entry.prunable ? ' prunable' : '';
      console.log(`- ${entry.path} -> ${branch}${status}`);
    }
  }
}

function commandCreate(ctx, names, options) {
  if (names.length === 0) fail('create requires at least one worktree name');
  if (names.length > 1 && (options.branch || options.path)) {
    fail('--branch and --path can only be used when creating a single worktree');
  }

  printHeader(ctx, options.base);

  const specs = names.map((name) => describeSpec(ctx, name, options));
  console.log('Plan');
  for (const spec of specs) {
    printSpec(ctx, spec);
  }
  console.log('');

  let created = 0;
  for (const spec of specs) {
    if (createWorktree(ctx, spec, options.base, options.dryRun)) {
      created += 1;
    }
  }

  console.log('');
  console.log(`${options.dryRun ? 'Planned' : 'Created'} ${created} worktree(s).`);
}

function commandCreateSet(ctx, setName, options) {
  const names = SETS[setName];
  if (!names) fail(`unknown set "${setName}"`);
  commandCreate(ctx, names, options);
}

const argv = process.argv.slice(2);
const { options, positionals } = parseArgs(argv);
const command = positionals[0] ?? 'help';

if (options.help || command === 'help') {
  printUsage();
  process.exit(0);
}

const ctx = resolveRepoContext();

switch (command) {
  case 'list':
    commandList(ctx, options.base);
    break;
  case 'create':
    commandCreate(ctx, positionals.slice(1), options);
    break;
  case 'create-set':
    commandCreateSet(ctx, positionals[1], options);
    break;
  default:
    printUsage();
    fail(`unknown command "${command}"`);
}
