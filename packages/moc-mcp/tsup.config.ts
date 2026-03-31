import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'better-sqlite3',
    '@moc/core',
    '@moc/shared',
    '@modelcontextprotocol/sdk',
    /^@modelcontextprotocol\/sdk\//,
    'zod',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
