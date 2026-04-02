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
    '@anthropic-ai/claude-agent-sdk',
    '@netior/shared',
    'express',
    'cors',
    'zod',
  ],
});
