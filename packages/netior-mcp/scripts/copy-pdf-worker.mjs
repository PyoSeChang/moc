import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(scriptDir);
const distDir = join(packageRoot, 'dist');
const source = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
const target = join(distDir, 'pdf.worker.mjs');

mkdirSync(distDir, { recursive: true });
copyFileSync(source, target);

console.log(`Copied pdf.js worker to ${target}`);
