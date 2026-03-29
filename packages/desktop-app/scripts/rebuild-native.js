/**
 * Rebuild better-sqlite3 native module for system Node.js (for vitest).
 * Usage: node scripts/rebuild-native.js
 *
 * After running, better-sqlite3 works with system Node (tests).
 * Run `pnpm rebuild:electron` to switch back for Electron app dev.
 */
const { execSync } = require('child_process');
const { resolve, dirname } = require('path');

const bsPkg = require.resolve('better-sqlite3/package.json');
const bsDir = dirname(bsPkg);

console.log(`[rebuild-native] Rebuilding better-sqlite3 for Node ${process.version}...`);
console.log(`[rebuild-native] Path: ${bsDir}`);

execSync('npx node-gyp rebuild --release', {
  cwd: bsDir,
  stdio: 'inherit',
});

console.log('[rebuild-native] Done.');
