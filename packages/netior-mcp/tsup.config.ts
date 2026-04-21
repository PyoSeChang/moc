import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node22',
  platform: 'node',
  external: [],
  noExternal: [/.*/],
  onSuccess: 'node scripts/copy-pdf-worker.mjs',
  outExtension() {
    return {
      js: '.cjs',
    };
  },
});
