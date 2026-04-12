import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const packages = [
  {
    label: '@netior/shared',
    filter: '@netior/shared',
    outputs: ['packages/shared/dist/index.js'],
  },
  {
    label: '@netior/core',
    filter: '@netior/core',
    outputs: ['packages/netior-core/dist/index.js'],
  },
  {
    label: '@netior/service',
    filter: '@netior/service',
    outputs: ['packages/netior-service/dist/index.js'],
  },
  {
    label: '@netior/narre-server',
    filter: '@netior/narre-server',
    outputs: ['packages/narre-server/dist/index.cjs'],
  },
];

const missing = packages.filter((pkg) =>
  pkg.outputs.some((output) => !existsSync(join(repoRoot, output))),
);

if (missing.length === 0) {
  console.log('[predev:desktop] All required sidecar dist outputs already exist');
  process.exit(0);
}

for (const pkg of missing) {
  console.log(`[predev:desktop] Missing dist for ${pkg.label}, running build`);
  const result = spawnSync('pnpm', ['--filter', pkg.filter, 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

