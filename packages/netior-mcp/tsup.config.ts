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
  outExtension() {
    return {
      js: '.cjs',
    };
  },
});
